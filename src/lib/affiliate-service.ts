import { supabase, supabaseAdmin } from './supabase';
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
    .select('store_id, product_id, commission_type, commission_rate, id')
    .eq('user_id', affiliateUserId)
    .eq('status', 'aprovado');

  if (error || !affiliations || affiliations.length === 0) {
    return [];
  }

  const storeIds = affiliations.filter(a => !a.product_id).map(a => a.store_id);
  const productIds = affiliations.filter(a => a.product_id).map(a => a.product_id);

  // 2. Fetch all public products for those stores OR specific products
  let query = supabase
    .from('products')
    .select('*, store:stores(nome_loja, slug, id, logo_url)')
    .eq('status', 'publicado')
    .is('excluido_em', null);

  if (storeIds.length > 0 && productIds.length > 0) {
    query = query.or(`store_id.in.(${storeIds.join(',')}),id.in.(${productIds.join(',')})`);
  } else if (storeIds.length > 0) {
    query = query.in('store_id', storeIds);
  } else if (productIds.length > 0) {
    query = query.in('id', productIds);
  }

  const { data: products, error: productsError } = await query.order('created_at', { ascending: false });

  if (productsError || !products) return [];

  // 3. Map to include affiliate data
  return products.map(p => {
    // try finding by product first, then by store
    const affiliation = affiliations.find(a => a.product_id === p.id) || affiliations.find(a => a.store_id === p.store_id && !a.product_id);
    return {
      ...p,
      affiliateInfo: affiliation
    };
  });
}

export async function getAvailableMarketplaceProducts(): Promise<any[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, store:stores(nome_loja, logo_url)')
    .eq('status', 'publicado')
    .is('excluido_em', null)
    .eq('allow_affiliates', true)
    .order('created_at', { ascending: false });
    
  if (error) return [];
  return data;
}

export async function applyForProductAffiliation(productId: string, storeId: string, autoApprove: boolean = true): Promise<{ success: boolean; message: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Usuário não autenticado' };

  // Check if already applied
  const { data: existing } = await supabase
    .from('affiliates')
    .select('id')
    .eq('product_id', productId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    return { success: false, message: 'Você já é afiliado deste produto.' };
  }

  const { error } = await supabase
    .from('affiliates')
    .insert([
      {
        store_id: storeId,
        product_id: productId,
        user_id: user.id,
        status: autoApprove ? 'aprovado' : 'pendente' // Product level affiliations default to auto approve if set
      }
    ]);

  if (error) {
    console.error('Error applying for product affiliation:', error);
    return { success: false, message: 'Erro ao enviar solicitação.' };
  }

  return { success: true, message: autoApprove ? 'Afiliação concluída com sucesso! O produto já está na sua vitrine.' : 'Solicitação enviada com sucesso!' };
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

export async function calculateAffiliateCommission({
  affiliateId,
  storeId,
  buyerId,
  baseSubtotal
}: {
  affiliateId: string | null;
  storeId: string;
  buyerId: string;
  baseSubtotal: number;
}): Promise<{ affiliateCommissionAmount: number; affiliateId: string | null }> {
  if (!affiliateId || !storeId || !buyerId || baseSubtotal <= 0) {
    return { affiliateCommissionAmount: 0, affiliateId: null };
  }

  try {
    const { data: affiliate } = await supabaseAdmin
      .from('affiliates')
      .select(`
        id, 
        user_id,
        status, 
        commission_type, 
        commission_rate, 
        stores (
          affiliate_program_enabled, 
          affiliate_commission_type, 
          affiliate_commission_rate
        )
      `)
      .eq('id', affiliateId)
      .eq('store_id', storeId)
      .single();

    if (!affiliate) {
      return { affiliateCommissionAmount: 0, affiliateId: null };
    }

    // BLOQUEIO DEFINITIVO DE SELF-REFERRAL / AUTOAFILIAÇÃO
    // Se o comprador for o próprio dono do link de afiliado, a comissão é 0.
    // O pedido segue normalmente, apenas a comissão é anulada.
    if (affiliate.user_id === buyerId) {
      console.log(`[AffiliateService] Self-referral bloqueado: Comprador ${buyerId} tentou usar o próprio link de afiliado ${affiliateId}`);
      return { affiliateCommissionAmount: 0, affiliateId: null };
    }

    if (affiliate.status !== 'aprovado') {
      return { affiliateCommissionAmount: 0, affiliateId: null };
    }

    const storeConfig = Array.isArray(affiliate.stores) ? affiliate.stores[0] : affiliate.stores;
    if (!storeConfig || !storeConfig.affiliate_program_enabled) {
      return { affiliateCommissionAmount: 0, affiliateId: null };
    }

    const rate = affiliate.commission_rate ?? storeConfig.affiliate_commission_rate ?? 0;
    const type = affiliate.commission_type ?? storeConfig.affiliate_commission_type ?? 'percentual';

    if (rate <= 0) {
      return { affiliateCommissionAmount: 0, affiliateId: affiliate.id };
    }

    let commission = 0;
    if (type === 'percentual') {
      commission = baseSubtotal * (Number(rate) / 100);
    } else {
      commission = Math.min(Number(rate), baseSubtotal);
    }

    // Retornar arredondado em 2 casas decimais (centavos)
    return { 
      affiliateCommissionAmount: Number(commission.toFixed(2)), 
      affiliateId: affiliate.id 
    };
  } catch (error) {
    console.error('[calculateAffiliateCommission] Erro:', error);
    return { affiliateCommissionAmount: 0, affiliateId: null };
  }
}
