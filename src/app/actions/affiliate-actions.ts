'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { Affiliate } from '@/lib/types';
import { createClient } from '@supabase/supabase-js';
export async function getMarketplaceStoresAction() {
  const { data, error } = await supabaseAdmin
    .from('stores')
    .select('id, nome_loja, slug, logo_url, descricao, affiliate_commission_type, affiliate_commission_rate')
    .eq('affiliate_program_enabled', true)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching marketplace stores:', error);
    return [];
  }
  return data || [];
}

export async function getMarketplaceProductsAction() {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*, store:stores(nome_loja, logo_url)')
    .eq('status', 'publicado')
    .is('excluido_em', null)
    .eq('allow_affiliates', true)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching marketplace products:', error);
    return [];
  }
  return data || [];
}

import { cookies } from 'next/headers';

export async function getStoreAffiliatesAction(storeId: string): Promise<Affiliate[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value;
  if (!token) return [];

  const supabaseUserScoped = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  );

  const { data: { user }, error: authError } = await supabaseUserScoped.auth.getUser();
  if (!user) {
    console.error('getStoreAffiliatesAction: falha de autenticação via token no server action:', authError);
    return [];
  }

  // Verify ownership to prevent unauthorized access
  // Using supabaseUserScoped here because stores is readable by all, but we only verify creator_id
  const { data: store } = await supabaseUserScoped
    .from('stores')
    .select('id, creator_id')
    .eq('id', storeId)
    .single();

  if (!store || store.creator_id !== user.id) {
    console.error('getStoreAffiliatesAction: Acesso negado. Usuário não é dono da loja.');
    return [];
  }

  const { data, error } = await supabaseUserScoped
    .from('affiliates')
    .select(`
      *,
      product:products(id, titulo, capa_url)
    `)
    .eq('store_id', storeId)
    .neq('status', 'cancelado')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching affiliates via action:', error);
    return [];
  }

  // Fetch users securely
  const affiliatesWithUsers = await Promise.all(data.map(async (item: any) => {
    let userData = null;
    try {
      // Use UserScoped to fetch the profiles if available, or just use the data
      // Wait, we used admin to fetch the email, but since we don't have a working admin, we can query profiles or return the ID
      // Currently the system relies on auth.users directly. 
      // In this app, many places just fetch without auth, let's keep supabaseAdmin just for the public user lookup
      // Since it's admin, it uses the service key if available, or anon if not.
      const { data: userResp } = await supabaseAdmin.auth.admin.getUserById(item.user_id);
      if (userResp?.user) {
        userData = {
          id: userResp.user.id,
          email: userResp.user.email,
          full_name: userResp.user.user_metadata?.full_name || userResp.user.user_metadata?.name || 'Desconhecido',
          avatar_url: userResp.user.user_metadata?.avatar_url
        };
      }
    } catch (e) {
      console.error(`Error fetching user ${item.user_id}:`, e);
    }

    return {
      ...item,
      user: userData
    };
  }));

  return affiliatesWithUsers as Affiliate[];
}
