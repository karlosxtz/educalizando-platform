import { NextResponse } from 'next/server';
import { checkInfinitePayPayment } from '@/lib/infinitepay-service';
import { getOrderRecordById, updateOrderStatus } from '@/lib/order-service';
import { supabaseAdmin } from '@/lib/supabase';
import { notifyConfirmedSale } from '@/lib/sale-notification-service';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const orderNsu = String(payload.order_nsu || '');
    const transactionNsu = String(payload.transaction_nsu || '');
    const invoiceSlug = String(payload.invoice_slug || payload.slug || '');

    if (!orderNsu || !transactionNsu || !invoiceSlug) {
      return NextResponse.json(
        { success: false, message: 'Referências do pagamento incompletas.' },
        { status: 400 }
      );
    }

    const { data: moduleSubscription } = await supabaseAdmin
      .from('whatsapp_store_subscriptions')
      .select('*').eq('order_nsu', orderNsu).maybeSingle();
    if (moduleSubscription) {
      const payment = await checkInfinitePayPayment({ orderNsu, transactionNsu, slug: invoiceSlug });
      if (!payment.paid || payment.amountInCents !== moduleSubscription.amount_cents) return NextResponse.json({ success: false, message: 'Pagamento do módulo não confirmado.' }, { status: 400 });
      const base = moduleSubscription.expires_at && new Date(moduleSubscription.expires_at) > new Date() ? new Date(moduleSubscription.expires_at) : new Date();
      base.setDate(base.getDate() + 30);
      await supabaseAdmin.from('whatsapp_store_subscriptions').update({ status: 'active', paid_at: new Date().toISOString(), expires_at: base.toISOString(), transaction_nsu: transactionNsu, updated_at: new Date().toISOString() }).eq('id', moduleSubscription.id);
      return NextResponse.json({ success: true, message: 'Módulo WhatsApp liberado.' });
    }

    const order = await getOrderRecordById(orderNsu);
    if (!order || order.paymentProvider !== 'infinitepay') {
      return NextResponse.json({ success: false, message: 'Pedido não encontrado.' }, { status: 400 });
    }

    // A notificação só é aceita após confirmação direta na API oficial da InfinitePay.
    const payment = await checkInfinitePayPayment({
      orderNsu,
      transactionNsu,
      slug: invoiceSlug
    });
    const expectedAmount = Math.round(order.totalAmount * 100);

    if (!payment.paid || payment.amountInCents !== expectedAmount) {
      return NextResponse.json({ success: false, message: 'Pagamento não confirmado ou valor divergente.' }, { status: 400 });
    }

    const { error: metadataError } = await supabaseAdmin.from('orders').update({
      infinitepay_transaction_nsu: transactionNsu,
      infinitepay_invoice_slug: invoiceSlug,
      receipt_url: payload.receipt_url || null,
      payment_method: payment.captureMethod === 'credit_card' ? 'credit_card' : 'pix'
    }).eq('id', orderNsu);
    if (metadataError) throw metadataError;

    const wasPending = order.status !== 'paid';
    const paidOrder = await updateOrderStatus(orderNsu, 'paid', undefined, 0);

    if (wasPending && paidOrder) await notifyConfirmedSale(paidOrder);

    return NextResponse.json({ success: true, message: null });
  } catch (error) {
    console.error('[InfinitePay Webhook] Erro:', error);
    return NextResponse.json({ success: false, message: 'Falha ao confirmar pagamento.' }, { status: 400 });
  }
}
