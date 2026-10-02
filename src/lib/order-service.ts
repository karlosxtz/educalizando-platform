import { calculatePlatformFee } from './payment-fees';
import { getLocalOrders,saveLocalOrders } from './sales-service';
import { isRealSupabaseConfigured } from './supabase';

export type PaymentMethodType = 'pix' | 'credit_card' | 'debit_card' | 'boleto';
export type OrderStatusType = 'pending' | 'paid' | 'failed' | 'refunded';

export class OrderAlreadyExistsError extends Error {
  constructor() {
    super('Já existe um pedido para esta tentativa de checkout.');
    this.name = 'OrderAlreadyExistsError';
  }
}

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
  studentId?: string | null;
  storeId: string;
  creatorId?: string | null; // ID do criador (auth.users) para notificações e ledger
  buyerName: string;
  buyerEmail: string;
  buyerCpf: string;
  buyerPhone?: string | null;
  subtotalAmount: number;
  totalAmount: number;
  platformFixedFeeAmount: number; // 0 — sem tarifa fixa
  platformPercentageFeeAmount: number; // Taxa Educalizando de 13%
  platformFeeAmount: number; // Fixa + Percentual
  asaasFeeAmount: number; // Taxa real cobrada pelo Asaas (repassada ao criador)
  creatorNetAmount: number; // Valor líquido que vai para o saldo do criador
  status: OrderStatusType;
  paymentProvider?: 'asaas' | 'infinitepay';
  checkoutUrl?: string | null;
  infinitePayTransactionNsu?: string | null;
  infinitePayInvoiceSlug?: string | null;
  receiptUrl?: string | null;
  asaasPaymentId?: string | null;
  asaasCustomerId?: string | null;
  paymentMethod: PaymentMethodType;
  pixCopyPaste?: string | null;
  pixQrCodeBase64?: string | null;
  items: OrderItemRecord[];
  is_plr_purchase?: boolean;
  affiliateId?: string | null;
  affiliateCommissionAmount?: number | null;
  creatorReferralId?: string | null;
  creatorReferralCommissionAmount?: number | null;
  couponId?: string | null;
  createdAt: string;
  paidAt?: string | null;
  statusTransitioned?: boolean;
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
 * platform_fixed_fee = 0
 * platform_percentage_fee = subtotal * percentual do meio de pagamento
 * platform_fee = platform_percentage_fee
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
  asaasFee?: number,
  platformSettings?: { platform_fee_percentage: number, platform_fixed_fee: number },
  affiliateCommissionAmount: number = 0,
  paymentMethod: PaymentMethodType | string = 'pix'
): FinancialCalculationResult {
  const productCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subtotal = items.reduce((sum, item) => sum + Number(item.unitPrice || 0) * (item.quantity || 1), 0);

  // Regra comercial vigente: taxa Educalizando de 13%, sem tarifa fixa.
  // Os campos antigos de configuração são ignorados para impedir divergências
  // entre pedidos quando uma linha legada do banco ainda estiver desatualizada.
  const fixedFee = 0;
  const platformFixedFee = Number((fixedFee * productCount).toFixed(2));
  const platformPercentageFee = calculatePlatformFee(subtotal, paymentMethod);
  const platformFee = Number((platformFixedFee + platformPercentageFee).toFixed(2));

  // O parcelamento é repassado ao comprador pela InfinitePay. Para o criador,
  // o custo do meio de pagamento permanece zerado e só incidem os 13%.
  const realFee = asaasFee !== undefined && asaasFee >= 0 ? asaasFee : estimateAsaasFee('pix', subtotal);
  const creatorNet = Number(Math.max(0, subtotal - platformFee - realFee - affiliateCommissionAmount).toFixed(2));

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
  const fin = calculateOrderFinancials(items);
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

export function getLocalAsaasOrders(): OrderRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_ASAAS_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_e) {
    return [];
  }
}

export function saveLocalAsaasOrders(orders: OrderRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_ASAAS_ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Erro ao salvar pedidos Asaas no localStorage:', e);
  }
}

