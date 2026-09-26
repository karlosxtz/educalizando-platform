import { supabaseAdmin } from './supabase';

export const CREATOR_REFERRAL_RATE_PERCENT = 3;
export const CREATOR_REFERRAL_MONTHS = 12;

function code(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
}

export async function getOrCreateCreatorReferralCode(creatorId: string, storeId: string) {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('creator_referral_codes').select('code').eq('creator_id', creatorId).maybeSingle();
  if (existingError) throw existingError;
  if (existing) return existing.code as string;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data, error } = await supabaseAdmin
      .from('creator_referral_codes')
      .insert({ creator_id: creatorId, store_id: storeId, code: code() })
      .select('code').maybeSingle();
    if (data?.code) return data.code as string;
    if (error?.code !== '23505') throw error;
    const { data: concurrent } = await supabaseAdmin
      .from('creator_referral_codes').select('code').eq('creator_id', creatorId).maybeSingle();
    if (concurrent?.code) return concurrent.code as string;
  }
  throw new Error('Não foi possível criar um código de indicação agora.');
}

export async function attributeCreatorReferral(referredCreatorId: string, referralCode: string) {
  const normalizedCode = referralCode.trim().toUpperCase();
  if (!/^[A-Z0-9]{8,20}$/.test(normalizedCode)) return { attributed: false, reason: 'invalid_code' as const };

  const { data: referredStore, error: referredStoreError } = await supabaseAdmin
    .from('stores').select('id, creator_id').eq('creator_id', referredCreatorId).maybeSingle();
  if (referredStoreError) throw referredStoreError;
  if (!referredStore) return { attributed: false, reason: 'no_store' as const };

  const { data: existing } = await supabaseAdmin
    .from('creator_referrals').select('id').eq('referred_creator_id', referredCreatorId).maybeSingle();
  if (existing) return { attributed: false, reason: 'already_attributed' as const };

  const { data: referralCodeRow } = await supabaseAdmin
    .from('creator_referral_codes').select('id, creator_id, store_id, is_active').eq('code', normalizedCode).maybeSingle();
  if (!referralCodeRow || !referralCodeRow.is_active || referralCodeRow.creator_id === referredCreatorId) {
    return { attributed: false, reason: 'ineligible' as const };
  }

  const attributedAt = new Date();
  const eligibleUntil = new Date(attributedAt);
  eligibleUntil.setUTCMonth(eligibleUntil.getUTCMonth() + CREATOR_REFERRAL_MONTHS);
  const { error: insertError } = await supabaseAdmin.from('creator_referrals').insert({
    referral_code_id: referralCodeRow.id,
    referrer_creator_id: referralCodeRow.creator_id,
    referrer_store_id: referralCodeRow.store_id,
    referred_creator_id: referredCreatorId,
    referred_store_id: referredStore.id,
    rate_percent: CREATOR_REFERRAL_RATE_PERCENT,
    attributed_at: attributedAt.toISOString(),
    eligible_until: eligibleUntil.toISOString(),
  });
  if (insertError?.code === '23505') return { attributed: false, reason: 'already_attributed' as const };
  if (insertError) throw insertError;
  return { attributed: true, eligibleUntil: eligibleUntil.toISOString() };
}

export async function getActiveCreatorReferralForStore(storeId: string, subtotal: number) {
  const now = new Date().toISOString();
  const { data } = await supabaseAdmin.from('creator_referrals')
    .select('id, rate_percent')
    .eq('referred_store_id', storeId).eq('status', 'active').gt('eligible_until', now).maybeSingle();
  if (!data) return null;
  const amount = Number((subtotal * (Number(data.rate_percent) / 100)).toFixed(2));
  return amount > 0 ? { referralId: data.id as string, commissionAmount: amount } : null;
}

export async function createCreatorReferralCommission(order: {
  id: string; storeId: string; subtotalAmount: number; platformFeeAmount: number;
  creatorReferralId?: string | null; creatorReferralCommissionAmount?: number | null;
}) {
  if (!order.creatorReferralId || !(Number(order.creatorReferralCommissionAmount) > 0)) return null;
  const { data: referral } = await supabaseAdmin.from('creator_referrals')
    .select('referrer_creator_id, referrer_store_id, referred_store_id, rate_percent, status, eligible_until')
    .eq('id', order.creatorReferralId).maybeSingle();
  if (!referral || referral.status !== 'active' || referral.referred_store_id !== order.storeId || new Date(referral.eligible_until) <= new Date()) return null;
  const amount = Number(order.creatorReferralCommissionAmount);
  if (amount > Number(order.platformFeeAmount)) throw new Error('Comissão de indicação excede a taxa da plataforma.');
  const { data, error } = await supabaseAdmin.from('creator_referral_commissions').insert({
    referral_id: order.creatorReferralId, order_id: order.id,
    beneficiary_creator_id: referral.referrer_creator_id, beneficiary_store_id: referral.referrer_store_id,
    referred_store_id: referral.referred_store_id, rate_percent: referral.rate_percent,
    sale_subtotal_amount: order.subtotalAmount, platform_fee_amount: order.platformFeeAmount,
    commission_amount: amount, status: 'available', available_at: new Date().toISOString(),
  }).select('beneficiary_creator_id, beneficiary_store_id, commission_amount').maybeSingle();
  if (error?.code === '23505') {
    const { data: existing } = await supabaseAdmin.from('creator_referral_commissions')
      .select('beneficiary_creator_id, beneficiary_store_id, commission_amount').eq('order_id', order.id).maybeSingle();
    return existing || null;
  }
  if (error) throw error;
  return data;
}

export async function reverseCreatorReferralCommission(orderId: string) {
  const { data: commission } = await supabaseAdmin.from('creator_referral_commissions')
    .select('id, beneficiary_creator_id, beneficiary_store_id, commission_amount, status')
    .eq('order_id', orderId).maybeSingle();
  if (!commission || commission.status === 'reversed') return null;
  const { error } = await supabaseAdmin.from('creator_referral_commissions').update({
    status: 'reversed', reversed_at: new Date().toISOString(), reversal_reason: 'Pedido estornado'
  }).eq('id', commission.id).eq('status', 'available');
  if (error) throw error;
  return commission;
}

export async function getCreatorReferralDashboard(creatorId: string, storeId: string) {
  const codeValue = await getOrCreateCreatorReferralCode(creatorId, storeId);
  const { data: referrals, error } = await supabaseAdmin.from('creator_referrals')
    .select('id, referred_store_id, eligible_until, status').eq('referrer_creator_id', creatorId).order('created_at', { ascending: false });
  if (error) throw error;
  const referralIds = (referrals || []).map((item) => item.id);
  const { data: commissions } = referralIds.length ? await supabaseAdmin.from('creator_referral_commissions')
    .select('commission_amount, status').in('referral_id', referralIds) : { data: [] as Array<{ commission_amount: number; status: string }> };
  const total = (commissions || []).reduce((sum, item) => sum + Number(item.commission_amount || 0), 0);
  return { code: codeValue, referrals: referrals || [], totalCommission: Number(total.toFixed(2)) };
}
