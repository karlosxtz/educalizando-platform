import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    if (!(await isSuperAdmin(request))) {
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
