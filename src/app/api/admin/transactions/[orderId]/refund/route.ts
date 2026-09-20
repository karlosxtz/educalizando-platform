import { NextResponse } from 'next/server';
import { getRequestUser, isSuperAdmin } from '@/lib/api-auth';
import { getOrderRecordById, updateOrderStatus } from '@/lib/order-service';
import { supabaseAdmin } from '@/lib/supabase';

type RefundAuditStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';

function messageForDatabaseError(error: { code?: string; message?: string }) {
  if (error.code === '42P01') {
    return 'A auditoria de estornos ainda não está disponível. Aplique a migration 20260920_add_admin_order_refund_audit.sql antes de usar esta ação.';
  }
  return error.message || 'Não foi possível registrar a auditoria do estorno.';
}

async function hasOrderContentAccess(order: { id: string; studentId?: string | null }) {
  if (!order.studentId) return false;
  const { data: items, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .select('product_id')
    .eq('order_id', order.id);
  if (itemsError) throw itemsError;
  const productIds = [...new Set((items || []).map((item: any) => String(item.product_id)).filter(Boolean))];
  if (!productIds.length) return false;
  const { data: events, error: eventsError } = await supabaseAdmin
    .from('content_access_events')
    .select('id')
    .eq('customer_id', order.studentId)
    .in('product_id', productIds)
    .in('event_type', ['FILE_DOWNLOAD', 'EXTERNAL_LINK_ACCESS'])
    .limit(1);
  if (eventsError) throw eventsError;
  return Boolean(events?.length);
}

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    if (!(await isSuperAdmin(request))) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const admin = await getRequestUser(request);
    if (!admin?.id || !admin.email) {
      return NextResponse.json({ error: 'Sessão administrativa inválida.' }, { status: 401 });
    }

    const { orderId } = await params;
    const body = await request.json().catch(() => null);
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';
    const confirmation = typeof body?.confirmation === 'string' ? body.confirmation.trim() : '';
    const fromCustomerRequest = body?.fromCustomerRequest === true;
    const confirmationPhrase = `ESTORNAR ${orderId.slice(-6).toUpperCase()}`;

    if (reason.length < 5 || reason.length > 1000) {
      return NextResponse.json({ error: 'Informe um motivo entre 5 e 1.000 caracteres.' }, { status: 422 });
    }
    if (confirmation !== confirmationPhrase) {
      return NextResponse.json({ error: `Confirmação inválida. Digite exatamente: ${confirmationPhrase}` }, { status: 422 });
    }

    const order = await getOrderRecordById(orderId);
    if (!order) return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    if (order.status !== 'paid') {
      const detail = order.status === 'refunded' ? 'Este pedido já foi estornado.' : 'Apenas pedidos pagos podem ser estornados.';
      return NextResponse.json({ error: detail }, { status: 409 });
    }
    if (fromCustomerRequest && await hasOrderContentAccess(order)) {
      return NextResponse.json({ error: 'Esta solicitação não pode ser aprovada: o cliente já acessou, abriu link ou baixou material deste pedido.' }, { status: 409 });
    }

    const auditPayload = {
      order_id: order.id,
      admin_user_id: admin.id,
      admin_email: admin.email.toLowerCase(),
      reason,
      status: 'PROCESSING' satisfies RefundAuditStatus,
      failure_reason: null,
      completed_at: null
    };
    const { error: auditInsertError } = await supabaseAdmin.from('order_refund_audits').insert(auditPayload);

    if (auditInsertError?.code === '23505') {
      const { data: previousAudit, error: previousAuditError } = await supabaseAdmin
        .from('order_refund_audits')
        .select('status')
        .eq('order_id', order.id)
        .maybeSingle();
      if (previousAuditError) throw previousAuditError;
      if (previousAudit?.status !== 'FAILED') {
        return NextResponse.json({ error: 'Já existe uma tentativa de estorno em andamento ou concluída para este pedido.' }, { status: 409 });
      }

      const { error: retryAuditError } = await supabaseAdmin
        .from('order_refund_audits')
        .update(auditPayload)
        .eq('order_id', order.id);
      if (retryAuditError) throw retryAuditError;
    } else if (auditInsertError) {
      return NextResponse.json({ error: messageForDatabaseError(auditInsertError) }, { status: 500 });
    }

    try {
      const refundedOrder = await updateOrderStatus(order.id, 'refunded');
      if (!refundedOrder) throw new Error('Não foi possível atualizar o pedido.');

      const { error: completeAuditError } = await supabaseAdmin
        .from('order_refund_audits')
        .update({ status: 'COMPLETED', completed_at: new Date().toISOString(), failure_reason: null })
        .eq('order_id', order.id);
      if (completeAuditError) throw completeAuditError;

      // Caso o estorno tenha começado por uma solicitação do comprador, a
      // análise é concluída junto com o estorno; o pedido não fica pendente.
      const { error: approveRequestError } = await supabaseAdmin
        .from('order_refund_requests')
        .update({ status: 'APPROVED', reviewed_by: admin.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('order_id', order.id)
        .eq('status', 'PENDING');
      if (approveRequestError && approveRequestError.code !== '42P01') throw approveRequestError;

      return NextResponse.json({
        success: true,
        order: { id: refundedOrder.id, status: refundedOrder.status },
        message: 'Estorno administrativo registrado. O acesso foi revogado e os ajustes internos foram lançados.'
      });
    } catch (refundError) {
      const failureReason = refundError instanceof Error ? refundError.message : 'Falha desconhecida ao aplicar o estorno.';
      await supabaseAdmin
        .from('order_refund_audits')
        .update({ status: 'FAILED', failure_reason: failureReason })
        .eq('order_id', order.id);
      throw refundError;
    }
  } catch (error) {
    console.error('[admin refund] erro:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível concluir o estorno.' }, { status: 500 });
  }
}
