import { supabase, isRealSupabaseConfigured } from './supabase';
import { getLocalOrders, saveLocalOrders } from './sales-service';

export type PaymentMethodType = 'pix' | 'credit_card' | 'boleto';
export type OrderStatusType = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItemRecord {
  id: string;
  orderId: string;
  productId: string;
  productTitle?: string;
  storeId: string;
  unitPrice: number;
  quantity: number;
  subtotalAmount: number;
}

export interface OrderRecord {
  id: string;
  storeId: string;
  buyerName: string;
  buyerEmail: string;
  buyerCpf: string;
  buyerPhone?: string | null;
  subtotalAmount: number;
  totalAmount: number;
  platformFixedFeeAmount: number; // R$ 0,99 x quantidade de produtos
  platformPercentageFeeAmount: number; // 5% do subtotal do pedido
  platformFeeAmount: number; // Fixa + Percentual
  asaasFeeAmount: number; // Taxa real cobrada pelo Asaas (repassada ao criador)
  creatorNetAmount: number; // Valor líquido que vai para o saldo do criador
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

export interface OrderItemInput {
  productId: string;
  productTitle?: string;
  unitPrice: number;
  quantity?: number;
  storeId: string;
}

export interface FinancialCalculationResult {
  subtotalAmount: number;
  totalAmount: number;
  productCount: number;
  platformFixedFeeAmount: number;
  platformPercentageFeeAmount: number;
  platformFeeAmount: number;
  asaasFeeAmount: number;
  creatorNetAmount: number;
  items: Array<{
    productId: string;
    productTitle?: string;
    storeId: string;
    unitPrice: number;
    quantity: number;
    subtotalAmount: number;
  }>;
}

/**
 * =============================================================================
 * FONTE ÚNICA DA VERDADE — CÁLCULO FINANCEIRO DEFINITIVO EDUCALIZANDO
 * =============================================================================
 * Fórmula:
 * subtotal = soma (unit_price * quantity)
 * platform_fixed_fee = productCount * 0.99
 * platform_percentage_fee = subtotal * 0.05
 * platform_fee = platform_fixed_fee + platform_percentage_fee
 * creator_net_amount = subtotal - platform_fee - asaas_fee
 * =============================================================================
 */
export function estimateAsaasFee(paymentMethod: PaymentMethodType | string, amount: number): number {
  const method = (paymentMethod || 'pix').toString().toLowerCase();
  if (method === 'credit_card' || method === 'cartao') {
    // Cartão de Crédito: R$ 0,49 + 2,99%
    return Number((0.49 + (amount * 0.0299)).toFixed(2));
  } else if (method === 'boleto') {
    // Boleto Bancário: R$ 1,99
    return 1.99;
  } else {
    // Pix Asaas: R$ 1,99 por cobrança recebida
    return 1.99;
  }
}

export function calculateOrderFinancials(
  items: OrderItemInput[],
  asaasFee: number = 0,
  platformSettings?: { platform_fee_percentage: number, platform_fixed_fee: number }
): FinancialCalculationResult {
  const productCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subtotal = items.reduce((sum, item) => sum + Number(item.unitPrice || 0) * (item.quantity || 1), 0);

  // Usa configurações dinâmicas do BD, ou os defaults se não informado
  const fixedFee = platformSettings ? Number(platformSettings.platform_fixed_fee) : 0.99;
  const percentageFee = platformSettings ? Number(platformSettings.platform_fee_percentage) : 0;

  const platformFixedFee = Number((productCount * fixedFee).toFixed(2));
  const platformPercentageFee = Number(((subtotal * percentageFee) / 100).toFixed(2));
  const platformFee = Number((platformFixedFee + platformPercentageFee).toFixed(2));

  // Se a taxa Asaas veio 0, calcular estimativa padrão pela forma de pagamento (PIX = R$ 1,99)
  const realFee = asaasFee > 0 ? asaasFee : estimateAsaasFee('pix', subtotal);
  const creatorNet = Number(Math.max(0, subtotal - platformFee - realFee).toFixed(2));

  return {
    subtotalAmount: Number(subtotal.toFixed(2)),
    totalAmount: Number(subtotal.toFixed(2)),
    productCount,
    platformFixedFeeAmount: platformFixedFee,
    platformPercentageFeeAmount: platformPercentageFee,
    platformFeeAmount: platformFee,
    asaasFeeAmount: Number(realFee.toFixed(2)),
    creatorNetAmount: creatorNet,
    items: items.map(it => ({
      productId: it.productId,
      productTitle: it.productTitle,
      storeId: it.storeId,
      unitPrice: Number(it.unitPrice),
      quantity: it.quantity || 1,
      subtotalAmount: Number((Number(it.unitPrice) * (it.quantity || 1)).toFixed(2))
    }))
  };
}

// Legacy alias helper for backwards compatibility
export function calculateOrderFees(items: OrderItemInput[]) {
  const fin = calculateOrderFinancials(items, 0);
  return {
    totalAmount: fin.totalAmount,
    platformFeeAmount: fin.platformFeeAmount,
    creatorNetAmount: fin.creatorNetAmount,
    items: fin.items.map(it => ({
      ...it,
      platformFeeAmount: 0,
      creatorNetAmount: 0
    }))
  };
}

// Key LocalStorage para persistência de pedidos completos do Asaas
const LOCAL_ASAAS_ORDERS_KEY = 'educalizando_asaas_orders_v2';

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

// 2. Criar Registro do Pedido (Validação Estrita de Loja Única + Cálculo Servidor)
export async function createOrderRecord(data: {
  storeId: string;
  buyerName: string;
  buyerEmail: string;
  buyerCpf: string;
  buyerPhone?: string;
  paymentMethod: PaymentMethodType;
  items: OrderItemInput[];
  asaasPaymentId?: string;
  asaasCustomerId?: string;
  asaasFeeAmount?: number;
  pixCopyPaste?: string;
  pixQrCodeBase64?: string;
}): Promise<OrderRecord> {

  // REGRA FUNDAMENTAL: Todos os produtos devem pertencer à mesma loja
  const invalidItem = data.items.find(it => it.storeId !== data.storeId);
  if (invalidItem) {
    throw new Error('Todos os produtos do pedido devem pertencer exclusivamente à mesma loja.');
  }

  const subtotal = data.items.reduce((sum, item) => sum + Number(item.unitPrice || 0) * (item.quantity || 1), 0);
  const feeToUse = data.asaasFeeAmount !== undefined && data.asaasFeeAmount > 0
    ? data.asaasFeeAmount
    : estimateAsaasFee(data.paymentMethod, subtotal);

  const financials = calculateOrderFinancials(data.items, feeToUse);
  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const formattedItems: OrderItemRecord[] = financials.items.map((it, idx) => ({
    id: `item_${orderId}_${idx}`,
    orderId,
    productId: it.productId,
    productTitle: it.productTitle,
    storeId: it.storeId,
    unitPrice: it.unitPrice,
    quantity: it.quantity,
    subtotalAmount: it.subtotalAmount
  }));

  const newOrder: OrderRecord = {
    id: orderId,
    storeId: data.storeId,
    buyerName: data.buyerName,
    buyerEmail: data.buyerEmail.toLowerCase().trim(),
    buyerCpf: data.buyerCpf,
    buyerPhone: data.buyerPhone || null,
    subtotalAmount: financials.subtotalAmount,
    totalAmount: financials.totalAmount,
    platformFixedFeeAmount: financials.platformFixedFeeAmount,
    platformPercentageFeeAmount: financials.platformPercentageFeeAmount,
    platformFeeAmount: financials.platformFeeAmount,
    asaasFeeAmount: financials.asaasFeeAmount,
    creatorNetAmount: financials.creatorNetAmount,
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
        subtotal_amount: newOrder.subtotalAmount,
        total_amount: newOrder.totalAmount,
        platform_fixed_fee_amount: newOrder.platformFixedFeeAmount,
        platform_percentage_fee_amount: newOrder.platformPercentageFeeAmount,
        platform_fee_amount: newOrder.platformFeeAmount,
        asaas_fee_amount: newOrder.asaasFeeAmount,
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
          quantity: it.quantity,
          subtotal_amount: it.subtotalAmount,
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
        // Buscar itens do pedido na tabela order_items
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId);

        const mappedItems: OrderItemRecord[] = (itemsData || []).map((it: any) => ({
          id: it.id,
          orderId: it.order_id,
          productId: it.product_id,
          productTitle: it.product_title || 'Infoproduto Digital',
          storeId: it.store_id,
          unitPrice: Number(it.unit_price || 0),
          quantity: Number(it.quantity || 1),
          subtotalAmount: Number(it.subtotal_amount || 0)
        }));

        return {
          id: data.id,
          storeId: data.store_id,
          buyerName: data.buyer_name || 'Comprador',
          buyerEmail: data.buyer_email || '',
          buyerCpf: data.buyer_cpf || '',
          buyerPhone: data.buyer_phone || null,
          subtotalAmount: Number(data.subtotal_amount || data.total_amount || 0),
          totalAmount: Number(data.total_amount || 0),
          platformFixedFeeAmount: Number(data.platform_fixed_fee_amount || 0),
          platformPercentageFeeAmount: Number(data.platform_percentage_fee_amount || 0),
          platformFeeAmount: Number(data.platform_fee_amount || 0),
          asaasFeeAmount: Number(data.asaas_fee_amount || 0),
          creatorNetAmount: Number(data.creator_net_amount || 0),
          status: data.status as OrderStatusType,
          asaasPaymentId: data.asaas_payment_id || null,
          asaasCustomerId: data.asaas_customer_id || null,
          paymentMethod: (data.payment_method || 'pix') as PaymentMethodType,
          pixCopyPaste: data.pix_copy_paste || null,
          pixQrCodeBase64: data.pix_qr_code_base64 || null,
          items: mappedItems,
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

// 4. Atualizar Status do Pedido + Registrar Taxa Asaas Real + Idempotência
export async function updateOrderStatus(
  orderId: string, 
  newStatus: OrderStatusType, 
  asaasPaymentId?: string,
  realAsaasFee?: number
): Promise<OrderRecord | null> {
  let order = await getOrderRecordById(orderId);
  if (!order && asaasPaymentId) {
    const localAll = getLocalAsaasOrders();
    order = localAll.find(o => o.asaasPaymentId === asaasPaymentId || o.id === orderId) || null;
  }

  if (!order) return null;

  // IDEMPOTÊNCIA: Se já estava pago e veio novamente como paid sem nova taxa Asaas, ignora
  if (order.status === 'paid' && newStatus === 'paid' && (realAsaasFee === undefined || realAsaasFee === order.asaasFeeAmount)) {
    console.log(`[updateOrderStatus] Pedido ${order.id} já está confirmado como PAGO (Evento Idempotente).`);
    return order;
  }

  const nowPaidAt = newStatus === 'paid' ? new Date().toISOString() : order.paidAt;

  // Se uma taxa Asaas real foi informada pelo webhook, recalcular creator_net_amount
  let updatedAsaasFee = order.asaasFeeAmount;
  let updatedCreatorNet = order.creatorNetAmount;

  if (realAsaasFee !== undefined && realAsaasFee >= 0) {
    updatedAsaasFee = Number(realAsaasFee.toFixed(2));
    updatedCreatorNet = Number(Math.max(0, order.subtotalAmount - order.platformFeeAmount - updatedAsaasFee).toFixed(2));
  }

  // Atualizar Supabase se configurado
  if (isRealSupabaseConfigured()) {
    try {
      await supabase.from('orders').update({
        status: newStatus,
        paid_at: nowPaidAt,
        asaas_fee_amount: updatedAsaasFee,
        creator_net_amount: updatedCreatorNet
      }).eq('id', order.id);
    } catch (err) {
      console.error('[updateOrderStatus] Erro Supabase:', err);
    }
  }

  // Atualizar LocalStorage Asaas Orders
  const localAsaas = getLocalAsaasOrders();
  const idx = localAsaas.findIndex(o => o.id === order!.id);
  if (idx !== -1) {
    localAsaas[idx].status = newStatus;
    localAsaas[idx].paidAt = nowPaidAt;
    localAsaas[idx].asaasFeeAmount = updatedAsaasFee;
    localAsaas[idx].creatorNetAmount = updatedCreatorNet;
    saveLocalAsaasOrders(localAsaas);
  }

  // Atualizar Lista Geral de Vendas Vendedor (RecentOrder)
  const recentOrders = getLocalOrders();
  const recIdx = recentOrders.findIndex(r => r.id === order!.id);
  if (recIdx !== -1) {
    recentOrders[recIdx].statusPagamento = newStatus === 'paid' ? 'pago' : newStatus === 'refunded' ? 'expirado' : 'pendente_pix';
    saveLocalOrders(recentOrders);
  }

  // Se confirmado como PAGO, liberar matrícula do aluno e registrar lançamento de venda no ledger da carteira
  if (newStatus === 'paid') {
    try {
      // 1. Registrar transação SALE no ledger imutável da carteira
      const { recordWalletTransaction } = await import('./wallet-service');
      await recordWalletTransaction({
        storeId: order.storeId,
        orderId: order.id,
        buyerName: order.buyerName,
        productTitle: order.items[0]?.productTitle || 'Infoproduto Digital',
        type: 'SALE',
        grossAmount: order.totalAmount,
        platformFixedFeeAmount: order.platformFixedFeeAmount,
        platformPercentageFeeAmount: order.platformPercentageFeeAmount,
        platformFeeAmount: order.platformFeeAmount,
        asaasFeeAmount: updatedAsaasFee,
        netAmount: updatedCreatorNet,
        description: `Venda aprovada do Pedido #${order.id.substring(4, 10).toUpperCase()}`
      });

      // 2. Conceder Acesso Real ao Material (student_product_access) no Supabase e LocalStorage
      const { grantStudentProductAccess } = await import('./student-service');
      const studentEmail = (order.buyerEmail || '').toLowerCase().trim();

      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          await grantStudentProductAccess({
            studentId: studentEmail,
            productId: item.productId,
            orderId: order.id,
            storeId: order.storeId
          });
        }
      } else {
        // Fallback caso seja pedido sem item específico na lista
        await grantStudentProductAccess({
          studentId: studentEmail,
          productId: 'prod-combo-1',
          orderId: order.id,
          storeId: order.storeId
        });
      }
    } catch (e) {
      console.error('[updateOrderStatus] Erro ao liberar acesso ou registrar lançamento no ledger:', e);
    }
  } else if (newStatus === 'refunded') {
    try {
      // Registrar ajuste negativo de reembolso no ledger da carteira
      const { recordWalletTransaction } = await import('./wallet-service');
      await recordWalletTransaction({
        storeId: order.storeId,
        orderId: order.id,
        buyerName: order.buyerName,
        productTitle: order.items[0]?.productTitle || 'Infoproduto Digital',
        type: 'REFUND',
        grossAmount: -order.totalAmount,
        platformFixedFeeAmount: -order.platformFixedFeeAmount,
        platformPercentageFeeAmount: -order.platformPercentageFeeAmount,
        platformFeeAmount: -order.platformFeeAmount,
        asaasFeeAmount: -updatedAsaasFee,
        netAmount: -updatedCreatorNet,
        description: `Estorno / Reembolso do Pedido #${order.id.substring(4, 10).toUpperCase()}`
      });
    } catch (e) {
      console.error('[updateOrderStatus] Erro ao registrar estorno no ledger:', e);
    }
  }

  return {
    ...order,
    status: newStatus,
    paidAt: nowPaidAt,
    asaasFeeAmount: updatedAsaasFee,
    creatorNetAmount: updatedCreatorNet
  };
}
