import { supabase, isRealSupabaseConfigured } from './supabase';
import { getLocalOrders } from './sales-service';

export interface DashboardOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_title?: string;
  product_type?: string;
}

export interface DashboardOrder {
  id: string;
  store_id: string;
  buyer_name: string;
  buyer_email: string;
  subtotal_amount: number;
  total_amount: number;
  platform_fee_amount: number;
  asaas_fee_amount: number;
  creator_net_amount: number;
  status: string;
  payment_method: string;
  asaas_payment_id?: string;
  created_at: string;
  items: DashboardOrderItem[];
}

export async function getCreatorOrders(storeId: string): Promise<DashboardOrder[]> {
  if (!storeId) return [];

  if (isRealSupabaseConfigured()) {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('[getCreatorOrders] Erro Supabase:', ordersError);
        return [];
      }

      if (ordersData) {
        return ordersData.map((o: any) => ({
          id: o.id,
          store_id: o.store_id,
          buyer_name: o.buyer_name || o.cliente_nome || 'Cliente',
          buyer_email: o.buyer_email || o.cliente_email || '',
          subtotal_amount: Number(o.subtotal_amount || 0),
          total_amount: Number(o.total_amount || o.valor_total || o.amount || 0),
          platform_fee_amount: Number(o.platform_fee_amount || 0),
          asaas_fee_amount: Number(o.asaas_fee_amount || 0),
          creator_net_amount: Number(o.creator_net_amount || 0),
          status: o.status,
          payment_method: o.payment_method || o.metodo_pagamento || 'pix',
          asaas_payment_id: o.asaas_payment_id,
          created_at: o.created_at,
          items: (o.order_items || []).map((item: any) => ({
            id: item.id,
            order_id: item.order_id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: Number(item.unit_price),
            total_price: Number(item.total_price),
            product_title: item.product_title || o.produto_titulo,
            product_type: item.product_type || o.tipo_produto
          }))
        }));
      }
    } catch (err) {
      console.error('[getCreatorOrders] Exceção:', err);
    }
  }

  // Fallback Local
  const localOrders = getLocalOrders();
  return localOrders.map(o => ({
    id: o.id,
    store_id: storeId,
    buyer_name: o.clienteNome || 'Cliente',
    buyer_email: o.clienteEmail || '',
    subtotal_amount: o.valorTotal || 0,
    total_amount: o.valorTotal || 0,
    platform_fee_amount: 0,
    asaas_fee_amount: 0,
    creator_net_amount: o.valorTotal || 0,
    status: o.statusPagamento || 'paid',
    payment_method: 'pix',
    created_at: o.dataCompra,
    items: [
      {
        id: `item_${o.id}`,
        order_id: o.id,
        product_id: 'local_prod',
        quantity: 1,
        unit_price: o.valorTotal,
        total_price: o.valorTotal,
        product_title: o.produtoTitulo,
        product_type: o.tipoProduto
      }
    ]
  }));
}
