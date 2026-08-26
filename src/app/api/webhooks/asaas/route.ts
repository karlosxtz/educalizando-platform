import { NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/order-service';
import { validateAsaasTransferWebhook, handleAsaasTransferWebhook } from '@/lib/withdrawal-service';
import { createNotification } from '@/lib/notification-service';
import { sendProducerSaleEmail } from '@/lib/mail-service';

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
      const isValid = await validateAsaasTransferWebhook(payload);
      if (isValid) {
        return NextResponse.json({ status: 'APPROVED' });
      } else {
        return NextResponse.json({ status: 'REFUSED', refuseReason: 'Transferência não reconhecida ou não registrada na plataforma Educalizando.' });
      }
    }

    // 2. PROCESSAMENTO DE WEBHOOKS DE TRANSFERÊNCIA DE SAQUE
    if (transfer || (event && event.startsWith('TRANSFER_'))) {
      const withdrawalResult = await handleAsaasTransferWebhook(payload);

      // 🔔 Notificar criador sobre status do saque
      if (withdrawalResult?.storeId && withdrawalResult?.creatorId) {
        if (event === 'TRANSFER_DONE' || event === 'TRANSFER_APPROVED') {
          const formattedValue = withdrawalResult.amount
            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(withdrawalResult.amount)
            : 'valor confirmado';

          await createNotification({
            storeId:   withdrawalResult.storeId,
            creatorId: withdrawalResult.creatorId,
            type:      'WITHDRAWAL_APPROVED',
            title:     'Saque aprovado! 🎉',
            body:      `Seu saque de ${formattedValue} foi processado com sucesso.`,
            metadata:  { withdrawalId: transfer?.id, amount: withdrawalResult.amount }
          }).catch(e => console.error('[Webhook] Erro ao criar notificação de saque aprovado:', e));

        } else if (event === 'TRANSFER_FAILED' || event === 'TRANSFER_CANCELLED') {
          await createNotification({
            storeId:   withdrawalResult.storeId,
            creatorId: withdrawalResult.creatorId,
            type:      'WITHDRAWAL_FAILED',
            title:     'Saque não processado ❌',
            body:      'Seu saque não pôde ser processado. Verifique os dados da chave PIX e tente novamente.',
            metadata:  { withdrawalId: transfer?.id }
          }).catch(e => console.error('[Webhook] Erro ao criar notificação de saque recusado:', e));
        }
      }

      return NextResponse.json({ received: true, type: 'transfer', event, transferId: transfer?.id });
    }

    // 3. PROCESSAMENTO DE WEBHOOKS DE COBRANÇAS / VENDAS
    if (!payment) {
      return NextResponse.json({ received: true, message: 'Payload sem dados de pagamento ou transferência.' }, { status: 200 });
    }

    const orderId       = payment.externalReference;
    const asaasPaymentId = payment.id;

    // Tentar obter a taxa REAL efetivamente cobrada pelo Asaas
    let realAsaasFee: number | undefined = undefined;
    if (payment.value !== undefined && payment.netValue !== undefined) {
      realAsaasFee = Math.max(0, Number(payment.value) - Number(payment.netValue));
    }

    if (
      event === 'PAYMENT_CONFIRMED' ||
      event === 'PAYMENT_RECEIVED' ||
      event === 'PAYMENT_DUNNING_RECEIVED'
    ) {
      if (orderId) {
        const order = await updateOrderStatus(orderId, 'paid', asaasPaymentId, realAsaasFee);

        // 🔔 Disparar notificação de venda em tempo real para o criador
        if (order?.storeId && order?.creatorId) {
          const productTitle    = order.items?.[0]?.productTitle || 'Produto Digital';
          const amount          = order.totalAmount;
          const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

          await createNotification({
            storeId:   order.storeId,
            creatorId: order.creatorId,
            type:      'SALE_CONFIRMED',
            title:     `Nova venda: ${formattedAmount}!`,
            body:      `${order.buyerName || 'Um aluno'} comprou "${productTitle}". Venda confirmada e acesso liberado.`,
            metadata:  {
              orderId:      order.id,
              amount,
              productTitle,
              buyerName: order.buyerName
            }
          }).catch(e => console.error('[Webhook] Erro ao criar notificação de venda:', e));

          // 📧 Disparar e-mail via Resend para o Produtor
          try {
            const { supabaseAdmin } = await import('@/lib/supabase');
            const { data: userData } = await supabaseAdmin.auth.admin.getUserById(order.creatorId);
            const creatorEmail = userData?.user?.email;
            const creatorName = userData?.user?.user_metadata?.full_name || 'Produtor';

            if (creatorEmail) {
              await sendProducerSaleEmail({
                producerEmail: creatorEmail,
                producerName: creatorName,
                amount: order.creatorNetAmount, // O e-mail exibe o valor líquido
                productTitle: productTitle
              });
            }
          } catch (mailErr) {
            console.error('[Webhook] Erro ao disparar e-mail de venda pro produtor:', mailErr);
          }
        }
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
