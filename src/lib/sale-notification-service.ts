import type { OrderRecord } from './order-service';
import { createNotification } from './notification-service';
import { sendSaleNotificationToCreator } from './mail-service';
import { supabaseAdmin } from './supabase';

export async function notifyConfirmedSale(order: OrderRecord) {
  const { data: store } = await supabaseAdmin
    .from('stores')
    .select('creator_id')
    .eq('id', order.storeId)
    .maybeSingle();
  const creatorId = store?.creator_id;
  if (!creatorId) return;

  const { data: existingNotification } = await supabaseAdmin
    .from('notifications')
    .select('id')
    .eq('creator_id', creatorId)
    .eq('type', 'SALE_CONFIRMED')
    .contains('metadata', { orderId: order.id })
    .limit(1)
    .maybeSingle();
  if (existingNotification) return;

  const productTitle = order.items[0]?.productTitle || 'Produto Digital';
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL'
  }).format(order.totalAmount);

  const notificationId = await createNotification({
    storeId: order.storeId,
    creatorId,
    type: 'SALE_CONFIRMED',
    title: `Nova venda: ${formattedAmount}!`,
    body: `${order.buyerName || 'Um aluno'} comprou "${productTitle}". Pagamento confirmado pela InfinitePay.`,
    metadata: {
      orderId: order.id,
      amount: order.totalAmount,
      productTitle,
      buyerName: order.buyerName
    }
  });

  // Outra confirmação concorrente venceu a inserção protegida pelo índice
  // único. Somente quem criou a notificação envia o e-mail ao vendedor.
  if (!notificationId) return;

  try {
    const { data: creator } = await supabaseAdmin.auth.admin.getUserById(creatorId);
    if (creator?.user?.email) {
      await sendSaleNotificationToCreator({
        producerEmail: creator.user.email,
        producerName: creator.user.user_metadata?.full_name || 'Produtor',
        amount: order.creatorNetAmount,
        productTitle,
        orderId: order.id
      });
    }
  } catch (error) {
    console.error('[Sale Notification] Falha ao enviar e-mail:', error);
  }
}
