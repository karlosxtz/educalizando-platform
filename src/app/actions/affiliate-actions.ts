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

  // Fetch using supabaseAdmin to securely join auth.users
  const { data, error } = await supabaseAdmin
    .from('affiliates')
    .select(`
      *,
      user:auth.users(id, email, raw_user_meta_data)
    `)
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching affiliates via action:', error);
    return [];
  }

  // Map to match the interface
  return data.map((item: any) => ({
    ...item,
    user: item.user ? {
      id: item.user.id,
      email: item.user.email,
      full_name: item.user.raw_user_meta_data?.full_name || item.user.raw_user_meta_data?.name || 'Desconhecido',
      avatar_url: item.user.raw_user_meta_data?.avatar_url
    } : null
  })) as Affiliate[];
}
