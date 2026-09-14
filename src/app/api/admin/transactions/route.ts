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
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;

    const storeIds = [...new Set((orders || []).map((order: any) => order.store_id).filter(Boolean))];
    const { data: stores } = storeIds.length
      ? await supabaseAdmin.from('stores').select('id, nome_loja').in('id', storeIds)
      : { data: [] };
    const storesById = new Map((stores || []).map((store: any) => [store.id, { nome_loja: store.nome_loja }]));
    const transactions = (orders || []).map((order: any) => ({
      ...order,
      store: storesById.get(order.store_id) || { nome_loja: 'Loja não encontrada' }
    }));

    return NextResponse.json({ success: true, transactions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
