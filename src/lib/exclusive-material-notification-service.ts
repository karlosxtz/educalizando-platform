import 'server-only';

import { sendExclusiveMaterialDeliveredEmail,sendExclusivePaymentConfirmedToCustomer,sendExclusiveSaleNotificationToCreator } from './mail-service';
import { createNotification } from './notification-service';
import { supabaseAdmin } from './supabase';
import { claimTransactionalDelivery,completeTransactionalDelivery,failTransactionalDelivery,type TransactionalDeliveryChannel,type TransactionalDeliveryEvent } from './transactional-delivery-service';
import { firstName,sendEvolutionText } from './whatsapp-notification-service';

type ExclusiveContext = {
  request: { id: string; title: string; store_id: string; creator_id: string; customer_id: string };
  store: { nome_loja: string | null; whatsapp: string | null } | null;
  creator: { email?: string; user_metadata?: Record<string, unknown> } | null;
  customer: { email?: string; phone?: string; user_metadata?: Record<string, unknown> } | null;
  instanceName?: string;
};

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.educalizando.com.br').replace(/\/$/, '');
const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

async function loadContext(requestId: string): Promise<ExclusiveContext | null> {
  const { data: request } = await supabaseAdmin.from('exclusive_material_requests').select('id,title,store_id,creator_id,customer_id').eq('id', requestId).maybeSingle();
  if (!request) return null;
  const [storeResult, creatorResult, customerResult, subscriptionResult] = await Promise.all([
    supabaseAdmin.from('stores').select('nome_loja,whatsapp').eq('id', request.store_id).maybeSingle(),
    supabaseAdmin.auth.admin.getUserById(request.creator_id),
    supabaseAdmin.auth.admin.getUserById(request.customer_id),
    supabaseAdmin.from('whatsapp_store_subscriptions').select('instance_name,status,whatsapp_connected,expires_at').eq('store_id', request.store_id).maybeSingle(),
  ]);
  const subscription = subscriptionResult.data;
  const usesStoreInstance = subscription?.status === 'active' && subscription.whatsapp_connected === true && subscription.expires_at && new Date(subscription.expires_at) > new Date();
  return {
    request,
    store: storeResult.data,
    creator: creatorResult.data.user,
    customer: customerResult.data.user,
    instanceName: usesStoreInstance ? subscription.instance_name : undefined,
  };
}

async function tracked(reference: string, channel: TransactionalDeliveryChannel, event: TransactionalDeliveryEvent, send: () => Promise<{ sent: boolean; id?: string; error?: string }>) {
  const attemptId = await claimTransactionalDelivery(reference, channel, event);
  if (!attemptId) return;
  try {
    const result = await send();
    if (!result.sent) throw new Error(result.error || 'O provedor não confirmou o envio.');
    await completeTransactionalDelivery(attemptId, result.id);
  } catch (error) {
    await failTransactionalDelivery(attemptId, error instanceof Error ? error.message : String(error));
  }
}

