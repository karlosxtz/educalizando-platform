import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

async function checkSuperAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value;
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'rafinhaagathathamy@gmail.com';
    return payload.email === superAdminEmail;
  } catch (e) {
    return false;
  }
}

export async function GET() {
  try {
    if (!(await checkSuperAdmin())) {
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
    if (!(await checkSuperAdmin())) {
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
