import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getRequestUser, isSuperAdmin } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    if (!(await isSuperAdmin(request))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { data: withdrawals, error } = await supabaseAdmin
      .from('withdrawals')
      .select('*, store:stores(nome_loja, slug)')
      .order('requested_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, withdrawals });
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

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
