import { supabaseAdmin } from './supabase';
import { normalizeWhatsAppNumber } from './whatsapp-notification-service';

/** Cancela somente o saque pendente mais recente cuja loja tenha o mesmo WhatsApp. */
export async function cancelLatestWithdrawalByWhatsApp(phone: string) {
  const normalizedPhone = normalizeWhatsAppNumber(phone);
  if (!normalizedPhone) return { cancelled: false, reason: 'invalid_phone' as const };

  const { data: pending, error } = await supabaseAdmin
    .from('withdrawals')
    .select('id, store_id, requested_at')
    .in('status', ['PENDING', 'PROCESSING'])
    .order('requested_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  if (!pending?.length) return { cancelled: false, reason: 'not_found' as const };

  const storeIds = [...new Set(pending.map(item => item.store_id).filter(Boolean))];
  const { data: stores, error: storesError } = await supabaseAdmin
    .from('stores')
    .select('id, whatsapp')
    .in('id', storeIds);
  if (storesError) throw storesError;

  const matchedStoreIds = new Set((stores || [])
    .filter(store => normalizeWhatsAppNumber(store.whatsapp) === normalizedPhone)
    .map(store => store.id));
  const target = pending.find(item => matchedStoreIds.has(item.store_id));
  if (!target) return { cancelled: false, reason: 'not_found' as const };

  const { data: result, error: cancelError } = await supabaseAdmin.rpc('cancel_withdrawal_by_whatsapp', {
    p_withdrawal_id: target.id,
    p_phone_e164: normalizedPhone,
  });
  if (cancelError) throw cancelError;
  return { cancelled: result?.success === true, reason: result?.error || null, withdrawalId: target.id };
}
