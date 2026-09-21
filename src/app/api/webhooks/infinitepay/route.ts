import { NextResponse } from 'next/server';
import { checkInfinitePayPayment } from '@/lib/infinitepay-service';
import { getOrderRecordById, updateOrderStatus } from '@/lib/order-service';
import { supabaseAdmin } from '@/lib/supabase';
import { notifyConfirmedSale } from '@/lib/sale-notification-service';
import {
  assertConfirmedInfinitePayPayment,
  InfinitePayWebhookValidationError,
  getWebhookOrderAction,
  MAX_INFINITEPAY_WEBHOOK_BYTES,
  parseInfinitePayWebhook,
} from '@/lib/infinitepay-webhook';

function webhookError(status: number, message: string) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') || '0');
  if (Number.isFinite(contentLength) && contentLength > MAX_INFINITEPAY_WEBHOOK_BYTES) {
    console.warn('[InfinitePay Webhook] Evento rejeitado: body_too_large');
    return webhookError(413, 'Evento inválido.');
  }

  try {
    const payload = parseInfinitePayWebhook(await request.text());
    const { data: moduleSubscription, error: subscriptionError } = await supabaseAdmin
      .from('whatsapp_store_subscriptions')
      .select('id, status, amount_cents, expires_at, transaction_nsu')
      .eq('order_nsu', payload.orderNsu)
      .maybeSingle();
    if (subscriptionError) throw subscriptionError;

    if (moduleSubscription) {
      if (moduleSubscription.status === 'active') {
        if (moduleSubscription.transaction_nsu === payload.transactionNsu) {
          console.info('[InfinitePay Webhook] Evento duplicado do módulo ignorado.');
          return NextResponse.json({ success: true, message: null });
        }
        console.warn('[InfinitePay Webhook] Evento do módulo rejeitado: subscription_already_active');
        return webhookError(409, 'Evento incompatível com o estado atual.');
      }

      const payment = await checkInfinitePayPayment({ orderNsu: payload.orderNsu, transactionNsu: payload.transactionNsu, slug: payload.invoiceSlug });
      assertConfirmedInfinitePayPayment(payload, payment, moduleSubscription.amount_cents);
      const base = moduleSubscription.expires_at && new Date(moduleSubscription.expires_at) > new Date()
        ? new Date(moduleSubscription.expires_at)
        : new Date();
      base.setDate(base.getDate() + 30);
      const { data: activatedSubscription, error: activationError } = await supabaseAdmin
        .from('whatsapp_store_subscriptions')
        .update({ status: 'active', paid_at: new Date().toISOString(), expires_at: base.toISOString(), transaction_nsu: payload.transactionNsu, updated_at: new Date().toISOString() })
        .eq('id', moduleSubscription.id)
        .eq('status', 'pending')
        .select('id')
        .maybeSingle();
      if (activationError) throw activationError;
      if (!activatedSubscription) return webhookError(409, 'Evento incompatível com o estado atual.');
      console.info('[InfinitePay Webhook] Evento do módulo processado.');
      return NextResponse.json({ success: true, message: null });
    }

    const order = await getOrderRecordById(payload.orderNsu);
    if (!order || order.paymentProvider !== 'infinitepay') {
      console.warn('[InfinitePay Webhook] Evento rejeitado: order_not_found');
      return webhookError(400, 'Pedido não encontrado.');
    }
    const orderAction = getWebhookOrderAction(order.status, order.infinitePayTransactionNsu, payload.transactionNsu);
    if (orderAction === 'duplicate') {
      console.info('[InfinitePay Webhook] Evento duplicado de pedido pago ignorado.');
      return NextResponse.json({ success: true, message: null });
    }
    if (orderAction === 'reject') {
      console.warn('[InfinitePay Webhook] Evento rejeitado: order_state_or_reference_invalid');
      return webhookError(409, 'Evento incompatível com o estado atual.');
    }

    const payment = await checkInfinitePayPayment({ orderNsu: payload.orderNsu, transactionNsu: payload.transactionNsu, slug: payload.invoiceSlug });
    const expectedAmount = Math.round(order.totalAmount * 100);
    assertConfirmedInfinitePayPayment(payload, payment, expectedAmount);

    const { data: updatedMetadata, error: metadataError } = await supabaseAdmin
      .from('orders')
      .update({
        infinitepay_transaction_nsu: payload.transactionNsu,
        infinitepay_invoice_slug: payload.invoiceSlug,
        receipt_url: payload.receiptUrl || null,
        payment_method: payment.captureMethod === 'credit_card' ? 'credit_card' : 'pix'
      })
      .eq('id', payload.orderNsu)
      .eq('status', 'pending')
      .or(`infinitepay_transaction_nsu.is.null,infinitepay_transaction_nsu.eq.${payload.transactionNsu}`)
      .select('id')
      .maybeSingle();
    if (metadataError) throw metadataError;
    if (!updatedMetadata) return webhookError(409, 'Evento incompatível com o estado atual.');

    const paidOrder = await updateOrderStatus(payload.orderNsu, 'paid', undefined, 0, { onlyIfPending: true });
    if (!paidOrder) return webhookError(409, 'Evento incompatível com o estado atual.');
    if (paidOrder.statusTransitioned) await notifyConfirmedSale(paidOrder);

    console.info('[InfinitePay Webhook] Evento confirmado e processado.');
    return NextResponse.json({ success: true, message: null });
  } catch (error) {
    if (error instanceof InfinitePayWebhookValidationError) {
      console.warn('[InfinitePay Webhook] Evento rejeitado:', error.reason);
      return webhookError(400, 'Pagamento não confirmado.');
    }
    console.error('[InfinitePay Webhook] Falha ao processar evento.');
    return webhookError(400, 'Falha ao confirmar pagamento.');
  }
}
