import { NextResponse } from 'next/server';
import { checkInfinitePayPayment } from '@/lib/infinitepay-service';
import { getOrderRecordById, updateOrderStatus } from '@/lib/order-service';
import { supabaseAdmin } from '@/lib/supabase';
import { notifyConfirmedSale } from '@/lib/sale-notification-service';
import { notifyExclusivePaymentConfirmed } from '@/lib/exclusive-material-notification-service';
import { exclusiveFinancials } from '@/lib/exclusive-material';
import { calculatePaymentProcessingFee, getPaymentProcessingFeePercentage, getPlatformFeePercentage, normalizePlatformPaymentMethod } from '@/lib/payment-fees';
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

type ExclusivePaymentCredit = {
  id: string;
  gross_amount: number | string;
  platform_fee_amount: number | string;
  creator_net_amount: number | string;
  payment_processing_fee_amount?: number;
  request: { store_id: string; creator_id: string; title: string };
};

async function creditExclusiveMaterialCreator(exclusivePayment: ExclusivePaymentCredit) {
  const transactionId = `exclusive_${exclusivePayment.id}`;
  const processingFee = exclusivePayment.payment_processing_fee_amount
    ?? Math.max(0, Number(exclusivePayment.gross_amount) - Number(exclusivePayment.platform_fee_amount) - Number(exclusivePayment.creator_net_amount));
  const { error } = await supabaseAdmin.from('wallet_transactions').insert({
    id: transactionId,
    store_id: String(exclusivePayment.request.store_id),
    creator_id: String(exclusivePayment.request.creator_id),
    order_id: null,
    type: 'SALE',
    status: 'COMPLETED',
    gross_amount: Number(exclusivePayment.gross_amount),
    platform_fixed_fee_amount: 0,
    platform_percentage_fee_amount: Number(exclusivePayment.platform_fee_amount),
    platform_fee_amount: Number(exclusivePayment.platform_fee_amount),
    asaas_fee_amount: Number(processingFee.toFixed(2)),
    net_amount: Number(exclusivePayment.creator_net_amount),
    description: `Material exclusivo: ${exclusivePayment.request.title} — repasse líquido após a taxa do meio de pagamento.`,
    created_at: new Date().toISOString(),
  });

  // A chave determinística faz o webhook ser idempotente: reenvios do gateway
  // não duplicam o saldo, mas conseguem concluir um crédito que tenha falhado.
  if (error && error.code !== '23505') throw error;
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

    // Pagamento de uma encomenda exclusiva: não passa pelo pedido de catálogo,
    // mas usa a mesma confirmação oficial e o mesmo ledger financeiro.
    const { data: exclusivePayment, error: exclusivePaymentError } = await supabaseAdmin
      .from('exclusive_material_payments')
      .select('*, request:exclusive_material_requests(*)')
      .eq('order_nsu', payload.orderNsu)
      .maybeSingle();
    if (exclusivePaymentError) throw exclusivePaymentError;
    if (exclusivePayment) {
      if (exclusivePayment.status === 'paid') {
        if (exclusivePayment.transaction_nsu === payload.transactionNsu) {
          await creditExclusiveMaterialCreator(exclusivePayment);
          await notifyExclusivePaymentConfirmed({ paymentId: exclusivePayment.id, requestId: exclusivePayment.request_id, grossAmount: Number(exclusivePayment.gross_amount), creatorNetAmount: Number(exclusivePayment.creator_net_amount) });
          return NextResponse.json({ success: true, message: null });
        }
        return webhookError(409, 'Evento incompatível com o estado atual.');
      }
      const payment = await checkInfinitePayPayment({ orderNsu: payload.orderNsu, transactionNsu: payload.transactionNsu, slug: payload.invoiceSlug });
      assertConfirmedInfinitePayPayment(payload, payment, Math.round(Number(exclusivePayment.gross_amount) * 100));
      const paymentMethod = normalizePlatformPaymentMethod(payment.captureMethod || payload.captureMethod);
      const installments = payment.installments ?? payload.installments ?? 1;
      const financials = exclusiveFinancials(Number(exclusivePayment.gross_amount), paymentMethod, installments);
      const { data: markedPaid, error: updateExclusiveError } = await supabaseAdmin.from('exclusive_material_payments').update({
        status: 'paid',
        transaction_nsu: payload.transactionNsu,
        invoice_slug: payload.invoiceSlug,
        platform_fee_amount: financials.platformFeeAmount,
        creator_net_amount: financials.creatorNetAmount,
        paid_at: new Date().toISOString()
      }).eq('id', exclusivePayment.id).eq('status', 'pending').select('id').maybeSingle();
      if (updateExclusiveError) throw updateExclusiveError;
      if (!markedPaid) return webhookError(409, 'Evento incompatível com o estado atual.');
      await supabaseAdmin.from('exclusive_material_requests').update({ status: 'in_production', updated_at: new Date().toISOString() }).eq('id', exclusivePayment.request_id);
      await supabaseAdmin.from('exclusive_material_messages').insert({ request_id: exclusivePayment.request_id, sender_id: exclusivePayment.request.creator_id, sender_role: 'system', body: 'Pagamento confirmado pela plataforma. O criador já pode iniciar a produção e enviar a entrega aqui.' });
      const settledExclusivePayment = {
        ...exclusivePayment,
        platform_fee_amount: financials.platformFeeAmount,
        payment_processing_fee_amount: financials.paymentProcessingFeeAmount,
        creator_net_amount: financials.creatorNetAmount
      };
      await creditExclusiveMaterialCreator(settledExclusivePayment);
      await notifyExclusivePaymentConfirmed({ paymentId: exclusivePayment.id, requestId: exclusivePayment.request_id, grossAmount: financials.grossAmount, creatorNetAmount: financials.creatorNetAmount });
      console.info(`[InfinitePay Webhook] Material exclusivo confirmado: plataforma ${getPlatformFeePercentage(paymentMethod)}%, processamento ${getPaymentProcessingFeePercentage(paymentMethod, installments)}%.`);
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

    const paymentMethod = normalizePlatformPaymentMethod(payment.captureMethod || payload.captureMethod);
    const installments = payment.installments ?? payload.installments ?? 1;
    const processingFeeAmount = calculatePaymentProcessingFee(order.totalAmount, paymentMethod, installments);
    const { data: updatedMetadata, error: metadataError } = await supabaseAdmin
      .from('orders')
      .update({
        infinitepay_transaction_nsu: payload.transactionNsu,
        infinitepay_invoice_slug: payload.invoiceSlug,
        receipt_url: payload.receiptUrl || null,
        payment_method: paymentMethod
      })
      .eq('id', payload.orderNsu)
      .eq('status', 'pending')
      .or(`infinitepay_transaction_nsu.is.null,infinitepay_transaction_nsu.eq.${payload.transactionNsu}`)
      .select('id')
      .maybeSingle();
    if (metadataError) throw metadataError;
    if (!updatedMetadata) return webhookError(409, 'Evento incompatível com o estado atual.');

    const paidOrder = await updateOrderStatus(payload.orderNsu, 'paid', undefined, processingFeeAmount, { onlyIfPending: true, paymentMethod, installments });
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
