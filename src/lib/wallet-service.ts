import { supabase, isRealSupabaseConfigured } from './supabase';
import { getOrderRecordById, OrderRecord } from './order-service';
import { getLocalOrders } from './sales-service';

export type WalletTransactionType = 'SALE' | 'REFUND' | 'ADJUSTMENT' | 'WITHDRAWAL';
export type WalletTransactionStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface WalletTransaction {
  id: string;
  storeId: string;
  creatorId?: string | null;
  orderId?: string | null;
  buyerName?: string | null;
  productTitle?: string | null;
  type: WalletTransactionType;
  status: WalletTransactionStatus;
  grossAmount: number;
  platformFixedFeeAmount: number;
  platformPercentageFeeAmount: number;
  platformFeeAmount: number;
  asaasFeeAmount: number;
  netAmount: number; // Sempre o valor líquido que vai ou sai do saldo do criador
  description: string;
  createdAt: string;
}

export interface CreatorWalletSummary {
  totalVendido: number; // Valor bruto total de vendas pagas
  saldoPendente: number; // Líquido de pedidos aguardando pagamento
  saldoDisponivel: number; // Líquido já liberado (pronto para futuro saque na Fase C)
  totalRecebido: number; // Histórico retirado via saques (R$ 0,00 nesta Fase B)
  taxasEducalizando: number; // R$ 0,99/produto + 5% sobre subtotal
  taxasAsaas: number; // Taxa real cobrada pelo Asaas
  totalTaxas: number; // Soma das duas taxas
}

export interface StatementFilterParams {
  storeId: string;
  period?: 'today' | '7d' | '30d' | 'month' | 'last_month' | 'all';
  status?: 'all' | 'COMPLETED' | 'PENDING' | 'REFUND';
  search?: string;
  page?: number;
  limit?: number;
}

const LOCAL_WALLET_TRANSACTIONS_KEY = 'educalizando_wallet_ledger_v1';

function getLocalWalletTransactions(): WalletTransaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_WALLET_TRANSACTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalWalletTransactions(txs: WalletTransaction[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_WALLET_TRANSACTIONS_KEY, JSON.stringify(txs));
  } catch (e) {
    console.error('Erro ao salvar transações da carteira no localStorage:', e);
  }
}

/**
 * =============================================================================
 * FONTE ÚNICA DA VERDADE DO SALDO DO CRIADOR (SERVER CALCULATED LEDGER)
 * =============================================================================
 */
