import { NextResponse } from 'next/server';
import { getOrderRecordById, updateOrderStatus } from '@/lib/order-service';
import { getAsaasPaymentStatus } from '@/lib/asaas-service';

export async function GET(request: Request) {
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

    let status = order.status;

    // Se o pedido no banco ainda estiver pendente, consultar o Asaas em tempo real
    if (status === 'pending' && order.asaasPaymentId) {
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
