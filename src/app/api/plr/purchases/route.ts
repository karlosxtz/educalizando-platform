import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

    const isCreator = user.user_metadata?.role === 'creator' || user.user_metadata?.is_creator === true;
    if (!isCreator) return NextResponse.json({ error: 'Acesso exclusivo para criadores.' }, { status: 403 });

    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, paid_at, total_amount')
      .eq('student_id', user.id)
      .eq('is_plr_purchase', true)
      .eq('status', 'paid')
      .order('paid_at', { ascending: false });
    if (ordersError) throw ordersError;
    if (!orders?.length) return NextResponse.json({ items: [] });

    const orderIds = orders.map(order => order.id);
    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('id, order_id, product_id, unit_price')
      .in('order_id', orderIds);
    if (itemsError) throw itemsError;

    const productIds = [...new Set((orderItems || []).map(item => item.product_id).filter(Boolean))];
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, titulo, capa_url, has_plr_delivery, stores(nome_loja)')
      .in('id', productIds);
    if (productsError) throw productsError;

    const items = (orderItems || []).flatMap(item => {
      const order = orders.find(candidate => candidate.id === item.order_id);
      const product = (products || []).find(candidate => candidate.id === item.product_id);
      if (!order || !product) return [];
      const store = Array.isArray(product.stores) ? product.stores[0] : product.stores;
      return [{
        id: item.id,
        orderId: order.id,
        productId: product.id,
        productTitle: product.titulo || 'Produto',
        paidAt: order.paid_at || '',
        amount: Number(item.unit_price || 0),
        coverUrl: product.capa_url || null,
        storeName: store?.nome_loja || 'Loja Educalizando',
        hasPlrFile: Boolean(product.has_plr_delivery)
      }];
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('[GET /api/plr/purchases] Erro:', error);
    return NextResponse.json({ error: 'Não foi possível carregar suas licenças PLR.' }, { status: 500 });
  }
}