export async function calculateCreatorWallet(storeId: string): Promise<CreatorWalletSummary> {
  if (!storeId) {
    return {
      totalVendido: 0,
      saldoPendente: 0,
      saldoDisponivel: 0,
      totalRecebido: 0,
      taxasEducalizando: 0,
      taxasAsaas: 0,
      totalTaxas: 0
    };
  }

  let orders: any[] = [];
  let transactions: WalletTransaction[] = [];

  // A. Buscar Pedidos e Transações no Supabase se configurado
  if (isRealSupabaseConfigured()) {
    try {
      const [ordRes, txRes] = await Promise.all([
        supabase.from('orders').select('*').eq('store_id', storeId),
        supabase.from('wallet_transactions').select('*').eq('store_id', storeId)
      ]);

      if (!ordRes.error && ordRes.data) {
        orders = ordRes.data;
      }
      if (!txRes.error && txRes.data) {
        transactions = txRes.data.map((t: any) => ({
          id: t.id,
          storeId: t.store_id,
          creatorId: t.creator_id,
          orderId: t.order_id,
          type: t.type,
          status: t.status,
          grossAmount: Number(t.gross_amount || 0),
          platformFixedFeeAmount: Number(t.platform_fixed_fee_amount || 0),
          platformPercentageFeeAmount: Number(t.platform_percentage_fee_amount || 0),
          platformFeeAmount: Number(t.platform_fee_amount || 0),
          asaasFeeAmount: Number(t.asaas_fee_amount || 0),
          netAmount: Number(t.net_amount || 0),
          description: t.description || '',
          createdAt: t.created_at
        }));
      }
    } catch (err) {
      console.error('[calculateCreatorWallet] Erro no Supabase:', err);
    }
  }

  // Fallback Local se vazio
  if (orders.length === 0) {
    const rawLocalAsaas = typeof window !== 'undefined' ? localStorage.getItem('educalizando_asaas_orders_v2') : null;
    orders = rawLocalAsaas ? JSON.parse(rawLocalAsaas).filter((o: any) => o.storeId === storeId) : [];
  }

  if (transactions.length === 0) {
    transactions = getLocalWalletTransactions().filter(t => t.storeId === storeId);
  }

  // 1. Total Vendido (Bruto de vendas confirmadas)
  const isOrderPaid = (o: any) => {
    const st = (o.status || o.statusPagamento || '').toString().toLowerCase();
    return st === 'paid' || st === 'pago' || st === 'received' || st === 'confirmed';
  };

  const isOrderPending = (o: any) => {
    const st = (o.status || o.statusPagamento || '').toString().toLowerCase();
    return st === 'pending' || st === 'pendente_pix' || st === 'waiting_payment';
  };

  const paidOrders = orders.filter(isOrderPaid);
  const pendingOrders = orders.filter(isOrderPending);

  const totalVendido = paidOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount || o.totalAmount || o.subtotal_amount || o.valorTotal || 0), 0);

  // 2. Cálculo Estrito de Taxas e Saldo Líquido do Criador (Regra Mandatória)
  // Fórmula: R$ 0,99 fixo por produto + 5% sobre subtotal + taxa de processamento do meio de pagamento
  let calculatedTaxasEducalizando = 0;
  let calculatedTaxasPagamento = 0;
  let calculatedSaldoDisponivel = 0;
  let calculatedSaldoPendente = 0;

  paidOrders.forEach((o: any) => {
    const gross = Number(o.total_amount || o.totalAmount || o.subtotal_amount || o.valorTotal || 0);
    const productCount = Array.isArray(o.items) && o.items.length > 0 ? o.items.length : 1;
    
    // Taxa Educalizando: R$ 0,99 por produto + 5% do valor bruto
    const platformFixed = Number((productCount * 0.99).toFixed(2));
    const platformPct = Number((gross * 0.05).toFixed(2));
    const platformFee = Number(o.platform_fee_amount || o.platformFeeAmount || (platformFixed + platformPct));

    // Taxa do Meio de Pagamento (Gateway Asaas)
    let paymentFee = Number(o.asaas_fee_amount || o.asaasFeeAmount || 0);
    if (paymentFee <= 0) {
      const method = (o.payment_method || o.paymentMethod || 'pix').toString().toLowerCase();
      if (method === 'credit_card' || method === 'cartao') {
        paymentFee = Number((0.49 + (gross * 0.0299)).toFixed(2));
      } else if (method === 'boleto') {
        paymentFee = 1.99;
      } else {
        paymentFee = 0.99;
      }
    }

    // Saldo Líquido do Criador (Sempre o Valor Bruto menos as Duas Taxas)
    const net = Number((gross - platformFee - paymentFee).toFixed(2));

    calculatedTaxasEducalizando += platformFee;
    calculatedTaxasPagamento += paymentFee;
    calculatedSaldoDisponivel += Math.max(0, net);
  });

  pendingOrders.forEach((o: any) => {
    const gross = Number(o.total_amount || o.totalAmount || o.subtotal_amount || o.valorTotal || 0);
    const productCount = Array.isArray(o.items) && o.items.length > 0 ? o.items.length : 1;
    const platformFee = Number(o.platform_fee_amount || o.platformFeeAmount || ((productCount * 0.99) + (gross * 0.05)));
    
    let paymentFee = Number(o.asaas_fee_amount || o.asaasFeeAmount || 0);
    if (paymentFee <= 0) {
      const method = (o.payment_method || o.paymentMethod || 'pix').toString().toLowerCase();
      if (method === 'credit_card' || method === 'cartao') paymentFee = Number((0.49 + (gross * 0.0299)).toFixed(2));
      else if (method === 'boleto') paymentFee = 1.99;
      else paymentFee = 0.99;
    }

    const net = Number(Math.max(0, gross - platformFee - paymentFee).toFixed(2));
    calculatedSaldoPendente += net;
  });

  // 3. Se houver transações no ledger imutável, utilizar o saldo consolidado COMPLETED
  if (transactions.length > 0) {
    const ledgerNet = transactions
      .filter(t => t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.netAmount, 0);
    if (ledgerNet > 0) {
      calculatedSaldoDisponivel = ledgerNet;
    }
  }

  const totalTaxas = Number((calculatedTaxasEducalizando + calculatedTaxasPagamento).toFixed(2));

  return {
    totalVendido: Number(totalVendido.toFixed(2)),
    saldoPendente: Number(calculatedSaldoPendente.toFixed(2)),
    saldoDisponivel: Number(Math.max(0, calculatedSaldoDisponivel).toFixed(2)),
    totalRecebido: 0,
    taxasEducalizando: Number(calculatedTaxasEducalizando.toFixed(2)),
    taxasAsaas: Number(calculatedTaxasPagamento.toFixed(2)),
    totalTaxas
  };
}

