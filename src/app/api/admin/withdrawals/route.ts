import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/api-auth';

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
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'ID e ação obrigatórios' }, { status: 400 });
    }

    let status = '';
    let updateData: any = {};

    if (action === 'approve') {
      status = 'COMPLETED';
      updateData = { status, completed_at: new Date().toISOString() };
    } else if (action === 'reject') {
      status = 'FAILED';
      updateData = { status, failed_at: new Date().toISOString(), failure_reason: 'Rejeitado pelo Super Admin' };
    } else {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('withdrawals')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
