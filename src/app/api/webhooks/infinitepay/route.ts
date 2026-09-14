import { NextResponse } from 'next/server';
import { checkInfinitePayPayment } from '@/lib/infinitepay-service';
import { getOrderRecordById, updateOrderStatus } from '@/lib/order-service';
import { supabaseAdmin } from '@/lib/supabase';

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

    await updateOrderStatus(orderNsu, 'paid', undefined, 0);

    return NextResponse.json({ success: true, message: null });
  } catch (error) {
    console.error('[InfinitePay Webhook] Erro:', error);
    return NextResponse.json({ success: false, message: 'Falha ao confirmar pagamento.' }, { status: 400 });
  }
}
