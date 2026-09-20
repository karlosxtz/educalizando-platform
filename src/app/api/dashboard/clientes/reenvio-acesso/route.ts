import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { sendAccessResendEmail } from '@/lib/mail-service';
import { firstName, sendEvolutionText } from '@/lib/whatsapp-notification-service';

const paidStatuses = new Set(['paid', 'pago', 'liberado', 'aprovado', 'concluido']);
const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.educalizando.com.br').replace(/\/$/, '');
const isExternalCreatorLink = (url?: string | null) => /^https:\/\//i.test(url || '') && !/supabase\.co\//i.test(url || '');

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente para reenviar o acesso.' }, { status: 401 });

  const body = await request.json().catch(() => null) as { storeId?: string; orderId?: string; productId?: string } | null;
  if (!body?.storeId || !body.orderId) return NextResponse.json({ error: 'Pedido ou loja não informados.' }, { status: 400 });

  const { data: store } = await supabaseAdmin
    .from('stores')
    .select('id, nome_loja, whatsapp')
    .eq('id', body.storeId)
    .eq('creator_id', user.id)
    .maybeSingle();
  if (!store) return NextResponse.json({ error: 'Você não tem permissão para reenviar acessos desta loja.' }, { status: 403 });

  const { data: subscription } = await supabaseAdmin
    .from('whatsapp_store_subscriptions')
    .select('instance_name, status, whatsapp_connected, expires_at')
    .eq('store_id', store.id)
    .maybeSingle();
  const storeInstance = subscription?.status === 'active' && subscription?.whatsapp_connected && subscription?.expires_at && new Date(subscription.expires_at) > new Date()
    ? subscription.instance_name
    : undefined;

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, store_id, buyer_name, buyer_email, buyer_phone, status, is_plr_purchase')
    .eq('id', body.orderId)
    .eq('store_id', store.id)
    .maybeSingle();
  if (!order) return NextResponse.json({ error: 'Pedido não encontrado nesta loja.' }, { status: 404 });
  if (!paidStatuses.has(String(order.status || '').toLowerCase())) {
    return NextResponse.json({ error: 'O acesso só pode ser reenviado para pedidos com pagamento aprovado.' }, { status: 422 });
  }
  const isPlrPurchase = order.is_plr_purchase === true;

  const { data: orderItems, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .select('product_id')
    .eq('order_id', order.id);
  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });
  const selectedIds = (orderItems || []).map(item => item.product_id).filter(Boolean);
  const productIds = body.productId ? selectedIds.filter(id => id === body.productId) : selectedIds;
  if (!productIds.length) return NextResponse.json({ error: 'O material solicitado não pertence a este pedido.' }, { status: 422 });

  const [{ data: products, error: productsError }, { data: deliveries, error: deliveriesError }] = await Promise.all([
    supabaseAdmin.from('products').select('id, titulo, is_plr').in('id', productIds),
    supabaseAdmin.from('product_deliveries').select('product_id, arquivo_url, arquivo_nome, plr_license_url').in('product_id', productIds)
  ]);
  if (productsError || deliveriesError) return NextResponse.json({ error: productsError?.message || deliveriesError?.message || 'Não foi possível preparar os materiais.' }, { status: 500 });

  const deliveryByProduct = new Map((deliveries || []).map(delivery => [delivery.product_id, delivery]));
  const materials = (products || []).map(product => {
    const delivery = deliveryByProduct.get(product.id);
    // Uma compra PLR nunca pode cair na entrega do produto final. Se a licença
    // não existir, interrompemos o reenvio em vez de expor o conteúdo errado.
    const fileUrl = isPlrPurchase ? delivery?.plr_license_url || null : delivery?.arquivo_url || null;
    return { id: product.id, title: product.titulo || (isPlrPurchase ? 'Licença PLR' : 'Material digital'), fileUrl, fileName: delivery?.arquivo_nome || null };
  });
  if (!materials.length) return NextResponse.json({ error: 'Os materiais deste pedido não estão mais disponíveis.' }, { status: 422 });
  if (isPlrPurchase && materials.some(material => !material.fileUrl)) {
    return NextResponse.json({ error: 'A licença PLR deste pedido não está mais disponível. Cadastre a entrega PLR antes de reenviar o acesso.' }, { status: 422 });
  }

  const productTitles = materials.map(material => material.title).join(', ');
  const emailResult = await sendAccessResendEmail({
    buyerEmail: order.buyer_email,
    buyerName: order.buyer_name || 'Cliente',
    orderId: order.id,
    productTitles,
    products: materials,
    creatorWhatsapp: store.whatsapp || null,
    isPlrPurchase
  });

  const directLinks = materials
    .filter(material => isExternalCreatorLink(material.fileUrl))
    .map(material => `🔗 ${material.title}: ${material.fileUrl}`);
  const accessArea = isPlrPurchase ? '/dashboard/plr/comprados' : '/cliente/dashboard';
  const loginArea = isPlrPurchase ? '/login' : '/cliente/login';
  const accessUrl = `${appUrl}${loginArea}?returnTo=${encodeURIComponent(accessArea)}`;
  const whatsappMessage = isPlrPurchase
    ? `🔐 *Reenvio de licença PLR solicitado*\n\nOlá, ${firstName(order.buyer_name, 'Criador(a)')}! Reenviamos a licença PLR adquirida:\n• ${materials.map(material => material.title).join('\n• ')}${directLinks.length ? `\n\n${directLinks.join('\n')}` : ''}\n\nAcesse suas licenças pelo painel do criador: ${accessUrl}`
    : `📚 *Reenvio de acesso solicitado*\n\nOlá, ${firstName(order.buyer_name, 'Cliente')}! Reenviamos o acesso aos materiais abaixo:\n• ${materials.map(material => material.title).join('\n• ')}${directLinks.length ? `\n\n${directLinks.join('\n')}` : ''}\n\nAcesse sua biblioteca com segurança: ${accessUrl}`;
  const whatsappResult = order.buyer_phone
    ? await sendEvolutionText(order.buyer_phone, whatsappMessage, storeInstance)
    : { sent: false, error: 'Cliente sem WhatsApp cadastrado.' };

  if (!emailResult.sent && !whatsappResult.sent) {
    return NextResponse.json({ error: emailResult.error || whatsappResult.error || 'Nenhum canal confirmou o envio.' }, { status: 502 });
  }

  return NextResponse.json({
    success: true,
    emailSent: emailResult.sent,
    whatsappSent: whatsappResult.sent,
    materials: materials.map(material => material.title),
    isPlrPurchase
  });
}
