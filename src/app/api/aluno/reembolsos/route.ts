import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

async function getOrderAccessState(studentId: string, orderId: string) {
  const { data: items, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .select('product_id, product_title')
    .eq('order_id', orderId);
  if (itemsError) throw itemsError;

  const productIds = [...new Set((items || []).map((item: any) => String(item.product_id)).filter(Boolean))];
  if (productIds.length === 0) return { productIds, accessed: false };

  const { data: accessEvents, error: accessError } = await supabaseAdmin
    .from('content_access_events')
    .select('id')
    .eq('customer_id', studentId)
    .in('product_id', productIds)
    .in('event_type', ['FILE_DOWNLOAD', 'EXTERNAL_LINK_ACCESS'])
    .limit(1);
  if (accessError) throw accessError;
  return { productIds, accessed: Boolean(accessEvents?.length) };
}

export async function GET(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user?.id) return NextResponse.json({ error: 'Autenticação obrigatória.' }, { status: 401 });
    const storeId = new URL(request.url).searchParams.get('storeId');

    let query = supabaseAdmin
      .from('orders')
      .select('id, store_id, total_amount, created_at, status, is_plr_purchase')
      .eq('student_id', user.id)
      .eq('status', 'paid')
      .or('is_plr_purchase.is.false,is_plr_purchase.is.null')
      .order('created_at', { ascending: false });
    if (storeId) query = query.eq('store_id', storeId);
    const { data: orders, error: ordersError } = await query;
    if (ordersError) throw ordersError;

    const orderIds = (orders || []).map((order: any) => order.id);
    const { data: requests, error: requestsError } = orderIds.length
      ? await supabaseAdmin.from('order_refund_requests').select('id, order_id, status, created_at, review_note').in('order_id', orderIds)
      : { data: [], error: null };
    if (requestsError) throw requestsError;
    const requestByOrderId = new Map((requests || []).map((refundRequest: any) => [refundRequest.order_id, refundRequest]));

    const eligibility = await Promise.all((orders || []).map(async (order: any) => {
      const access = await getOrderAccessState(user.id, order.id);
      return {
        orderId: order.id,
        accessed: access.accessed,
        request: requestByOrderId.get(order.id) || null,
      };
    }));

    return NextResponse.json({ success: true, eligibility });
  } catch (error: any) {
    const message = error?.code === '42P01'
      ? 'O módulo de solicitações de reembolso ainda não está disponível. Aplique a migration 20260920_add_customer_refund_requests.sql.'
      : error?.message || 'Não foi possível carregar as solicitações de reembolso.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user?.id || !user.email) return NextResponse.json({ error: 'Autenticação obrigatória.' }, { status: 401 });
    const body = await request.json().catch(() => null);
    const orderId = typeof body?.orderId === 'string' ? body.orderId : '';
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';
    if (!orderId) return NextResponse.json({ error: 'Pedido não informado.' }, { status: 422 });
    if (reason.length < 10 || reason.length > 1000) {
      return NextResponse.json({ error: 'Descreva o motivo da solicitação entre 10 e 1.000 caracteres.' }, { status: 422 });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, student_id, status, is_plr_purchase')
      .eq('id', orderId)
      .eq('student_id', user.id)
      .maybeSingle();
    if (orderError) throw orderError;
    if (!order) return NextResponse.json({ error: 'Pedido não encontrado para esta conta.' }, { status: 404 });
    if (order.status !== 'paid' || order.is_plr_purchase) {
      return NextResponse.json({ error: 'Este pedido não é elegível para solicitação de reembolso.' }, { status: 409 });
    }

    const { accessed } = await getOrderAccessState(user.id, order.id);
    if (accessed) {
      return NextResponse.json({ error: 'Não é possível solicitar reembolso após acessar, abrir link externo ou baixar qualquer material deste pedido.' }, { status: 409 });
    }

    const { error: insertError } = await supabaseAdmin.from('order_refund_requests').insert({
      order_id: order.id,
      requester_id: user.id,
      requester_email: user.email.toLowerCase(),
      reason,
      status: 'PENDING'
    });
    if (insertError?.code === '23505') {
      return NextResponse.json({ error: 'Já existe uma solicitação de reembolso para este pedido.' }, { status: 409 });
    }
    if (insertError) throw insertError;

    return NextResponse.json({ success: true, message: 'Solicitação enviada para análise. Você será avisado após a decisão.' }, { status: 201 });
  } catch (error: any) {
    const message = error?.code === '42P01'
      ? 'O módulo de solicitações de reembolso ainda não está disponível. Aplique a migration 20260920_add_customer_refund_requests.sql.'
      : error?.message || 'Não foi possível enviar a solicitação.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
