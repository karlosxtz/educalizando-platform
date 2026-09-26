import { supabase, isRealSupabaseConfigured } from './supabase';
import { getLocalOrders, saveLocalOrders } from './sales-service';

export type PaymentMethodType = 'pix' | 'credit_card' | 'boleto';
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
  platformPercentageFeeAmount: number; // 13% do subtotal do pedido
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
 * platform_percentage_fee = subtotal * 0.13
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
  affiliateCommissionAmount: number = 0
): FinancialCalculationResult {
  const productCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subtotal = items.reduce((sum, item) => sum + Number(item.unitPrice || 0) * (item.quantity || 1), 0);

  // Regra comercial vigente: 13% da Educalizando, sem tarifa fixa.
  // Os campos antigos de configuração são ignorados para impedir divergências
  // entre pedidos quando uma linha legada do banco ainda estiver desatualizada.
  const fixedFee = 0;
  const percentageFee = 13;

  const platformFixedFee = Number((fixedFee * productCount).toFixed(2));
  const platformPercentageFee = Number(((subtotal * percentageFee) / 100).toFixed(2));
  const platformFee = Number((platformFixedFee + platformPercentageFee).toFixed(2));

  // InfinitePay repassa o custo do checkout ao comprador; o gateway não é
  // descontado do saldo do criador nesta plataforma.
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

  const financials = calculateOrderFinancials(data.items, feeToUse, data.platformSettings, data.affiliateCommissionAmount || 0);
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

// 4. Atualizar Status do Pedido + Registrar Taxa Asaas Real + Idempotência
export async function updateOrderStatus(
  orderId: string, 
  newStatus: OrderStatusType, 
  asaasPaymentId?: string,
  realAsaasFee?: number,
  options: { onlyIfPending?: boolean } = {},
): Promise<OrderRecord | null> {
  let order = await getOrderRecordById(orderId);
  if (!order && asaasPaymentId) {
    const localAll = getLocalAsaasOrders();
    order = localAll.find(o => o.asaasPaymentId === asaasPaymentId || o.id === orderId) || null;
  }

  if (!order) return null;
  if (options.onlyIfPending && order.status !== 'pending') {
    return { ...order, statusTransitioned: false };
  }

  // Uma repetição válida deve conferir novamente os efeitos idempotentes (ledger e acesso).
  // Isso permite reparar automaticamente uma confirmação anterior parcialmente processada.
  let statusTransitioned = order.status !== newStatus;

  const nowPaidAt = newStatus === 'paid' ? new Date().toISOString() : order.paidAt;

  // Se uma taxa Asaas real foi informada pelo webhook, recalcular creator_net_amount
  let updatedAsaasFee = order.asaasFeeAmount;
  let updatedCreatorNet = order.creatorNetAmount;

  if (realAsaasFee !== undefined && realAsaasFee >= 0) {
    updatedAsaasFee = Number(realAsaasFee.toFixed(2));
  }
  
  const affComission = order.affiliateCommissionAmount || 0;
  updatedCreatorNet = Number(Math.max(0, order.subtotalAmount - order.platformFeeAmount - updatedAsaasFee - affComission).toFixed(2));

  // Atualizar Supabase se configurado
  if (isRealSupabaseConfigured()) {
    try {
      const { supabaseAdmin } = await import('./supabase');
      
      // ATUALIZAÇÃO ATÔMICA (Optimistic Locking)
      // Tenta atualizar o status APENAS se ele já não for o novo status.
      const { data: updatedOrder, error } = await supabaseAdmin.from('orders').update({
        status: newStatus,
        paid_at: nowPaidAt,
        asaas_fee_amount: updatedAsaasFee,
        creator_net_amount: updatedCreatorNet
      })
      .eq('id', order.id)
      .eq('status', options.onlyIfPending ? 'pending' : newStatus === 'paid' ? 'pending' : order.status)
      .select()
      .maybeSingle();

      if (error) {
        throw new Error(`Falha ao atualizar o pedido: ${error.message}`);
      }

      // Sem linha alterada, outra confirmação venceu a corrida. Ainda conferimos os efeitos
      // idempotentes abaixo, mas não repetimos os e-mails transacionais.
      if (!updatedOrder) {
        statusTransitioned = false;
        console.log(`[Webhook Seguro] Pedido ${order.id} já estava em ${newStatus}. Conferindo efeitos idempotentes.`);
      }
    } catch (err) {
      console.error('[updateOrderStatus] Erro Exceção Supabase:', err);
      throw err;
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
      if (order.couponId) {
        const { supabaseAdmin } = await import('./supabase');
        const { error: couponError } = await supabaseAdmin.rpc('consume_order_coupon', { p_order_id: order.id });
        if (couponError) throw couponError;
      }

      // 1. Registrar transação SALE no ledger imutável da carteira
      const { recordWalletTransaction } = await import('./wallet-service');
      await recordWalletTransaction({
        storeId: order.storeId,
        orderId: order.id,
        buyerName: order.buyerName,
        productTitle: order.items[0]?.productTitle || 'Material digital',
        type: 'SALE',
        grossAmount: order.totalAmount,
        platformFixedFeeAmount: order.platformFixedFeeAmount,
        platformPercentageFeeAmount: order.platformPercentageFeeAmount,
        platformFeeAmount: order.platformFeeAmount,
        asaasFeeAmount: updatedAsaasFee,
        netAmount: updatedCreatorNet,
        description: `Venda aprovada do Pedido #${order.id.substring(4, 10).toUpperCase()}`
      });

      // A indicação de criador é registrada em tabela própria e na carteira do
      // indicador. A comissão foi reservada no pedido e não reduz a vendedora.
      if (order.creatorReferralId && Number(order.creatorReferralCommissionAmount) > 0 && isRealSupabaseConfigured()) {
        const { createCreatorReferralCommission } = await import('./creator-referral-service');
        const referralCommission = await createCreatorReferralCommission(order);
        if (referralCommission) {
          await recordWalletTransaction({
            storeId: referralCommission.beneficiary_store_id,
            creatorId: referralCommission.beneficiary_creator_id,
            orderId: order.id,
            buyerName: order.buyerName,
            productTitle: order.items[0]?.productTitle || 'Material digital',
            type: 'CREATOR_REFERRAL_COMMISSION',
            grossAmount: Number(referralCommission.commission_amount),
            platformFixedFeeAmount: 0,
            platformPercentageFeeAmount: 0,
            platformFeeAmount: 0,
            asaasFeeAmount: 0,
            netAmount: Number(referralCommission.commission_amount),
            description: `Bônus por indicação de criador - Pedido #${order.id.substring(4, 10).toUpperCase()}`
          });
        }
      }

      // 1B. Registrar transação AFFILIATE_COMMISSION no ledger se houver afiliado
      if (order.affiliateId && affComission > 0) {
        let affiliateUserId = null;
        if (isRealSupabaseConfigured()) {
          const { supabaseAdmin } = await import('./supabase');
          const { data: affData } = await supabaseAdmin
            .from('affiliates')
            .select('user_id')
            .eq('id', order.affiliateId)
            .single();
          if (affData) affiliateUserId = affData.user_id;
        }

        await recordWalletTransaction({
          storeId: order.storeId, // A comissão ainda está vinculada à loja onde a venda ocorreu
          creatorId: affiliateUserId, // Identificador de quem é o dono do dinheiro (o afiliado)
          orderId: order.id,
          buyerName: order.buyerName,
          productTitle: order.items[0]?.productTitle || 'Material digital',
          type: 'AFFILIATE_COMMISSION',
          grossAmount: affComission,
          platformFixedFeeAmount: 0,
          platformPercentageFeeAmount: 0,
          platformFeeAmount: 0,
          asaasFeeAmount: 0,
          netAmount: affComission,
          description: `Comissão de Afiliado - Pedido #${order.id.substring(4, 10).toUpperCase()}`
        });

        // E-mails são disparados somente por quem efetivamente mudou o status.
        if (statusTransitioned) try {
          if (affiliateUserId && isRealSupabaseConfigured()) {
            const { supabaseAdmin } = await import('./supabase');
            const { data: affUser } = await supabaseAdmin.auth.admin.getUserById(affiliateUserId);
            const affEmail = affUser?.user?.email;
            const affName = affUser?.user?.user_metadata?.full_name || 'Afiliado';

            if (affEmail) {
              const { sendSaleNotificationToAffiliate } = await import('./mail-service');
              await sendSaleNotificationToAffiliate({
                affiliateEmail: affEmail,
                affiliateName: affName,
                amount: affComission,
                productTitle: order.items[0]?.productTitle || 'Material digital'
              });
            }
          }
        } catch (mailErr) {
          console.error('[updateOrderStatus] Erro ao disparar e-mail pro afiliado:', mailErr);
        }
      }

      const studentEmail = (order.buyerEmail || '').toLowerCase().trim();

      // 2. Produtos finais pertencem à biblioteca do aluno. PLR é uma licença
      // B2B e é lido exclusivamente em /dashboard/plr/comprados pelo pedido;
      // criar student_product_access para ele misturava as duas áreas.
      if (!order.is_plr_purchase) {
        const { grantStudentProductAccess } = await import('./student-service');
        const accessStudentId = order.studentId || studentEmail;
        if (order.items && order.items.length > 0) {
          for (const item of order.items) {
            await grantStudentProductAccess({
              studentId: accessStudentId,
              productId: item.productId,
              orderId: order.id,
              storeId: order.storeId
            });
          }
        } else {
          // Fallback caso seja pedido sem item específico na lista
          await grantStudentProductAccess({
            studentId: accessStudentId,
            productId: 'prod-combo-1',
            orderId: order.id,
            storeId: order.storeId
          });
        }
      }

      // 📧 Disparar e-mail via Resend para o aluno. A reserva no banco evita
      // duplicidade em webhooks repetidos e mantém falhas disponíveis para retry.
      let deliveryAttemptId: string | null = null;
      try {
        const { claimTransactionalDelivery, completeTransactionalDelivery } = await import('./transactional-delivery-service');
        deliveryAttemptId = await claimTransactionalDelivery(order.id, 'EMAIL', 'MATERIAL_DELIVERY');
        if (!deliveryAttemptId) {
          console.log(`[updateOrderStatus] E-mail de entrega do pedido ${order.id} já está em processamento ou já foi enviado.`);
          return {
            ...order,
            status: newStatus,
            statusTransitioned,
            paidAt: nowPaidAt,
            asaasFeeAmount: updatedAsaasFee,
            creatorNetAmount: updatedCreatorNet
          };
        }

        let creatorWhatsapp: string | null = null;
        if (isRealSupabaseConfigured()) {
          const { supabaseAdmin } = await import('./supabase');
          const { data: storeData } = await supabaseAdmin.from('stores').select('whatsapp').eq('id', order.storeId).maybeSingle();
          if (storeData) creatorWhatsapp = storeData.whatsapp;
        }

        const { sendSaleConfirmationToBuyer } = await import('./mail-service');
        let deliveryByProduct = new Map<string, { arquivo_url: string | null; arquivo_nome: string | null; plr_license_url: string | null }>();
        if (isRealSupabaseConfigured() && order.items.length) {
          const { supabaseAdmin } = await import('./supabase');
          const { data: deliveries } = await supabaseAdmin.from('product_deliveries').select('product_id, arquivo_url, arquivo_nome, plr_license_url').in('product_id', order.items.map(item => item.productId));
          deliveryByProduct = new Map((deliveries || []).map(item => [item.product_id, item]));
        }
        const productTitles = order.items.length > 0 
          ? order.items.map(it => it.productTitle || 'Material digital').join(', ')
          : 'Kit Combo Digital';
          
        const mailResult = await sendSaleConfirmationToBuyer({
          buyerEmail: studentEmail,
          buyerName: order.buyerName,
          orderId: order.id,
          productTitles,
          products: order.items.map(it => {
            const delivery = deliveryByProduct.get(it.productId);
            const fileUrl = order.is_plr_purchase ? delivery?.plr_license_url : delivery?.arquivo_url;
            return { id: it.productId, title: it.productTitle || 'Material digital', fileUrl, fileName: delivery?.arquivo_nome };
          }),
          creatorWhatsapp,
          isPlrPurchase: order.is_plr_purchase === true
        });
        if (!mailResult.sent) throw new Error(mailResult.error || 'A Resend não confirmou o envio.');
        await completeTransactionalDelivery(deliveryAttemptId);
      } catch (mailErr) {
        try {
          const { failTransactionalDelivery } = await import('./transactional-delivery-service');
          if (deliveryAttemptId) await failTransactionalDelivery(deliveryAttemptId, mailErr instanceof Error ? mailErr.message : String(mailErr));
        } catch (trackingErr) {
          console.error('[updateOrderStatus] Erro ao registrar falha de e-mail:', trackingErr);
        }
        console.error('[updateOrderStatus] Erro ao disparar e-mail pro aluno:', mailErr);
      }
    } catch (e) {
      console.error('[updateOrderStatus] Erro ao liberar acesso ou registrar lançamento no ledger:', e);
    }
  } else if (newStatus === 'refunded') {
    // O reembolso encerra o direito de acesso deste pedido, mas não toca em
    // acessos de outra compra válida do mesmo material pelo mesmo usuário.
    try {
      const { revokeStudentProductAccessByOrder } = await import('./student-service');
      await revokeStudentProductAccessByOrder(order.id);
    } catch (accessError) {
      console.error('[updateOrderStatus] Erro ao revogar acesso após estorno:', accessError);
    }
    try {
      // Registrar ajuste negativo de reembolso no ledger da carteira do criador
      const { recordWalletTransaction } = await import('./wallet-service');
      await recordWalletTransaction({
        storeId: order.storeId,
        orderId: order.id,
        buyerName: order.buyerName,
        productTitle: order.items[0]?.productTitle || 'Material digital',
        type: 'REFUND',
        grossAmount: -order.totalAmount,
        platformFixedFeeAmount: -order.platformFixedFeeAmount,
        platformPercentageFeeAmount: -order.platformPercentageFeeAmount,
        platformFeeAmount: -order.platformFeeAmount,
        asaasFeeAmount: -updatedAsaasFee,
        netAmount: -updatedCreatorNet,
        description: `Estorno / Reembolso do Pedido #${order.id.substring(4, 10).toUpperCase()}`
      });

      if (order.creatorReferralId && isRealSupabaseConfigured()) {
        const { reverseCreatorReferralCommission } = await import('./creator-referral-service');
        const referralCommission = await reverseCreatorReferralCommission(order.id);
        if (referralCommission) {
          await recordWalletTransaction({
            storeId: referralCommission.beneficiary_store_id,
            creatorId: referralCommission.beneficiary_creator_id,
            orderId: order.id,
            buyerName: order.buyerName,
            productTitle: order.items[0]?.productTitle || 'Material digital',
            type: 'CREATOR_REFERRAL_COMMISSION_REFUND',
            grossAmount: -Number(referralCommission.commission_amount),
            platformFixedFeeAmount: 0,
            platformPercentageFeeAmount: 0,
            platformFeeAmount: 0,
            asaasFeeAmount: 0,
            netAmount: -Number(referralCommission.commission_amount),
            description: `Estorno de bônus por indicação - Pedido #${order.id.substring(4, 10).toUpperCase()}`
          });
        }
      }

      // 2B. Estornar também a comissão do afiliado se houver
      if (order.affiliateId && affComission > 0) {
        let affiliateUserId = null;
        if (isRealSupabaseConfigured()) {
          const { supabaseAdmin } = await import('./supabase');
          const { data: affData } = await supabaseAdmin
            .from('affiliates')
            .select('user_id')
            .eq('id', order.affiliateId)
            .single();
          if (affData) affiliateUserId = affData.user_id;
        }

        await recordWalletTransaction({
          storeId: order.storeId,
          creatorId: affiliateUserId,
          orderId: order.id,
          buyerName: order.buyerName,
          productTitle: order.items[0]?.productTitle || 'Material digital',
          // Tipo próprio para não colidir com o estorno da carteira da loja
          // no índice idempotente do mesmo pedido.
          type: 'AFFILIATE_COMMISSION_REFUND',
          grossAmount: -affComission,
          platformFixedFeeAmount: 0,
          platformPercentageFeeAmount: 0,
          platformFeeAmount: 0,
          asaasFeeAmount: 0,
          netAmount: -affComission,
          description: `Estorno de Comissão - Pedido #${order.id.substring(4, 10).toUpperCase()}`
        });
      }
    } catch (e) {
      console.error('[updateOrderStatus] Erro ao registrar estorno no ledger:', e);
    }
  }

  return {
    ...order,
    status: newStatus,
    statusTransitioned,
    paidAt: nowPaidAt,
    asaasFeeAmount: updatedAsaasFee,
    creatorNetAmount: updatedCreatorNet
  };
}
