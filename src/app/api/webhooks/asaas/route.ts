import { NextResponse } from 'next/server';
import { updateOrderStatus, getOrderRecordById } from '@/lib/order-service';

export async function POST(request: Request) {
  try {
    const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
    const headerToken = request.headers.get('asaas-access-token');

    // 1. Validação de Segurança do Token Header Asaas
    if (webhookToken && webhookToken !== '' && headerToken !== webhookToken) {
      console.warn('[Asaas Webhook] Acesso negado: Token de webhook inválido.');
      return NextResponse.json({ error: 'Token de webhook inválido.' }, { status: 401 });
    }

    const payload = await request.json();
    const { event, payment } = payload;

    if (!payment) {
      return NextResponse.json({ received: true, message: 'Payload sem dados de pagamento.' }, { status: 200 });
    }

    const orderId = payment.externalReference;
    const asaasPaymentId = payment.id;

    console.log(`[Asaas Webhook] Evento: ${event} | PaymentId: ${asaasPaymentId} | OrderId: ${orderId}`);

    // 2. Eventos de Confirmação de Pagamento
    if (
      event === 'PAYMENT_CONFIRMED' || 
      event === 'PAYMENT_RECEIVED' || 
      event === 'PAYMENT_DUNNING_RECEIVED'
    ) {
      if (orderId) {
        // Atualiza pedido para 'paid' com verificação de IDEMPOTÊNCIA
        await updateOrderStatus(orderId, 'paid', asaasPaymentId);
      }
    } 

    // 3. Evento de Vencimento / Falha
    else if (event === 'PAYMENT_OVERDUE' || event === 'PAYMENT_DELETED') {
      if (orderId) {
        await updateOrderStatus(orderId, 'failed', asaasPaymentId);
      }
    } 

    // 4. Evento de Reembolso / Estorno
    else if (event === 'PAYMENT_REFUNDED' || event === 'PAYMENT_CHARGEBACK_REQUESTED') {
      if (orderId) {
        await updateOrderStatus(orderId, 'refunded', asaasPaymentId);
      }
    }

    return NextResponse.json({ received: true, event, paymentId: asaasPaymentId });

  } catch (err: any) {
    console.error('[Asaas Webhook Handler Error]:', err);
    return NextResponse.json({ error: 'Erro interno ao processar webhook.' }, { status: 500 });
  }
}
