import { supabase, supabaseAdmin } from './supabase';
import { Affiliate, AffiliateStatus } from './types';

// getStoreAffiliates was removed because auth.users cannot be joined securely from the client.
// Use getStoreAffiliatesAction from src/app/actions/affiliate-actions.ts instead.

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

export async function getAvailableMarketplaceStores(): Promise<any[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('id, nome_loja, slug, logo_url, descricao, affiliate_commission_type, affiliate_commission_rate')
    .eq('affiliate_program_enabled', true)
    .order('created_at', { ascending: false });
    
  if (error) return [];
  return data;
}

export async function applyForAffiliation(storeId: string): Promise<{ success: boolean; message: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Usuário não autenticado' };

  // Check if already applied to this store
  const { data: existing } = await supabase
    .from('affiliates')
    .select('id')
    .eq('store_id', storeId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    return { success: false, message: 'Você já é afiliado ou possui uma solicitação pendente para esta loja.' };
  }

  const { error } = await supabase
    .from('affiliates')
    .insert([
      {
        store_id: storeId,
        user_id: user.id,
        status: 'pendente' // Fixed to pendente
      }
    ]);

  if (error) {
    console.error('Error applying for store affiliation:', error);
    return { success: false, message: 'Erro ao enviar solicitação.' };
  }

  return { success: true, message: 'Solicitação de afiliação enviada com sucesso! Aguarde a aprovação do dono da loja.' };
}

export async function applyForProductAffiliation(productId: string, storeId: string): Promise<{ success: boolean; message: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Usuário não autenticado' };

  // Check if already applied (checks store, since affiliation is store-based)
  const { data: existing } = await supabase
    .from('affiliates')
    .select('id')
    .eq('store_id', storeId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    return { success: false, message: 'Você já possui uma afiliação ou solicitação pendente para a loja deste produto.' };
  }

  const { error } = await supabase
    .from('affiliates')
    .insert([
      {
        store_id: storeId,
        user_id: user.id,
        status: 'pendente' // Forced pending status
      }
    ]);

  if (error) {
    console.error('Error applying for product affiliation:', error);
    return { success: false, message: 'Erro ao enviar solicitação.' };
  }

  return { success: true, message: 'Solicitação de afiliação enviada com sucesso! Aguarde a aprovação do dono da loja.' };
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

// ============================================================================
// ETAPA 8: SAQUES DE AFILIADOS
// ============================================================================

export async function getAffiliateAvailableBalance(userId: string): Promise<number> {
  if (!userId) return 0;
  let availableBalance = 0;

  try {
    const { data, error } = await supabaseAdmin
      .from('wallet_transactions')
      .select('net_amount')
      .eq('creator_id', userId)
      .eq('status', 'COMPLETED');

    if (!error && data) {
      availableBalance = data.reduce((sum, tx) => sum + Number(tx.net_amount), 0);
    }
  } catch (err) {
    console.error('[getAffiliateAvailableBalance] Erro:', err);
  }

  return Math.max(0, availableBalance);
}

export async function requestAffiliateWithdrawal(data: {
  userId: string;
  amount: number;
  userProfileCpf: string;
}): Promise<any> {
  const { WITHDRAWAL_ENABLED, MIN_WITHDRAWAL_AMOUNT, getActiveCreatorPixKey } = await import('./withdrawal-service');
  
  if (!WITHDRAWAL_ENABLED) {
    throw new Error('Os saques estão temporariamente indisponíveis.');
  }

  if (data.amount < MIN_WITHDRAWAL_AMOUNT) {
    throw new Error(`O valor mínimo para saque é de R$ ${MIN_WITHDRAWAL_AMOUNT.toFixed(2).replace('.', ',')}.`);
  }

  // 1. O Afiliado tem um perfil de loja para ancorar a chave PIX
  const affiliateStore = await getAffiliateProfile(data.userId);
  if (!affiliateStore) {
    throw new Error('Perfil de afiliado não encontrado.');
  }

  const { data: storeData } = await supabaseAdmin
    .from('stores')
    .select('id')
    .eq('creator_id', data.userId)
    .single();

  const affiliateStoreId = storeData?.id;
  if (!affiliateStoreId) {
    throw new Error('Erro de integridade do perfil do afiliado.');
  }

  // 2. Chave PIX do Afiliado
  const activeKey = await getActiveCreatorPixKey(affiliateStoreId);
  if (!activeKey || activeKey.validationStatus !== 'VALID') {
    throw new Error('Você precisa cadastrar e validar uma chave PIX CPF antes de solicitar um saque.');
  }

  const now = new Date().toISOString();
  const withdrawalId = `wtd_aff_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const externalRef = `withdrawal-${withdrawalId}`;

  // 3. Trava Atômica (Previne Race Condition e verifica saldo)
  const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('process_affiliate_withdrawal_safe', {
    p_creator_id: data.userId,
    p_amount: data.amount,
    p_pix_key_id: activeKey.id,
    p_pix_key_type: 'CPF',
    p_pix_key_masked: activeKey.pixKeyMasked,
    p_asaas_external_ref: externalRef,
    p_withdrawal_id: withdrawalId,
    p_store_id: affiliateStoreId
  });

  if (rpcError) {
    console.error('[requestAffiliateWithdrawal] Erro RPC:', rpcError);
    throw new Error(`Erro interno: ${rpcError.message}`);
  }

  if (!rpcResult.success) {
    throw new Error(rpcResult.error || 'Não foi possível processar o saque de forma segura.');
  }

  // 4. Criação da Transferência no Asaas
  const { createAsaasTransfer } = await import('./asaas-service');
  const { recordWalletTransaction } = await import('./wallet-service');

  try {
    const asaasTransfer = await createAsaasTransfer({
      value: data.amount,
      pixAddressKey: activeKey.pixKey,
      pixAddressKeyType: 'CPF',
      description: `Saque Afiliado Educalizando — Ref ${withdrawalId.substring(8, 14).toUpperCase()}`,
      externalReference: externalRef
    });

    await supabaseAdmin.from('withdrawals').update({
      status: 'PROCESSING',
      asaas_transfer_id: asaasTransfer.id,
      processing_at: new Date().toISOString()
    }).eq('id', withdrawalId);

    return { success: true, withdrawalId };

  } catch (err: any) {
    console.error('[requestAffiliateWithdrawal] Erro ao criar transferência Asaas:', err);

    const failureReason = err.message || 'Falha na API de transferência Asaas.';
    
    // Atualiza status do saque
    await supabaseAdmin.from('withdrawals').update({
      status: 'FAILED',
      failure_reason: failureReason,
      failed_at: new Date().toISOString()
    }).eq('id', withdrawalId);

    // Estorna a reserva de saldo
    await recordWalletTransaction({
      storeId: affiliateStoreId,
      creatorId: data.userId,
      orderId: withdrawalId,
      type: 'ADJUSTMENT',
      grossAmount: data.amount,
      platformFixedFeeAmount: 0,
      platformPercentageFeeAmount: 0,
      platformFeeAmount: 0,
      asaasFeeAmount: 0,
      netAmount: data.amount,
      description: `Devolução de saldo por falha no saque (${failureReason})`
    });

    throw new Error(`Não foi possível concluir seu saque: ${failureReason}. O valor permaneceu no seu saldo.`);
  }
}