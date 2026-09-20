import type { OrderRecord } from './order-service';
import { createNotification } from './notification-service';
import { sendSaleNotificationToCreator } from './mail-service';
import { supabaseAdmin } from './supabase';
import { firstName, getWhatsAppTemplate, renderWhatsAppTemplate, sendEvolutionText } from './whatsapp-notification-service';

export async function notifyConfirmedSale(order: OrderRecord) {
  const libraryUrl = `${(process.env.NEXT_PUBLIC_APP_URL || 'https://www.educalizando.com.br').replace(/\/$/, '')}/cliente/dashboard`;
  const { data: store } = await supabaseAdmin
    .from('stores')
    .select('creator_id, nome_loja, whatsapp')
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
    const [creatorResult, buyerResult] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(creatorId),
      order.studentId ? supabaseAdmin.auth.admin.getUserById(order.studentId) : Promise.resolve({ data: { user: null } })
    ]);
    const creator = creatorResult.data;
    const buyer = buyerResult.data;

    if (creator?.user?.email) {
      await sendSaleNotificationToCreator({
        producerEmail: creator.user.email,
        producerName: creator.user.user_metadata?.full_name || 'Produtor',
        amount: order.creatorNetAmount,
        productTitle,
        orderId: order.id
      });
    }

    const productTitles = order.items.length
      ? order.items.map((item) => item.productTitle || 'Material digital').join(', ')
      : 'Material digital';
    const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.totalAmount);
    const creatorName = creator?.user?.user_metadata?.full_name || store.nome_loja || 'Criador(a)';
    const buyerPhone = order.buyerPhone || buyer?.user?.user_metadata?.whatsapp || buyer?.user?.user_metadata?.phone || null;
    const creatorTemplate = await getWhatsAppTemplate('creatorSale');
    const buyerTemplate = await getWhatsAppTemplate('buyerSale');
    const { data: deliveries } = order.items.length
      ? await supabaseAdmin.from('product_deliveries').select('product_id, arquivo_url, plr_license_url').in('product_id', order.items.map(item => item.productId))
      : { data: [] as Array<{ product_id: string; arquivo_url: string | null; plr_license_url: string | null }> };
    const creatorLinks = (deliveries || [])
      .map(delivery => ({ ...delivery, accessUrl: order.is_plr_purchase ? delivery.plr_license_url : delivery.arquivo_url }))
      .filter(delivery => /^https:\/\//i.test(delivery.accessUrl || '') && !/supabase\.co\//i.test(delivery.accessUrl || ''))
      .map(delivery => {
        const item = order.items.find(candidate => candidate.productId === delivery.product_id);
        return `🔗 ${item?.productTitle || 'Material'}: ${delivery.accessUrl}`;
      });

    // O envio ocorre somente após a inserção idempotente da notificação acima.
    // Assim, chamadas repetidas do webhook não geram mensagens duplicadas.
    await Promise.allSettled([
      sendEvolutionText(store.whatsapp, renderWhatsAppTemplate(creatorTemplate, {
        nome: firstName(creatorName),
        comprador: order.buyerName || 'Um cliente',
        produto: productTitles,
        valor: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.creatorNetAmount),
        pedido: order.id,
      }) + `\n\n📱 Contato do comprador: ${buyerPhone || 'não informado'}`),
      sendEvolutionText(buyerPhone, renderWhatsAppTemplate(buyerTemplate, {
        nome: firstName(order.buyerName, 'Cliente'),
        comprador: order.buyerName || 'Cliente',
        produto: productTitles,
        valor: currency,
        pedido: order.id,
      }) + `${creatorLinks.length ? `\n\n${creatorLinks.join('\n')}` : ''}\n\n📚 Acesse seus materiais com segurança: ${libraryUrl}`),
    ]);
  } catch (error) {
    console.error('[Sale Notification] Falha ao enviar alertas da venda:', error);
  }
}
