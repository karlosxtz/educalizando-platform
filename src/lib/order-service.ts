import { supabase, isRealSupabaseConfigured } from './supabase';
import { getLocalOrders, saveLocalOrders } from './sales-service';
import { ContentItem } from './content-delivery-service';

export type PaymentMethodType = 'pix' | 'credit_card' | 'boleto';
export type OrderStatusType = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItemRecord {
  id: string;
  orderId: string;
  productId: string;
  productTitle?: string;
  storeId: string;
  unitPrice: number;
  platformFeeAmount: number;
  creatorNetAmount: number;
}

export interface OrderRecord {
  id: string;
  storeId: string;
  buyerName: string;
  buyerEmail: string;
  buyerCpf: string;
  buyerPhone?: string | null;
  totalAmount: number;
  platformFeeAmount: number; // 10% + R$ 1,00 por produto (congelado no pedido)
  creatorNetAmount: number; // Valor líquido do criador
  status: OrderStatusType;
  asaasPaymentId?: string | null;
  asaasCustomerId?: string | null;
  paymentMethod: PaymentMethodType;
  pixCopyPaste?: string | null;
  pixQrCodeBase64?: string | null;
  items: OrderItemRecord[];
  createdAt: string;
  paidAt?: string | null;
}

// 1. Cálculo Congelado de Taxas da Plataforma (10% + R$ 1,00 por produto)
export function calculateOrderFees(items: Array<{ productId: string; productTitle?: string; unitPrice: number; storeId: string }>) {
  let totalAmount = 0;
  let totalPlatformFee = 0;
  let totalCreatorNet = 0;

  const itemRecords: Array<{
    productId: string;
    productTitle?: string;
    storeId: string;
    unitPrice: number;
    platformFeeAmount: number;
    creatorNetAmount: number;
  }> = items.map(item => {
    const price = Number(item.unitPrice || 0);
    // Regra: R$ 1,00 fixo por item de produto + 10% sobre o preço do item
    const fee = 1.0 + (price * 0.10);
    const net = Math.max(0, price - fee);

    totalAmount += price;
    totalPlatformFee += fee;
    totalCreatorNet += net;

    return {
      productId: item.productId,
      productTitle: item.productTitle,
      storeId: item.storeId,
      unitPrice: price,
      platformFeeAmount: Number(fee.toFixed(2)),
      creatorNetAmount: Number(net.toFixed(2))
    };
  });

  return {
    totalAmount: Number(totalAmount.toFixed(2)),
    platformFeeAmount: Number(totalPlatformFee.toFixed(2)),
    creatorNetAmount: Number(totalCreatorNet.toFixed(2)),
    items: itemRecords
  };
}

// Key LocalStorage para persistência de pedidos completos do Asaas
const LOCAL_ASAAS_ORDERS_KEY = 'educalizando_asaas_orders_v1';

function getLocalAsaasOrders(): OrderRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_ASAAS_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalAsaasOrders(orders: OrderRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_ASAAS_ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Erro ao salvar pedidos Asaas no localStorage:', e);
  }
}

