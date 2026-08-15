import { NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/order-service';
import { validateAsaasTransferWebhook, handleAsaasTransferWebhook } from '@/lib/withdrawal-service';

export async function POST(request: Request) {
  try {
    const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
    const headerToken = request.headers.get('asaas-access-token');

    // 1. Validação de Segurança do Token Header Asaas (OBRIGATÓRIO)
    if (!webhookToken || webhookToken.trim() === '') {
      console.error('[Asaas Webhook] ERRO CRÍTICO: Token de webhook não configurado no servidor.');
      return NextResponse.json({ error: 'Configuração de webhook incompleta no servidor.' }, { status: 500 });
    }

    if (!headerToken || headerToken !== webhookToken) {
      console.warn('[Asaas Webhook] Acesso negado: Token de webhook ausente ou inválido.');
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
    }

    const payload = await request.json();
    const { event, type, payment, transfer } = payload;

    // 1.5 Mecanismo de Validação de Saque (Webhook de Segurança do Asaas)
    // O Asaas envia 'type' em vez de 'event' para webhooks de validação de saída.
    if (type === 'TRANSFER' && !event) {
      console.log(`[Asaas Webhook] Solicitação de validação de saque recebida para: ${transfer?.id}`);
      
      const isValid = await validateAsaasTransferWebhook(payload);
      
      if (isValid) {
        return NextResponse.json({ status: 'APPROVED' });
      } else {
        return NextResponse.json({ status: 'REFUSED', refuseReason: 'Transferência não reconhecida ou não registrada na plataforma Educalizando.' });
      }
    }

    // 2. PROCESSAMENTO DE WEBHOOKS DE TRANSFERÊNCIA DE SAQUE (FASE C - Item 20-25)
    if (transfer || (event && event.startsWith('TRANSFER_'))) {
      await handleAsaasTransferWebhook(payload);
      return NextResponse.json({ received: true, type: 'transfer', event, transferId: transfer?.id });
    }

    // 3. PROCESSAMENTO DE WEBHOOKS DE COBRANÇAS / VENDAS (FASE A & B)
    if (!payment) {
      return NextResponse.json({ received: true, message: 'Payload sem dados de pagamento ou transferência.' }, { status: 200 });
    }

    const orderId = payment.externalReference;
    const asaasPaymentId = payment.id;

    // Tentar obter a taxa REAL efetivamente cobrada pelo Asaas
    let realAsaasFee: number | undefined = undefined;
    if (payment.value !== undefined && payment.netValue !== undefined) {
      realAsaasFee = Math.max(0, Number(payment.value) - Number(payment.netValue));
    }

    console.log(`[Asaas Webhook Payment] Evento: ${event} | PaymentId: ${asaasPaymentId} | OrderId: ${orderId} | Taxa Asaas: ${realAsaasFee !== undefined ? `R$ ${realAsaasFee.toFixed(2)}` : 'Não informada'}`);

    if (
      event === 'PAYMENT_CONFIRMED' || 
      event === 'PAYMENT_RECEIVED' || 
      event === 'PAYMENT_DUNNING_RECEIVED'
    ) {
      if (orderId) {
        await updateOrderStatus(orderId, 'paid', asaasPaymentId, realAsaasFee);
      }
    } 
    else if (event === 'PAYMENT_OVERDUE' || event === 'PAYMENT_DELETED') {
      if (orderId) {
        await updateOrderStatus(orderId, 'failed', asaasPaymentId, realAsaasFee);
      }
    } 
    else if (event === 'PAYMENT_REFUNDED' || event === 'PAYMENT_CHARGEBACK_REQUESTED') {
      if (orderId) {
        await updateOrderStatus(orderId, 'refunded', asaasPaymentId, realAsaasFee);
      }
    }

    return NextResponse.json({ received: true, type: 'payment', event, paymentId: asaasPaymentId });

  } catch (err: any) {
    console.error('[Asaas Webhook Handler Error]:', err);
    return NextResponse.json({ error: 'Erro interno ao processar webhook.' }, { status: 500 });
  }
}
