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

    // Buscando as vendas e transações financeiras da tabela orders
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*, store:stores(nome_loja)')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;

    return NextResponse.json({ success: true, transactions: orders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