// 2. Criar Registro do Pedido (Banco Real Supabase + LocalStorage Fallback)
export async function createOrderRecord(data: {
  storeId: string;
  buyerName: string;
  buyerEmail: string;
  buyerCpf: string;
  buyerPhone?: string;
  paymentMethod: PaymentMethodType;
  items: Array<{ productId: string; productTitle?: string; unitPrice: number; storeId: string }>;
  asaasPaymentId?: string;
  asaasCustomerId?: string;
  pixCopyPaste?: string;
  pixQrCodeBase64?: string;
}): Promise<OrderRecord> {
  const fees = calculateOrderFees(data.items);
  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const formattedItems: OrderItemRecord[] = fees.items.map((it, idx) => ({
    id: `item_${orderId}_${idx}`,
    orderId,
    productId: it.productId,
    productTitle: it.productTitle,
    storeId: it.storeId,
    unitPrice: it.unitPrice,
    platformFeeAmount: it.platformFeeAmount,
    creatorNetAmount: it.creatorNetAmount
  }));

  const newOrder: OrderRecord = {
    id: orderId,
    storeId: data.storeId,
    buyerName: data.buyerName,
    buyerEmail: data.buyerEmail.toLowerCase().trim(),
    buyerCpf: data.buyerCpf,
    buyerPhone: data.buyerPhone || null,
    totalAmount: fees.totalAmount,
    platformFeeAmount: fees.platformFeeAmount,
    creatorNetAmount: fees.creatorNetAmount,
    status: 'pending',
    asaasPaymentId: data.asaasPaymentId || null,
    asaasCustomerId: data.asaasCustomerId || null,
    paymentMethod: data.paymentMethod,
    pixCopyPaste: data.pixCopyPaste || null,
    pixQrCodeBase64: data.pixQrCodeBase64 || null,
    items: formattedItems,
    createdAt: now,
    paidAt: null
  };

  // Gravar no Supabase se configurado
  if (isRealSupabaseConfigured()) {
    try {
      await supabase.from('orders').insert([{
        id: newOrder.id,
        store_id: newOrder.storeId,
        buyer_name: newOrder.buyerName,
        buyer_email: newOrder.buyerEmail,
        buyer_cpf: newOrder.buyerCpf,
        buyer_phone: newOrder.buyerPhone,
        total_amount: newOrder.totalAmount,
        platform_fee_amount: newOrder.platformFeeAmount,
        creator_net_amount: newOrder.creatorNetAmount,
        status: 'pending',
        asaas_payment_id: newOrder.asaasPaymentId,
        asaas_customer_id: newOrder.asaasCustomerId,
        payment_method: newOrder.paymentMethod,
        pix_copy_paste: newOrder.pixCopyPaste,
        pix_qr_code_base64: newOrder.pixQrCodeBase64,
        created_at: newOrder.createdAt
      }]);

      if (formattedItems.length > 0) {
        await supabase.from('order_items').insert(formattedItems.map(it => ({
          id: it.id,
          order_id: it.orderId,
          product_id: it.productId,
          store_id: it.storeId,
          unit_price: it.unitPrice,
          platform_fee_amount: it.platformFeeAmount,
          creator_net_amount: it.creatorNetAmount,
          created_at: now
        })));
      }
    } catch (err) {
      console.error('[createOrderRecord] Erro Supabase:', err);
    }
  }

  // Persistir em LocalStorage
  const localAsaas = getLocalAsaasOrders();
  localAsaas.unshift(newOrder);
  saveLocalAsaasOrders(localAsaas);

  // Também sincronizar com a lista geral de vendas do vendedor (RecentOrder)
  const recentOrders = getLocalOrders();
  recentOrders.unshift({
    id: newOrder.id,
    clienteNome: newOrder.buyerName,
    clienteEmail: newOrder.buyerEmail,
    produtoTitulo: data.items[0]?.productTitle || 'Infoproduto Digital',
    tipoProduto: 'pdf',
    valorTotal: newOrder.totalAmount,
    statusPagamento: 'pendente_pix',
    dataCompra: newOrder.createdAt,
    metodoPagamento: data.paymentMethod === 'credit_card' ? 'CREDIT_CARD' : data.paymentMethod === 'boleto' ? 'BOLETO' : 'PIX'
  });
  saveLocalOrders(recentOrders);

  return newOrder;
}

// 3. Buscar Pedido por ID
export async function getOrderRecordById(orderId: string): Promise<OrderRecord | null> {
  if (isRealSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          storeId: data.store_id,
          buyerName: data.buyer_name || 'Comprador',
          buyerEmail: data.buyer_email || '',
          buyerCpf: data.buyer_cpf || '',
          buyerPhone: data.buyer_phone || null,
          totalAmount: Number(data.total_amount || 0),
          platformFeeAmount: Number(data.platform_fee_amount || 0),
          creatorNetAmount: Number(data.creator_net_amount || 0),
          status: data.status as OrderStatusType,
          asaasPaymentId: data.asaas_payment_id || null,
          asaasCustomerId: data.asaas_customer_id || null,
          paymentMethod: (data.payment_method || 'pix') as PaymentMethodType,
          pixCopyPaste: data.pix_copy_paste || null,
          pixQrCodeBase64: data.pix_qr_code_base64 || null,
          items: [],
          createdAt: data.created_at,
          paidAt: data.paid_at || null
        };
      }
    } catch (err) {
      console.error('[getOrderRecordById] Erro Supabase:', err);
    }
  }

  const local = getLocalAsaasOrders();
  return local.find(o => o.id === orderId) || null;
}

