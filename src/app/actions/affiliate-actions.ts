'use server';

import { supabaseAdmin, supabase } from '@/lib/supabase';
import { Affiliate } from '@/lib/types';
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

export async function getStoreAffiliatesAction(storeId: string): Promise<Affiliate[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Verify ownership to prevent unauthorized access
  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('id', storeId)
    .eq('creator_id', user.id)
    .single();

  if (!store) {
    console.error('getStoreAffiliatesAction: Acesso negado. Usuário não é dono da loja.');
    return [];
  }

  // Fetch using supabaseAdmin, BUT WITHOUT the invalid auth.users join
  const { data, error } = await supabaseAdmin
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
