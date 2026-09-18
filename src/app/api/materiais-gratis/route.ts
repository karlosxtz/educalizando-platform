import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Faça login para ver os materiais gratuitos liberados para você.' }, { status: 401 });

    const { data: paidOrders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('store_id')
      .eq('student_id', user.id)
      .eq('status', 'paid')
      .gt('total_amount', 0);
    if (ordersError) throw ordersError;
    const storeIds = [...new Set((paidOrders || []).map((order) => order.store_id).filter(Boolean))];
    if (!storeIds.length) return NextResponse.json({ products: [], unlockedStoreCount: 0 });

    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('*, store:stores(*)')
      .in('store_id', storeIds)
      .eq('status', 'publicado')
      .is('excluido_em', null)
      .or('is_free.eq.true,preco.eq.0')
      .order('created_at', { ascending: false });
    if (productsError) throw productsError;
    return NextResponse.json({ products: products || [], unlockedStoreCount: storeIds.length });
  } catch (error) {
    console.error('[materiais-gratis]', error);
    return NextResponse.json({ error: 'Não foi possível carregar seus materiais gratuitos agora.' }, { status: 500 });
  }
}
