import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getRequestUser, isSuperAdmin } from '@/lib/api-auth';
import { createNotification } from '@/lib/notification-service';

export async function GET(request: Request) {
  try {
    if (!(await isSuperAdmin(request))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { data: withdrawals, error } = await supabaseAdmin
      .from('withdrawals')
      .select('*')
      .order('requested_at', { ascending: false });

    if (error) throw error;

    const storeIds = [...new Set((withdrawals || []).map((item: any) => item.store_id).filter(Boolean))];
    const { data: stores } = storeIds.length
      ? await supabaseAdmin.from('stores').select('id, nome_loja, slug').in('id', storeIds)
      : { data: [] };
    const storesById = new Map((stores || []).map((store: any) => [store.id, { nome_loja: store.nome_loja, slug: store.slug }]));
    const enrichedWithdrawals = (withdrawals || []).map((item: any) => ({
      ...item,
      store: storesById.get(item.store_id) || { nome_loja: 'Loja não encontrada', slug: '' }
    }));

    return NextResponse.json({ success: true, withdrawals: enrichedWithdrawals });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await isSuperAdmin(request))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { id, action, paymentReference, reviewNote } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'ID e ação obrigatórios' }, { status: 400 });
    }

    if (action !== 'complete' && action !== 'reject') {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }
    if (action === 'complete' && !paymentReference?.trim()) {
      return NextResponse.json({ error: 'Informe a referência ou comprovante da transferência.' }, { status: 400 });
    }

    const reviewer = await getRequestUser(request);
    if (!reviewer) return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 });

    const { data: withdrawal } = await supabaseAdmin
      .from('withdrawals')
      .select('id, creator_id, store_id, amount')
      .eq('id', id)
      .maybeSingle();

    if (!withdrawal) {
      return NextResponse.json({ error: 'Solicitação de saque não encontrada.' }, { status: 404 });
    }

    const { data: result, error } = await supabaseAdmin.rpc('review_manual_withdrawal', {
      p_withdrawal_id: id,
      p_action: action,
      p_reviewed_by: reviewer.id,
      p_payment_reference: paymentReference?.trim() || null,
      p_review_note: reviewNote?.trim() || null
    });

    if (error) throw error;
    if (!result?.success) {
      return NextResponse.json({ error: result?.error || 'Não foi possível analisar o saque.' }, { status: 400 });
    }

    if (withdrawal.store_id && withdrawal.creator_id) {
      const approved = action === 'complete';
      await createNotification({
        storeId: withdrawal.store_id,
        creatorId: withdrawal.creator_id,
        type: approved ? 'WITHDRAWAL_APPROVED' : 'WITHDRAWAL_FAILED',
        title: approved ? 'Saque pago' : 'Saque recusado',
        body: approved
          ? `Seu saque de R$ ${Number(withdrawal.amount).toFixed(2).replace('.', ',')} foi pago.`
          : `Seu saque de R$ ${Number(withdrawal.amount).toFixed(2).replace('.', ',')} foi recusado${reviewNote?.trim() ? `: ${reviewNote.trim()}` : '.'}`,
        metadata: { withdrawalId: withdrawal.id, amount: Number(withdrawal.amount) }
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
