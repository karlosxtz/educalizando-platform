import { createNotification } from './notification-service';
import { supabaseAdmin } from './supabase';
import { firstName, sendEvolutionText } from './whatsapp-notification-service';

type WithdrawalRequestNotice = {
  withdrawalId: string;
  creatorId: string;
  storeId: string;
  amount: number;
  pixKeyId: string;
  pixKeyMasked: string;
  recipientType: 'creator' | 'affiliate';
};

const money = (amount: number) => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL'
}).format(amount);

/**
 * Confirma a solicitação pelo WhatsApp oficial da plataforma. A falha do canal
 * nunca desfaz o saque já reservado com segurança no banco.
 */
export async function notifyWithdrawalRequested(input: WithdrawalRequestNotice) {
  try {
    const [{ data: store }, { data: pixKey }] = await Promise.all([
      supabaseAdmin.from('stores').select('nome_loja, whatsapp').eq('id', input.storeId).maybeSingle(),
      supabaseAdmin.from('creator_pix_keys').select('holder_name, bank_name').eq('id', input.pixKeyId).maybeSingle(),
    ]);

    const recipient = input.recipientType === 'affiliate' ? 'afiliado(a)' : 'criador(a)';
    const holder = pixKey?.holder_name?.trim() || 'Titular não informado';
    const bank = pixKey?.bank_name?.trim() || 'Banco não informado';
    const title = 'Solicitação de saque recebida';
    const body = `Recebemos sua solicitação de saque de ${money(input.amount)}. Ela entrará em análise antes do pagamento.`;

    await createNotification({
      storeId: input.storeId,
      creatorId: input.creatorId,
      type: 'SYSTEM',
      title,
      body,
      metadata: { withdrawalId: input.withdrawalId, amount: input.amount, recipientType: input.recipientType }
    });

    if (!store?.whatsapp) {
      console.warn(`[Withdrawal notice] ${recipient} sem WhatsApp cadastrado na loja ${input.storeId}.`);
      return { sent: false, reason: 'missing_store_whatsapp' as const };
    }

    const message = `🏦 *Solicitação de saque recebida*\n\nOlá, ${firstName(store.nome_loja, recipient)}!\n\nRecebemos sua solicitação de saque de *${money(input.amount)}*. Ela entrará em análise para a realização do pagamento.\n\n*Dados informados para pagamento*\n• Chave PIX (CPF): ${input.pixKeyMasked}\n• Titular: ${holder}\n• Banco: ${bank}\n\nProtocolo: ${input.withdrawalId}\n\n⚠️ *Não reconhece esta solicitação?* Responda exatamente *CANCELAR PAGAMENTO*. O pagamento será bloqueado e o pedido será cancelado com segurança.`;
    const delivery = await sendEvolutionText(store.whatsapp, message);
    if (!delivery.sent) console.error('[Withdrawal notice] Falha ao enviar WhatsApp:', delivery.error || delivery.reason);
    return delivery;
  } catch (error) {
    console.error('[Withdrawal notice] Não foi possível enviar confirmação de saque:', error);
    return { sent: false, reason: 'unexpected_error' as const };
  }
}

/** Confirma o pagamento somente depois que o administrador conclui o saque. */
export async function notifyWithdrawalPaid(input: WithdrawalRequestNotice & { paidAt?: Date }) {
  try {
    const [{ data: store }, { data: pixKey }] = await Promise.all([
      supabaseAdmin.from('stores').select('nome_loja, whatsapp').eq('id', input.storeId).maybeSingle(),
      supabaseAdmin.from('creator_pix_keys').select('holder_name, bank_name').eq('id', input.pixKeyId).maybeSingle(),
    ]);
    const paidAt = input.paidAt || new Date();
    const date = paidAt.toLocaleDateString('pt-BR');
    const time = paidAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const holder = pixKey?.holder_name?.trim() || 'Titular não informado';
    const bank = pixKey?.bank_name?.trim() || 'Banco não informado';
    const body = `O pagamento do seu saque de ${money(input.amount)} foi enviado em ${date}, às ${time}.`;

    await createNotification({
      storeId: input.storeId,
      creatorId: input.creatorId,
      type: 'WITHDRAWAL_APPROVED',
      title: 'Saque pago',
      body,
      metadata: { withdrawalId: input.withdrawalId, amount: input.amount, paidAt: paidAt.toISOString() }
    });

    if (!store?.whatsapp) {
      console.warn(`[Withdrawal paid notice] Loja ${input.storeId} sem WhatsApp cadastrado.`);
      return { sent: false, reason: 'missing_store_whatsapp' as const };
    }
    const message = `✅ *Pagamento de saque enviado*\n\nOlá, ${firstName(store.nome_loja)}!\n\nO pagamento da sua solicitação de saque foi enviado para a chave PIX registrada.\n\n*Valor pago:* ${money(input.amount)}\n*Data:* ${date}\n*Hora:* ${time}\n*Banco:* ${bank}\n*Titular:* ${holder}\n*Chave PIX (CPF):* ${input.pixKeyMasked}\n\nProtocolo: ${input.withdrawalId}\n\nO comprovante/referência pode ser conferido no painel da Educalizando.`;
    const delivery = await sendEvolutionText(store.whatsapp, message);
    if (!delivery.sent) console.error('[Withdrawal paid notice] Falha ao enviar WhatsApp:', delivery.error || delivery.reason);
    return delivery;
  } catch (error) {
    console.error('[Withdrawal paid notice] Não foi possível enviar confirmação de pagamento:', error);
    return { sent: false, reason: 'unexpected_error' as const };
  }
}