// 4. Atualizar Status do Pedido (com Idempotência e Liberação de Acesso Automático)
export async function updateOrderStatus(orderId: string, newStatus: OrderStatusType, asaasPaymentId?: string): Promise<OrderRecord | null> {
  const order = await getOrderRecordById(orderId);
  if (!order) {
    // Tentar localizar por asaas_payment_id
    const localAll = getLocalAsaasOrders();
    const byAsaas = localAll.find(o => o.asaasPaymentId === asaasPaymentId || o.id === orderId);
    if (!byAsaas) return null;
    return updateOrderStatus(byAsaas.id, newStatus);
  }

  // IDEMPOTÊNCIA: Se já estava pago e veio novamente como paid, ignora re-processamento
  if (order.status === 'paid' && newStatus === 'paid') {
    console.log(`[updateOrderStatus] Pedido ${orderId} já está confirmado como PAGO (Evento Idempotente).`);
    return order;
  }

  const nowPaidAt = newStatus === 'paid' ? new Date().toISOString() : order.paidAt;

  // Atualizar Supabase se configurado
  if (isRealSupabaseConfigured()) {
    try {
      await supabase.from('orders').update({
        status: newStatus,
        paid_at: nowPaidAt
      }).eq('id', order.id);
    } catch (err) {
      console.error('[updateOrderStatus] Erro Supabase:', err);
    }
  }

  // Atualizar LocalStorage Asaas Orders
  const localAsaas = getLocalAsaasOrders();
  const idx = localAsaas.findIndex(o => o.id === order.id);
  if (idx !== -1) {
    localAsaas[idx].status = newStatus;
    localAsaas[idx].paidAt = nowPaidAt;
    saveLocalAsaasOrders(localAsaas);
  }

  // Atualizar Lista Geral de Vendas Vendedor (RecentOrder)
  const recentOrders = getLocalOrders();
  const recIdx = recentOrders.findIndex(r => r.id === order.id);
  if (recIdx !== -1) {
    recentOrders[recIdx].statusPagamento = newStatus === 'paid' ? 'pago' : newStatus === 'refunded' ? 'expirado' : 'pendente_pix';
    saveLocalOrders(recentOrders);
  }

  // Se confirmado como PAGO, criar matrícula do aluno para liberar acesso imediato!
  if (newStatus === 'paid') {
    try {
      if (typeof window !== 'undefined') {
        const studentPurchasesKey = 'educalizando_student_purchases_v2';
        const rawPurchases = localStorage.getItem(studentPurchasesKey);
        const purchases = rawPurchases ? JSON.parse(rawPurchases) : [];

        // Adicionar matrícula do aluno se ainda não existir
        const exists = purchases.some((p: any) => p.order_id === order.id);
        if (!exists) {
          purchases.unshift({
            id: `pur_${Date.now()}`,
            order_id: order.id,
            student_id: `stu_${order.buyerEmail}`,
            store_id: order.storeId,
            product_id: order.items[0]?.productId || 'prod_1',
            status: 'liberado',
            valor_pago: order.totalAmount,
            created_at: new Date().toISOString()
          });
          localStorage.setItem(studentPurchasesKey, JSON.stringify(purchases));
        }
      }
    } catch (e) {
      console.error('[updateOrderStatus] Erro ao liberar acesso do comprador:', e);
    }
  }

  return {
    ...order,
    status: newStatus,
    paidAt: nowPaidAt
  };
}