// 2. Registrar Transação no Ledger Financeiro (Idempotente)
export async function recordWalletTransaction(data: {
  storeId: string;
  orderId?: string;
  buyerName?: string;
  productTitle?: string;
  type: WalletTransactionType;
  grossAmount: number;
  platformFixedFeeAmount: number;
  platformPercentageFeeAmount: number;
  platformFeeAmount: number;
  asaasFeeAmount: number;
  netAmount: number;
  description: string;
}): Promise<WalletTransaction> {

  // A. IDEMPOTÊNCIA: Se for venda ou estorno de um pedido já registrado no ledger, ignora duplicação
  const allLocal = getLocalWalletTransactions();
  if (data.orderId) {
    const existing = allLocal.find(t => t.orderId === data.orderId && t.type === data.type);
    if (existing) {
      console.log(`[recordWalletTransaction] Lançamento ${data.type} para o pedido ${data.orderId} já existe no ledger.`);
      return existing;
    }
  }

  const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newTx: WalletTransaction = {
    id: txId,
    storeId: data.storeId,
    orderId: data.orderId || null,
    buyerName: data.buyerName || null,
    productTitle: data.productTitle || null,
    type: data.type,
    status: 'COMPLETED',
    grossAmount: Number(data.grossAmount.toFixed(2)),
    platformFixedFeeAmount: Number(data.platformFixedFeeAmount.toFixed(2)),
    platformPercentageFeeAmount: Number(data.platformPercentageFeeAmount.toFixed(2)),
    platformFeeAmount: Number(data.platformFeeAmount.toFixed(2)),
    asaasFeeAmount: Number(data.asaasFeeAmount.toFixed(2)),
    netAmount: Number(data.netAmount.toFixed(2)),
    description: data.description,
    createdAt: now
  };

  // Gravar no Supabase se configurado
  if (isRealSupabaseConfigured()) {
    try {
      await supabase.from('wallet_transactions').insert([{
        id: newTx.id,
        store_id: newTx.storeId,
        order_id: newTx.orderId,
        type: newTx.type,
        status: newTx.status,
        gross_amount: newTx.grossAmount,
        platform_fixed_fee_amount: newTx.platformFixedFeeAmount,
        platform_percentage_fee_amount: newTx.platformPercentageFeeAmount,
        platform_fee_amount: newTx.platformFeeAmount,
        asaas_fee_amount: newTx.asaasFeeAmount,
        net_amount: newTx.netAmount,
        description: newTx.description,
        created_at: newTx.createdAt
      }]);
    } catch (err) {
      console.error('[recordWalletTransaction] Erro Supabase:', err);
    }
  }

  allLocal.unshift(newTx);
  saveLocalWalletTransactions(allLocal);

  return newTx;
}

// 3. Obter Extrato Financeiro Paginado com Filtros e Pesquisa
export async function getWalletTransactionsStatement(params: StatementFilterParams) {
  const { storeId, period = 'all', status = 'all', search = '', page = 1, limit = 20 } = params;

  let allTx = getLocalWalletTransactions().filter(t => t.storeId === storeId);

  // Se o ledger local estiver vazio, construir lançamentos a partir dos pedidos
  if (allTx.length === 0) {
    const rawLocalAsaas = typeof window !== 'undefined' ? localStorage.getItem('educalizando_asaas_orders_v2') : null;
    const orders = rawLocalAsaas ? JSON.parse(rawLocalAsaas).filter((o: any) => o.storeId === storeId) : [];

    allTx = orders.map((o: any) => ({
      id: `tx_${o.id}`,
      storeId: o.storeId,
      orderId: o.id,
      buyerName: o.buyerName,
      productTitle: o.items?.[0]?.productTitle || 'Infoproduto',
      type: o.status === 'refunded' ? 'REFUND' : 'SALE',
      status: o.status === 'paid' ? 'COMPLETED' : o.status === 'pending' ? 'PENDING' : 'CANCELLED',
      grossAmount: Number(o.totalAmount || 0),
      platformFixedFeeAmount: Number(o.platformFixedFeeAmount || 0),
      platformPercentageFeeAmount: Number(o.platformPercentageFeeAmount || 0),
      platformFeeAmount: Number(o.platformFeeAmount || 0),
      asaasFeeAmount: Number(o.asaasFeeAmount || 0),
      netAmount: o.status === 'refunded' ? -Number(o.creatorNetAmount || 0) : Number(o.creatorNetAmount || 0),
      description: o.status === 'paid' ? 'Venda realizada via Asaas' : o.status === 'refunded' ? 'Estorno / Reembolso efetuado' : 'Aguardando confirmação de pagamento',
      createdAt: o.createdAt
    }));
  }

  // Aplicar Filtro de Período
  const now = new Date();
  let filtered = allTx.filter(t => {
    const txDate = new Date(t.createdAt);

    if (period === 'today') {
      return txDate.toDateString() === now.toDateString();
    }
    if (period === '7d') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return txDate >= sevenDaysAgo;
    }
    if (period === '30d') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return txDate >= thirtyDaysAgo;
    }
    if (period === 'month') {
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    }
    if (period === 'last_month') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return txDate.getMonth() === lastMonth.getMonth() && txDate.getFullYear() === lastMonth.getFullYear();
    }
    return true;
  });

  // Aplicar Filtro de Status
  if (status !== 'all') {
    if (status === 'REFUND') {
      filtered = filtered.filter(t => t.type === 'REFUND');
    } else {
      filtered = filtered.filter(t => t.status === status && t.type !== 'REFUND');
    }
  }

  // Aplicar Pesquisa por Nome do Produto, ID do Pedido ou Comprador
  if (search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(t => 
      (t.orderId && t.orderId.toLowerCase().includes(q)) ||
      (t.productTitle && t.productTitle.toLowerCase().includes(q)) ||
      (t.buyerName && t.buyerName.toLowerCase().includes(q)) ||
      t.description.toLowerCase().includes(q)
    );
  }

  // Ordenação Por Data Decrescente
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Paginação
  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  return {
    transactions: paginated,
    totalCount,
    page,
    totalPages
  };
}
