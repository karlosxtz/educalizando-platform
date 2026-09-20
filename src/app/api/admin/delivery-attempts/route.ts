import { NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/api-auth';
import { completeTransactionalDelivery, failTransactionalDelivery } from '@/lib/transactional-delivery-service';
import { getOrderRecordById } from '@/lib/order-service';
import { sendSaleConfirmationToBuyer } from '@/lib/mail-service';
import { notifyConfirmedSale } from '@/lib/sale-notification-service';
import { supabaseAdmin } from '@/lib/supabase';

async function getDeliveryData(orderId: string) {
  const order = await getOrderRecordById(orderId);
  if (!order) throw new Error('Pedido não encontrado.');
  const [{ data: store }, { data: deliveries }] = await Promise.all([
    supabaseAdmin.from('stores').select('whatsapp').eq('id', order.storeId).maybeSingle(),
    order.items.length ? supabaseAdmin.from('product_deliveries').select('product_id, arquivo_url, arquivo_nome, plr_license_url').in('product_id', order.items.map(item => item.productId)) : Promise.resolve({ data: [] as Array<{ product_id: string; arquivo_url: string | null; arquivo_nome: string | null; plr_license_url: string | null }> }),
  ]);
  const byProduct = new Map((deliveries || []).map(item => [item.product_id, item]));
  return { order, creatorWhatsapp: store?.whatsapp || null, products: order.items.map(item => { const delivery = byProduct.get(item.productId); return { id: item.productId, title: item.productTitle || 'Material digital', fileUrl: order.is_plr_purchase ? delivery?.plr_license_url : delivery?.arquivo_url, fileName: delivery?.arquivo_nome }; }) };
}

export async function GET(request: Request) {
  if (!(await isSuperAdmin(request))) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  const { data, error } = await supabaseAdmin.from('transactional_delivery_attempts').select('id, order_id, channel, event_type, status, attempts, last_error, last_attempt_at, sent_at, created_at').order('created_at', { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const orderIds = [...new Set((data || []).map(item => item.order_id))];
  const { data: orders } = orderIds.length ? await supabaseAdmin.from('orders').select('id, buyer_name, buyer_email, total_amount, status').in('id', orderIds) : { data: [] as Array<{ id: string; buyer_name: string | null; buyer_email: string | null; total_amount: number | null; status: string | null }> };
  const byOrder = new Map((orders || []).map(order => [order.id, order]));
  return NextResponse.json({ attempts: (data || []).map(item => ({ ...item, order: byOrder.get(item.order_id) || null })) });
}

export async function POST(request: Request) {
  if (!(await isSuperAdmin(request))) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  const body = await request.json().catch(() => null) as { id?: string; action?: string } | null;
  if (body?.action !== 'retry' || !body.id) return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  const { data: attempt, error } = await supabaseAdmin.from('transactional_delivery_attempts').select('id, order_id, channel, event_type, attempts').eq('id', body.id).eq('status', 'FAILED').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!attempt) return NextResponse.json({ error: 'Este envio já foi processado ou está sendo tratado por outra execução.' }, { status: 409 });
  if (attempt.channel === 'WHATSAPP' && (attempt.event_type === 'MATERIAL_DELIVERY' || attempt.event_type === 'CREATOR_SALE_ALERT')) {
    try {
      const order = await getOrderRecordById(attempt.order_id);
      if (!order) throw new Error('Pedido não encontrado.');
      await notifyConfirmedSale(order, { retryWhatsApp: true });
      return NextResponse.json({ success: true });
    } catch (retryError) {
      const message = retryError instanceof Error ? retryError.message : 'Falha inesperada ao reenviar WhatsApp.';
      return NextResponse.json({ error: message }, { status: 422 });
    }
  }
  if (attempt.channel !== 'EMAIL' || attempt.event_type !== 'MATERIAL_DELIVERY') return NextResponse.json({ error: 'Este tipo de envio ainda não pode ser reenviado manualmente.' }, { status: 422 });
  const { data: claimedAttempt, error: claimError } = await supabaseAdmin.from('transactional_delivery_attempts').update({ status: 'PROCESSING', attempts: attempt.attempts + 1, last_attempt_at: new Date().toISOString() }).eq('id', attempt.id).eq('status', 'FAILED').select('id, order_id, channel, event_type').maybeSingle();
  if (claimError) return NextResponse.json({ error: claimError.message }, { status: 500 });
  if (!claimedAttempt) return NextResponse.json({ error: 'Este envio já foi reservado por outra execução.' }, { status: 409 });
  try {
    const { order, creatorWhatsapp, products } = await getDeliveryData(claimedAttempt.order_id);
    const result = await sendSaleConfirmationToBuyer({ buyerEmail: order.buyerEmail, buyerName: order.buyerName, orderId: order.id, productTitles: order.items.map(item => item.productTitle || 'Material digital').join(', ') || 'Material digital', products, creatorWhatsapp, isPlrPurchase: order.is_plr_purchase === true });
    if (!result.sent) throw new Error(result.error || 'A Resend não confirmou o envio.');
    await completeTransactionalDelivery(claimedAttempt.id);
    return NextResponse.json({ success: true });
  } catch (retryError) {
    const message = retryError instanceof Error ? retryError.message : 'Falha inesperada ao reenviar.';
    await failTransactionalDelivery(claimedAttempt.id, message);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
