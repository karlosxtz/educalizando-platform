'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { getRequestUser } from '@/lib/api-auth';

export async function syncCustomerNamesByEmails(emails: string[]): Promise<Record<string, string>> {
  if (!emails || emails.length === 0) return {};

  try {
    const currentUser = await getRequestUser(new Request('http://localhost'));
    if (!currentUser) return {};

    const normalizedEmails = [...new Set(emails
      .filter((email): email is string => typeof email === 'string')
      .map(email => email.toLowerCase().trim())
      .filter(Boolean))]
      .slice(0, 500);
    if (normalizedEmails.length === 0) return {};

    const { data: ownedStores } = await supabaseAdmin
      .from('stores')
      .select('id')
      .eq('creator_id', currentUser.id);
    const storeIds = (ownedStores || []).map(store => store.id);
    if (storeIds.length === 0) return {};

    const { data: ownedOrders } = await supabaseAdmin
      .from('orders')
      .select('buyer_email')
      .in('store_id', storeIds)
      .in('buyer_email', normalizedEmails);
    const allowedEmails = new Set((ownedOrders || [])
      .map(order => order.buyer_email?.toLowerCase().trim())
      .filter(Boolean));
    if (allowedEmails.size === 0) return {};

    // Admin listUsers method is paginated, but we can fetch the first page or search
    // Since we don't have a direct "getByEmails", we'll fetch up to 1000 users and filter
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    if (error || !users) {
      console.error('[syncCustomerNamesByEmails] Erro ao listar usuários:', error);
      return {};
    }

    const emailToNameMap: Record<string, string> = {};
    for (const user of users) {
      if (user.email && allowedEmails.has(user.email.toLowerCase().trim())) {
        const fullName = user.user_metadata?.full_name;
        if (fullName) {
          emailToNameMap[user.email.toLowerCase().trim()] = fullName;
        }
      }
    }

    return emailToNameMap;

  } catch (err) {
    console.error('[syncCustomerNamesByEmails] Exceção:', err);
    return {};
  }
}