// 2. Criar Registro do Pedido (Validação Estrita de Loja Única + Cálculo Servidor)
export async function createOrderRecord(data: {
  id?: string;
  studentId: string;
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
  paymentProvider?: 'asaas' | 'infinitepay';
  checkoutUrl?: string;
  isPlrPurchase?: boolean;
  affiliateId?: string;
  affiliateCommissionAmount?: number;
  creatorReferralId?: string;
  creatorReferralCommissionAmount?: number;
  couponId?: string;
  platformSettings?: { platform_fee_percentage: number; platform_fixed_fee: number };
}): Promise<OrderRecord> {

  // REGRA FUNDAMENTAL: Todos os produtos devem pertencer à mesma loja
  const invalidItem = data.items.find(it => it.storeId !== data.storeId);
  if (invalidItem) {
    throw new Error('Todos os produtos do pedido devem pertencer exclusivamente à mesma loja.');
  }

  const subtotal = data.items.reduce((sum, item) => sum + Number(item.unitPrice || 0) * (item.quantity || 1), 0);
  const feeToUse = data.asaasFeeAmount !== undefined && data.asaasFeeAmount >= 0
    ? data.asaasFeeAmount
    : estimateAsaasFee(data.paymentMethod, subtotal);

  const financials = calculateOrderFinancials(data.items, feeToUse, data.platformSettings, data.affiliateCommissionAmount || 0, data.paymentMethod);
  const orderId = data.id || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
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
    studentId: data.studentId,
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
    paymentProvider: data.paymentProvider || 'asaas',
    checkoutUrl: data.checkoutUrl || null,
    asaasPaymentId: data.asaasPaymentId || null,
    asaasCustomerId: data.asaasCustomerId || null,
    paymentMethod: data.paymentMethod,
    pixCopyPaste: data.pixCopyPaste || null,
    pixQrCodeBase64: data.pixQrCodeBase64 || null,
    items: formattedItems,
    is_plr_purchase: data.isPlrPurchase || false,
    affiliateId: data.affiliateId || null,
    affiliateCommissionAmount: data.affiliateCommissionAmount || null,
    creatorReferralId: data.creatorReferralId || null,
    creatorReferralCommissionAmount: data.creatorReferralCommissionAmount || null,
    couponId: data.couponId || null,
    createdAt: now,
    paidAt: null
  };

  // Gravar no Supabase se configurado
  if (isRealSupabaseConfigured()) {
    try {
      const { supabaseAdmin } = await import('./supabase');
      const { error: orderInsertError } = await supabaseAdmin.from('orders').insert([{
        id: newOrder.id,
        store_id: newOrder.storeId,
        buyer_name: newOrder.buyerName,
        buyer_email: newOrder.buyerEmail,
        buyer_cpf: newOrder.buyerCpf,
        buyer_phone: newOrder.buyerPhone,
        student_id: newOrder.studentId,
        subtotal_amount: newOrder.subtotalAmount,
        total_amount: newOrder.totalAmount,
        platform_fixed_fee_amount: newOrder.platformFixedFeeAmount,
        platform_percentage_fee_amount: newOrder.platformPercentageFeeAmount,
        platform_fee_amount: newOrder.platformFeeAmount,
        asaas_fee_amount: newOrder.asaasFeeAmount,
        creator_net_amount: newOrder.creatorNetAmount,
        status: 'pending',
        payment_provider: newOrder.paymentProvider,
        checkout_url: newOrder.checkoutUrl,
        asaas_payment_id: newOrder.asaasPaymentId,
        asaas_customer_id: newOrder.asaasCustomerId,
        payment_method: newOrder.paymentMethod,
        pix_copy_paste: newOrder.pixCopyPaste,
        pix_qr_code_base64: newOrder.pixQrCodeBase64,
        is_plr_purchase: newOrder.is_plr_purchase,
        affiliate_id: newOrder.affiliateId,
        affiliate_commission_amount: newOrder.affiliateCommissionAmount,
        creator_referral_id: newOrder.creatorReferralId,
        creator_referral_commission_amount: newOrder.creatorReferralCommissionAmount || 0,
        coupon_id: newOrder.couponId,
        created_at: newOrder.createdAt
      }]);

      if (orderInsertError) {
        if (orderInsertError.code === '23505') throw new OrderAlreadyExistsError();
        throw orderInsertError;
      }

      if (formattedItems.length > 0) {
        const itemRows = formattedItems.map(it => ({
          id: it.id,
          order_id: it.orderId,
          product_id: it.productId,
          product_title: it.productTitle || null,
          store_id: it.storeId,
          unit_price: it.unitPrice,
          quantity: it.quantity,
          subtotal_amount: it.subtotalAmount,
          created_at: now
        }));
        let { error: itemInsertError } = await supabaseAdmin.from('order_items').insert(itemRows);

        // Mantém o checkout disponível caso o deploy aconteça antes da migration.
        if (itemInsertError && /product_title|column/i.test(itemInsertError.message || '')) {
          const legacyRows = itemRows.map(({ product_title: _productTitle, ...legacyItem }) => legacyItem);
          ({ error: itemInsertError } = await supabaseAdmin.from('order_items').insert(legacyRows));
        }
        if (itemInsertError) throw itemInsertError;
      }
    } catch (err) {
      if (err instanceof OrderAlreadyExistsError) throw err;
      console.error('[createOrderRecord] Erro Supabase:', err);
      throw new Error('Não foi possível registrar o pedido com segurança.');
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
    produtoTitulo: data.items[0]?.productTitle || 'Material digital',
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
      const { supabaseAdmin } = await import('./supabase');
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (!error && data) {
        // Buscar itens do pedido na tabela order_items
        const { data: itemsData } = await supabaseAdmin
          .from('order_items')
          .select('*')
          .eq('order_id', orderId);

        const productIds = [...new Set((itemsData || []).map((item: any) => item.product_id).filter(Boolean))];
        const { data: productsData } = productIds.length
          ? await supabaseAdmin.from('products').select('id, titulo').in('id', productIds)
          : { data: [] };
        const titlesByProductId = new Map((productsData || []).map((product: any) => [String(product.id), product.titulo]));

        const mappedItems: OrderItemRecord[] = (itemsData || []).map((it: any) => ({
          id: it.id,
          orderId: it.order_id,
          productId: it.product_id,
          productTitle: it.product_title || titlesByProductId.get(String(it.product_id)) || 'Material digital',
          storeId: it.store_id,
          unitPrice: Number(it.unit_price || 0),
          quantity: Number(it.quantity || 1),
          subtotalAmount: Number(it.subtotal_amount || 0)
        }));

        return {
          id: data.id,
          studentId: data.student_id || null,
          storeId: data.store_id,
          creatorId: data.creator_id || null,
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
          paymentProvider: data.payment_provider || (data.asaas_payment_id ? 'asaas' : 'infinitepay'),
          checkoutUrl: data.checkout_url || null,
          infinitePayTransactionNsu: data.infinitepay_transaction_nsu || null,
          infinitePayInvoiceSlug: data.infinitepay_invoice_slug || null,
          receiptUrl: data.receipt_url || null,
          asaasPaymentId: data.asaas_payment_id || null,
          asaasCustomerId: data.asaas_customer_id || null,
          paymentMethod: (data.payment_method || 'pix') as PaymentMethodType,
          pixCopyPaste: data.pix_copy_paste || null,
          pixQrCodeBase64: data.pix_qr_code_base64 || null,
          items: mappedItems,
          is_plr_purchase: data.is_plr_purchase === true,
          affiliateId: data.affiliate_id || null,
          affiliateCommissionAmount: Number(data.affiliate_commission_amount || 0),
          creatorReferralId: data.creator_referral_id || null,
          creatorReferralCommissionAmount: Number(data.creator_referral_commission_amount || 0),
          couponId: data.coupon_id || null,
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

export { updateOrderStatus } from './order-status-service';
