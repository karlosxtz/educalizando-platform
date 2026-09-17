import { supabaseAdmin } from '@/lib/supabase';

/**
 * Quantidade real de pedidos pagos de um produto. O número é agregado e não
 * expõe dados de clientes; pedidos pendentes, cancelados e reembolsados ficam
 * fora da prova social.
 */
export async function getPaidProductSalesCount(productId: string): Promise<number> {
  if (!productId) return 0;

  try {
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('order_id')
      .eq('product_id', productId);
    if (itemsError || !items?.length) return 0;

    const orderIds = [...new Set(items.map((item) => item.order_id).filter(Boolean))];
    const { count, error: countError } = await supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('id', orderIds)
      .eq('status', 'paid');
    return countError ? 0 : count || 0;
  } catch (error) {
    console.warn('[product-social-proof] Não foi possível calcular vendas confirmadas:', error);
    return 0;
  }
}