function profileName(user: ExclusiveContext['creator'], fallback: string) {
  const value = user?.user_metadata?.full_name || user?.user_metadata?.name;
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function profilePhone(user: ExclusiveContext['customer']) {
  return user?.user_metadata?.whatsapp || user?.user_metadata?.phone || user?.phone || null;
}

export async function notifyExclusivePaymentConfirmed(input: { paymentId: string; requestId: string; grossAmount: number; creatorNetAmount: number }) {
  try {
    const context = await loadContext(input.requestId);
    if (!context) return;
    const reference = `exclusive:${input.paymentId}`;
    const customerName = profileName(context.customer, 'Cliente');
    const creatorName = profileName(context.creator, context.store?.nome_loja || 'Criador(a)');
    const customerUrl = `${appUrl}/cliente/materiais-exclusivos?pedido=${encodeURIComponent(input.requestId)}`;
    const creatorUrl = `${appUrl}/dashboard/materiais-exclusivos?pedido=${encodeURIComponent(input.requestId)}`;

    const { data: existing } = await supabaseAdmin.from('notifications').select('id').eq('creator_id', context.request.creator_id).eq('type', 'SALE_CONFIRMED').contains('metadata', { orderId: reference }).maybeSingle();
    if (!existing) await createNotification({
      storeId: context.request.store_id,
      creatorId: context.request.creator_id,
      type: 'SALE_CONFIRMED',
      title: `Nova venda exclusiva: ${money(input.grossAmount)}!`,
      body: `${customerName} pagou “${context.request.title}”. A produção já pode começar.`,
      metadata: { orderId: reference, requestId: input.requestId, amount: input.grossAmount, productTitle: context.request.title, buyerName: customerName, exclusive: true },
    });
    const { data: customerNotification } = await supabaseAdmin.from('exclusive_material_notifications').select('id').eq('request_id', input.requestId).eq('type', 'payment').limit(1).maybeSingle();
    if (!customerNotification) await supabaseAdmin.from('exclusive_material_notifications').insert({ customer_id: context.request.customer_id, request_id: input.requestId, type: 'payment', title: 'Pagamento confirmado', body: `O pagamento de “${context.request.title}” foi aprovado e a produção foi liberada.` });

    const customerEmail = context.customer?.email;
    const creatorEmail = context.creator?.email;
    const customerPhone = profilePhone(context.customer);
    const creatorPhone = context.store?.whatsapp;
    await Promise.all([
      customerEmail ? tracked(reference, 'EMAIL', 'PAYMENT_CONFIRMED', () => sendExclusivePaymentConfirmedToCustomer({ email: customerEmail, name: customerName, requestId: input.requestId, title: context.request.title, amount: input.grossAmount, url: customerUrl })) : Promise.resolve(),
      creatorEmail ? tracked(reference, 'EMAIL', 'CREATOR_SALE_ALERT', () => sendExclusiveSaleNotificationToCreator({ email: creatorEmail, name: creatorName, requestId: input.requestId, title: context.request.title, creatorNetAmount: input.creatorNetAmount, url: creatorUrl })) : Promise.resolve(),
      customerPhone ? tracked(reference, 'WHATSAPP', 'PAYMENT_CONFIRMED', async () => sendEvolutionText(customerPhone, `✅ Olá, ${firstName(customerName, 'cliente')}! O pagamento de “${context.request.title}” foi confirmado. O criador já pode iniciar a produção.\n\nAcompanhe aqui: ${customerUrl}`, context.instanceName)) : Promise.resolve(),
      creatorPhone ? tracked(reference, 'WHATSAPP', 'CREATOR_SALE_ALERT', async () => sendEvolutionText(creatorPhone, `💰 Olá, ${firstName(creatorName)}! O cliente pagou o material exclusivo “${context.request.title}”. Você já pode iniciar a produção.\n\nValor líquido: ${money(input.creatorNetAmount)}\nAbrir pedido: ${creatorUrl}`, context.instanceName)) : Promise.resolve(),
    ]);
  } catch (error) {
    console.error('[Exclusive Notification] Falha ao notificar pagamento:', error);
  }
}

export async function notifyExclusiveMaterialDelivered(input: { requestId: string }) {
  try {
    const context = await loadContext(input.requestId);
    if (!context) return;
    const reference = `exclusive-delivery:${input.requestId}`;
    const customerName = profileName(context.customer, 'Cliente');
    const accessUrl = `${appUrl}/cliente/materiais-exclusivos?pedido=${encodeURIComponent(input.requestId)}`;
    const customerEmail = context.customer?.email;
    const customerPhone = profilePhone(context.customer);
    await Promise.all([
      customerEmail ? tracked(reference, 'EMAIL', 'MATERIAL_DELIVERY', () => sendExclusiveMaterialDeliveredEmail({ email: customerEmail, name: customerName, requestId: input.requestId, title: context.request.title, url: accessUrl })) : Promise.resolve(),
      customerPhone ? tracked(reference, 'WHATSAPP', 'MATERIAL_DELIVERY', async () => sendEvolutionText(customerPhone, `🎉 Olá, ${firstName(customerName, 'cliente')}! Seu material exclusivo “${context.request.title}” foi entregue e já está disponível na sua conta.\n\nAcessar material: ${accessUrl}`, context.instanceName)) : Promise.resolve(),
    ]);
  } catch (error) {
    console.error('[Exclusive Notification] Falha ao notificar entrega:', error);
  }
}
