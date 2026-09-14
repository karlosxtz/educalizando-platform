import { NextResponse } from 'next/server';
import { getOrderRecordById, updateOrderStatus } from '@/lib/order-service';
import { getAsaasPaymentStatus } from '@/lib/asaas-service';
import { checkInfinitePayPayment } from '@/lib/infinitepay-service';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { notifyConfirmedSale } from '@/lib/sale-notification-service';

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Autenticação obrigatória.' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({ success: false, error: 'ID do pedido não informado.' }, { status: 400 });
  }

  try {
    const order = await getOrderRecordById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Pedido não encontrado.' }, { status: 404 });
    }

    const { data: orderAccess } = await supabaseAdmin
      .from('orders')
      .select('student_id, store_id')
      .eq('id', orderId)
      .maybeSingle();
    const { data: storeAccess } = orderAccess
      ? await supabaseAdmin.from('stores').select('creator_id').eq('id', orderAccess.store_id).maybeSingle()
      : { data: null };
    if (!orderAccess || (orderAccess.student_id !== user.id && storeAccess?.creator_id !== user.id)) {
      return NextResponse.json({ success: false, error: 'Acesso negado.' }, { status: 403 });
    }

    let status = order.status;

    if (status === 'pending' && order.paymentProvider === 'infinitepay') {
      const transactionNsu = searchParams.get('transaction_nsu');
      const slug = searchParams.get('slug');

      if (transactionNsu && slug) {
        const payment = await checkInfinitePayPayment({ orderNsu: order.id, transactionNsu, slug });
        if (payment.paid && payment.amountInCents === Math.round(order.totalAmount * 100)) {
          await supabaseAdmin.from('orders').update({
            infinitepay_transaction_nsu: transactionNsu,
            infinitepay_invoice_slug: slug,
            payment_method: payment.captureMethod === 'credit_card' ? 'credit_card' : 'pix'
          }).eq('id', order.id);
          const updated = await updateOrderStatus(order.id, 'paid', undefined, 0);
          status = updated?.status || 'paid';
          if (updated) await notifyConfirmedSale(updated);
        }
      }
    }
    // Pedidos antigos continuam consultáveis durante a transição.
    else if (status === 'pending' && order.asaasPaymentId) {
      const asaasCheck = await getAsaasPaymentStatus(order.asaasPaymentId);
      if (asaasCheck.status === 'RECEIVED' || asaasCheck.status === 'CONFIRMED' || asaasCheck.status === 'DUNNING_RECEIVED') {
        const updated = await updateOrderStatus(order.id, 'paid', order.asaasPaymentId);
        status = updated?.status || 'paid';
      } else if (asaasCheck.status === 'OVERDUE' || asaasCheck.status === 'REFUND_REQUESTED') {
        const updated = await updateOrderStatus(order.id, 'failed', order.asaasPaymentId);
        status = updated?.status || 'failed';
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      status,
      paidAt: order.paidAt,
      totalAmount: order.totalAmount,
      pixCopyPaste: order.pixCopyPaste,
      pixQrCodeBase64: order.pixQrCodeBase64
    });
  } catch (err: any) {
    console.error('[API Checkout Status Error]:', err);
    return NextResponse.json({ success: false, error: 'Erro ao verificar status do pedido.' }, { status: 500 });
  }
}
