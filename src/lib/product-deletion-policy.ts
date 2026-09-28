import { supabaseAdmin } from '@/lib/supabase';

export type ProductDeletionProtection = {
  blocked: boolean;
  paidOrders: number;
  hasFinalPurchase: boolean;
  hasPlrPurchase: boolean;
  hasGrantedAccess: boolean;
};

/**
 * Produtos adquiridos precisam permanecer no catálogo interno para preservar
 * pedidos, licenças PLR, downloads e o histórico financeiro do comprador.
 * Esta verificação roda somente no servidor e falha de forma segura: se o
 * banco não puder confirmar a ausência de compras, a exclusão não prossegue.
 */
export async function getProductDeletionProtection(productId: string): Promise<ProductDeletionProtection> {
  const { data: orderItems, error: orderItemsError } = await supabaseAdmin
    .from('order_items')
    .select('order_id')
    .eq('product_id', productId);

  if (orderItemsError) {
    throw new Error(`Não foi possível verificar as compras deste produto: ${orderItemsError.message}`);
  }

  const orderIds = Array.from(new Set((orderItems || []).map((item) => item.order_id).filter(Boolean)));
  let paidOrders: Array<{ id: string; is_plr_purchase: boolean | null; status: string; paid_at: string | null }> = [];

  if (orderIds.length > 0) {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('id,is_plr_purchase,status,paid_at')
      .in('id', orderIds);

    if (error) {
      throw new Error(`Não foi possível confirmar o histórico de vendas deste produto: ${error.message}`);
    }
    // Um estorno não apaga o fato de que houve compra nem o histórico que
    // precisa continuar referenciando este produto.
    paidOrders = (data || []).filter((order) => order.status === 'paid' || order.status === 'refunded' || Boolean(order.paid_at));
  }

  // Mantém compatibilidade com compras finais antigas cujo acesso foi
  // concedido antes da padronização completa da tabela order_items.
  const { data: grantedAccess, error: accessError } = await supabaseAdmin
    .from('student_product_access')
    .select('id')
    .eq('product_id', productId)
    .eq('status', 'ACTIVE')
    .limit(1);

  if (accessError) {
    throw new Error(`Não foi possível verificar os acessos concedidos deste produto: ${accessError.message}`);
  }

  const hasGrantedAccess = Boolean(grantedAccess?.length);
  return {
    blocked: paidOrders.length > 0 || hasGrantedAccess,
    paidOrders: paidOrders.length,
    hasFinalPurchase: paidOrders.some((order) => order.is_plr_purchase !== true) || hasGrantedAccess,
    hasPlrPurchase: paidOrders.some((order) => order.is_plr_purchase === true),
    hasGrantedAccess,
  };
}

export function productDeletionBlockedMessage(protection: ProductDeletionProtection) {
  const kinds = [
    protection.hasFinalPurchase ? 'material final' : '',
    protection.hasPlrPurchase ? 'licença PLR' : '',
  ].filter(Boolean).join(' e ');

  return `Este produto já possui ${kinds ? `compra de ${kinds}` : 'compra ou acesso concedido'} e não pode ser excluído. Despublique o produto para impedir novas vendas sem remover o acesso de quem já comprou.`;
}
