import { supabase } from './supabase';
import { Affiliate, AffiliateStatus } from './types';

export async function getStoreAffiliates(storeId: string): Promise<Affiliate[]> {
  const { data, error } = await supabase
    .from('affiliates')
    .select(`
      *,
      user:auth.users(id, email, raw_user_meta_data)
    `)
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching affiliates:', error);
    return [];
  }
  
  // Map the raw_user_meta_data to match StudentProfile format for ease of use
  return data.map((item: any) => ({
    ...item,
    user: item.user ? {
      id: item.user.id,
      email: item.user.email,
      full_name: item.user.raw_user_meta_data?.full_name || 'Desconhecido',
      avatar_url: item.user.raw_user_meta_data?.avatar_url
    } : null
  })) as Affiliate[];
}

export async function updateAffiliateStatus(affiliateId: string, status: AffiliateStatus): Promise<boolean> {
  const { error } = await supabase
    .from('affiliates')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', affiliateId);

  if (error) {
    console.error('Error updating affiliate status:', error);
    return false;
  }

  return true;
}

export async function getMyAffiliations(): Promise<Affiliate[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('affiliates')
    .select(`
      *,
      store:stores(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching my affiliations:', error);
    return [];
  }

  return data as Affiliate[];
}

export async function applyForAffiliation(storeId: string): Promise<{ success: boolean; message: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Usuário não autenticado' };

  // Check if already applied
  const { data: existing } = await supabase
    .from('affiliates')
    .select('id')
    .eq('store_id', storeId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    return { success: false, message: 'Você já enviou uma solicitação para esta loja.' };
  }

  const { error } = await supabase
    .from('affiliates')
    .insert([
      {
        store_id: storeId,
        user_id: user.id,
        status: 'pendente'
      }
    ]);

  if (error) {
    console.error('Error applying for affiliation:', error);
    return { success: false, message: 'Erro ao enviar solicitação.' };
  }

  return { success: true, message: 'Solicitação enviada com sucesso!' };
}

export async function updateAffiliateCommission(affiliateId: string, commission_rate: number | null): Promise<boolean> {
  const { error } = await supabase
    .from('affiliates')
    .update({ commission_rate, updated_at: new Date().toISOString() })
    .eq('id', affiliateId);

  if (error) {
    console.error('Error updating commission rate:', error);
    return false;
  }

  return true;
}

export async function getAffiliateApprovedProducts(affiliateUserId: string): Promise<any[]> {
  // 1. Fetch approved affiliations
  const { data: affiliations, error } = await supabase
    .from('affiliates')
    .select('store_id, commission_type, commission_rate, id')
    .eq('user_id', affiliateUserId)
    .eq('status', 'aprovado');

  if (error || !affiliations || affiliations.length === 0) {
    return [];
  }

  const storeIds = affiliations.map(a => a.store_id);

  // 2. Fetch all public products for those stores
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*, store:stores(nome_loja, slug, id, logo_url)')
    .in('store_id', storeIds)
    .eq('status', 'publicado')
    .is('excluido_em', null)
    .order('created_at', { ascending: false });

  if (productsError || !products) return [];

  // 3. Map to include affiliate data
  return products.map(p => {
    const affiliation = affiliations.find(a => a.store_id === p.store_id);
    return {
      ...p,
      affiliateInfo: affiliation
    };
  });
}

export async function getAffiliateProfile(userId: string) {
  // We fetch their store data which acts as their profile
  const { data, error } = await supabase
    .from('stores')
    .select('nome_loja, logo_url, banner_url, descricao, slug')
    .eq('creator_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}
