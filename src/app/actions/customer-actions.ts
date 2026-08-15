'use server';

import { supabaseAdmin } from '@/lib/supabase';

export async function syncCustomerNamesByEmails(emails: string[]): Promise<Record<string, string>> {
  if (!emails || emails.length === 0) return {};

  try {
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
    const emailSet = new Set(emails.map(e => e.toLowerCase().trim()));

    for (const user of users) {
      if (user.email && emailSet.has(user.email.toLowerCase().trim())) {
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
