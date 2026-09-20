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
