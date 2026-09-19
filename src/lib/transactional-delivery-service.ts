import { allowsLocalDevelopmentFallback, getSupabaseConfigurationError, isRealSupabaseConfigured, supabaseAdmin } from './supabase';

export type TransactionalDeliveryChannel = 'EMAIL' | 'WHATSAPP';
export type TransactionalDeliveryEvent = 'PAYMENT_CONFIRMED' | 'MATERIAL_DELIVERY' | 'CREATOR_SALE_ALERT';

/**
 * Reserva um envio transacional de forma atômica. A chave única no banco é a
 * garantia contra reenvio quando um provedor de pagamento repete o webhook.
 * Uma tentativa que falhou pode ser reservada novamente numa execução futura.
 */
export async function claimTransactionalDelivery(
  orderId: string,
  channel: TransactionalDeliveryChannel,
  eventType: TransactionalDeliveryEvent,
): Promise<string | null> {
  if (!isRealSupabaseConfigured()) {
    if (!allowsLocalDevelopmentFallback()) throw getSupabaseConfigurationError();
    return 'local-development';
  }

  const processing = {
    status: 'PROCESSING',
    last_attempt_at: new Date().toISOString(),
  };

  const retry = await supabaseAdmin
    .from('transactional_delivery_attempts')
    .update(processing)
    .eq('order_id', orderId)
    .eq('channel', channel)
    .eq('event_type', eventType)
    .eq('status', 'FAILED')
    .select('id')
    .maybeSingle();

  if (retry.error) throw retry.error;
  if (retry.data?.id) return retry.data.id;

  const created = await supabaseAdmin
    .from('transactional_delivery_attempts')
    .insert({
      order_id: orderId,
      channel,
      event_type: eventType,
      ...processing,
      attempts: 1,
    })
    .select('id')
    .maybeSingle();

  // Outra execução já reservou ou concluiu este mesmo envio.
  if (created.error?.code === '23505') return null;
  if (created.error) throw created.error;
  return created.data?.id || null;
}

export async function completeTransactionalDelivery(id: string, providerMessageId?: string): Promise<void> {
  if (!isRealSupabaseConfigured() || id === 'local-development') return;
  const { error } = await supabaseAdmin
    .from('transactional_delivery_attempts')
    .update({
      status: 'SENT',
      provider_message_id: providerMessageId || null,
      sent_at: new Date().toISOString(),
      last_error: null,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function failTransactionalDelivery(id: string, errorMessage: string): Promise<void> {
  if (!isRealSupabaseConfigured() || id === 'local-development') return;
  const { error } = await supabaseAdmin
    .from('transactional_delivery_attempts')
    .update({
      status: 'FAILED',
      last_error: errorMessage.slice(0, 1000),
      last_attempt_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}
