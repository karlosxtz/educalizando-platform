'use server';

import { supabaseAdmin } from '@/lib/supabase';

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
    .select('*, store:stores!inner(nome_loja, logo_url, affiliate_program_enabled)')
    .eq('status', 'publicado')
    .is('excluido_em', null)
    .eq('store.affiliate_program_enabled', true)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching marketplace products:', error);
    return [];
  }
  return data || [];
}
