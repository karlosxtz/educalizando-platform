import { NextResponse } from 'next/server';
import { validateAsaasTransferWebhook, handleAsaasTransferWebhook } from '@/lib/withdrawal-service';
import { createNotification } from '@/lib/notification-service';

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

    // Cobranças foram migradas para a InfinitePay. Eventos antigos de pagamento
    // são reconhecidos, mas não alteram pedidos, acessos ou saldos automaticamente.
    return NextResponse.json({ received: true, ignored: true, type: payment ? 'legacy-payment' : 'unknown', event });

  } catch (err: any) {
    console.error('[Asaas Webhook Handler Error]:', err);
    return NextResponse.json({ error: 'Erro interno ao processar webhook.' }, { status: 500 });
  }
}
