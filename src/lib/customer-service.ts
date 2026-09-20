import { allowsLocalDevelopmentFallback, supabase, isRealSupabaseConfigured } from './supabase';
import { getLocalOrders } from './sales-service';
import { ProductType } from './types';
import { getCustomerAccessLogs } from './content-delivery-service';

/**
 * =============================================================================
 * EDUCALIZING — CRM CUSTOMER SERVICE (MODULE AUDITED & PRODUCTION READY)
 * =============================================================================
 * Regra de Negócio & Status do Cliente:
 * - ATIVO: Cliente que possui pelo menos 1 compra válida/paga/aprovada.
 * - INATIVO: Cliente sem nenhuma compra paga/aprovada (ex: apenas pedidos pendentes, expirados ou cancelados).
 * 
 * Regra de Total de Compras & Faturamento:
 * - Apenas pedidos com status 'pago', 'liberado', 'aprovado' ou 'concluido' são contabilizados
 *   em `totalCompras` e `valorTotalGasto`.
 * - Pedidos pendentes, expirados, cancelados ou estornados são listados no histórico/timeline,
 *   porém NÃO somam no Total Comprado nem no número total de compras válidas.
 * =============================================================================
 */

export interface CustomerOrderItem {
  id: string;
  codigoPedido: string;
  data: string;
  status: 'pago' | 'pendente_pix' | 'expirado' | 'estornado' | 'cancelado';
  valorTotal: number;
  metodoPagamento: string;
  produtosTitulos: string[];
  isPlrPurchase?: boolean;
}

export interface CustomerProductItem {
  id: string;
  produtoId?: string | null;
  titulo: string;
  tipo: ProductType | 'combo';
  preco: number;
  quantidade: number;
  dataCompra: string;
  pedidoId: string;
  capaUrl?: string | null;
  isPlrPurchase?: boolean;
}

export interface CustomerPaymentItem {
  id: string;
  pedidoId: string;
  data: string;
  metodo: string;
  valor: number;
  status: 'pago' | 'pendente_pix' | 'expirado' | 'estornado' | 'cancelado';
  transacaoId?: string;
}

export interface CustomerActivityEvent {
  id: string;
  tipo: 'pedido' | 'pagamento' | 'produto' | 'cancelamento' | 'reembolso';
  descricao: string;
  data: string;
  badgeColor?: string;
}

export interface CustomerAccessLog {
  id: string;
  recurso: string;
  tipo: string;
  data: string;
  ip?: string;
}

export interface Customer {
  id: string;
  storeId: string;
  nome: string;
  email: string;
  telefone: string | null;
  dataCadastro: string;
  status: 'ativo' | 'inativo';
  totalCompras: number; // Apenas compras válidas
  valorTotalGasto: number; // Apenas valor efetivamente pago
  ultimaCompra: string | null; // Data da última compra válida
  pedidos: CustomerOrderItem[];
  produtos: CustomerProductItem[];
  pagamentos: CustomerPaymentItem[];
  linhaDoTempo: CustomerActivityEvent[];
  acessos: CustomerAccessLog[];
}

export interface CustomerSummary {
  totalClientes: number;
  clientesAtivos: number;
  novosClientes30d: number;
}

// Internal raw order shape to aggregate from backend
interface RawOrderRecord {
  id: string;
  store_id: string;
  cliente_nome: string;
  cliente_email: string;
  cliente_telefone?: string | null;
  produto_titulo: string;
  tipo_produto?: ProductType;
  valor_total: number;
  metodo_pagamento?: string;
  status: string;
  created_at: string;
  is_plr_purchase?: boolean;
  items?: Array<{ product_id: string; product_title?: string | null; unit_price?: number | null; quantity?: number | null }>;
}

// Helper to check if an order status is a valid paid purchase
function isValidPaidStatus(status: string): boolean {
  const s = (status || '').toLowerCase();
  return s === 'paid' || s === 'pago' || s === 'liberado' || s === 'aprovado' || s === 'concluido';
}

// 1. Fetch and aggregate all real customers for a given store (Multi-tenant isolated by store_id)
export async function getCustomersByStoreId(storeId: string): Promise<Customer[]> {
  if (!storeId) return [];

  let rawOrders: RawOrderRecord[] = [];

  if (isRealSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const orderIds = data.map((o: any) => o.id);
        const { data: orderItems } = orderIds.length
          ? await supabase.from('order_items').select('order_id, product_id, unit_price, quantity').in('order_id', orderIds)
          : { data: [] as any[] };
        const productIds = [...new Set((orderItems || []).map((item: any) => item.product_id).filter(Boolean))];
        const { data: products } = productIds.length
          ? await supabase.from('products').select('id, titulo').in('id', productIds)
          : { data: [] as any[] };
        const titleByProduct = new Map((products || []).map((product: any) => [product.id, product.titulo]));
        const itemsByOrder = new Map<string, Array<{ product_id: string; product_title?: string | null; unit_price?: number | null; quantity?: number | null }>>();
        for (const item of orderItems || []) {
          const items = itemsByOrder.get(item.order_id) || [];
          items.push({ ...item, product_title: titleByProduct.get(item.product_id) || null });
          itemsByOrder.set(item.order_id, items);
        }
        rawOrders = data.map((o: any) => ({
          id: o.id,
          store_id: o.store_id || storeId,
          cliente_nome: o.cliente_nome || o.buyer_name || 'Cliente',
          cliente_email: o.cliente_email || o.buyer_email || '',
          cliente_telefone: o.cliente_telefone || o.buyer_phone || null,
          produto_titulo: o.produto_titulo || o.product_title || 'Infoproduto Digital',
          tipo_produto: o.tipo_produto || 'pdf',
          valor_total: Number(o.total_amount || o.valor_total || o.amount || 0),
          metodo_pagamento: o.metodo_pagamento || o.payment_method || 'PIX Instantâneo',
          status: o.status === 'paid' || o.status === 'pago' ? 'pago' : o.status === 'expirado' ? 'expirado' : o.status === 'estornado' ? 'estornado' : o.status === 'cancelado' ? 'cancelado' : 'pendente_pix',
          created_at: o.created_at,
          is_plr_purchase: o.is_plr_purchase === true,
          items: itemsByOrder.get(o.id) || []
        }));
      }
    } catch (err) {
      console.error('[getCustomersByStoreId] Erro ao buscar pedidos no Supabase:', err);
    }
  }

  // Um navegador não é fonte de verdade para CRM. O fallback só existe em
  // desenvolvimento quando foi habilitado explicitamente.
  if (rawOrders.length === 0 && allowsLocalDevelopmentFallback()) {
    const localOrders = getLocalOrders();
    rawOrders = localOrders.map(o => ({
      id: o.id,
      store_id: storeId,
      cliente_nome: o.clienteNome || 'Cliente',
      cliente_email: o.clienteEmail || '',
      cliente_telefone: null,
      produto_titulo: o.produtoTitulo || 'Infoproduto Digital',
      tipo_produto: o.tipoProduto || 'pdf',
      valor_total: o.valorTotal || 0,
      metodo_pagamento: 'PIX Instantâneo',
      status: o.statusPagamento || 'pago',
      created_at: o.dataCompra
    }));
  }

  // Group raw orders case-insensitively by buyer email
  const customerMap = new Map<string, Customer>();

  rawOrders.forEach(o => {
    // Normalize email key (case-insensitive & trimmed)
    const emailKey = (o.cliente_email || '').toLowerCase().trim();
    if (!emailKey) return;

    if (!customerMap.has(emailKey)) {
      const custId = `cust_${Buffer.from(emailKey).toString('hex').slice(0, 12)}`;
      customerMap.set(emailKey, {
        id: custId,
        storeId: storeId, // Enforce strict store_id scoping
        nome: o.cliente_nome,
        email: o.cliente_email,
        telefone: o.cliente_telefone || null,
        dataCadastro: o.created_at,
        status: 'inativo', // Default until a valid purchase is confirmed
        totalCompras: 0,
        valorTotalGasto: 0,
        ultimaCompra: null,
        pedidos: [],
        produtos: [],
        pagamentos: [],
        linhaDoTempo: [],
        acessos: []
      });
    }

    const customer = customerMap.get(emailKey)!;

    // Preserve earliest order date as registration/first interaction date
    if (new Date(o.created_at) < new Date(customer.dataCadastro)) {
      customer.dataCadastro = o.created_at;
    }

    const isValidPurchase = isValidPaidStatus(o.status);

    if (isValidPurchase) {
      customer.status = 'ativo';
      customer.totalCompras += 1;
      customer.valorTotalGasto += o.valor_total;

      // Track latest VALID purchase date
      if (!customer.ultimaCompra || new Date(o.created_at) > new Date(customer.ultimaCompra)) {
        customer.ultimaCompra = o.created_at;
      }
    }

    // Order Item
    const orderItem: CustomerOrderItem = {
      id: o.id,
      codigoPedido: `#${o.id.slice(-6).toUpperCase()}`,
      data: o.created_at,
      status: o.status as any,
      valorTotal: o.valor_total,
      metodoPagamento: o.metodo_pagamento || 'PIX Instantâneo',
      produtosTitulos: o.items?.length ? o.items.map(item => item.product_title || o.produto_titulo) : [o.produto_titulo],
      isPlrPurchase: o.is_plr_purchase === true
    };
    customer.pedidos.push(orderItem);

    // Product Item (for paid orders)
    if (isValidPurchase) {
      const purchasedItems = o.items?.length ? o.items : [{ product_id: '', product_title: o.produto_titulo, unit_price: o.valor_total, quantity: 1 }];
      purchasedItems.forEach((item, index) => {
        customer.produtos.push({
          id: item.product_id ? `prod_${o.id}_${item.product_id}` : `prod_${o.id}_${index}`,
          produtoId: item.product_id || null,
          titulo: item.product_title || o.produto_titulo,
          tipo: o.tipo_produto || 'pdf',
          preco: Number(item.unit_price ?? o.valor_total),
          quantidade: Number(item.quantity || 1),
          dataCompra: o.created_at,
          pedidoId: o.id,
          isPlrPurchase: o.is_plr_purchase === true
        });
      });
    }

    // Payment Item
    const paymentItem: CustomerPaymentItem = {
      id: `pay_${o.id}`,
      pedidoId: o.id,
      data: o.created_at,
      metodo: o.metodo_pagamento || 'PIX Instantâneo',
      valor: o.valor_total,
      status: o.status as any,
      transacaoId: `tx_${o.id}`
    };
    customer.pagamentos.push(paymentItem);

    // Timeline Events
    if (isValidPurchase) {
      customer.linhaDoTempo.push({
        id: `event_pay_${o.id}`,
        tipo: 'pagamento',
        descricao: `Pagamento aprovado via ${o.metodo_pagamento || 'PIX'} no valor de R$ ${o.valor_total.toFixed(2).replace('.', ',')}`,
        data: o.created_at,
        badgeColor: 'emerald'
      });
      customer.linhaDoTempo.push({
        id: `event_prod_${o.id}`,
        tipo: 'produto',
        descricao: `Acesso liberado ao produto "${o.produto_titulo}"`,
        data: o.created_at,
        badgeColor: 'blue'
      });
    } else if (o.status === 'estornado') {
      customer.linhaDoTempo.push({
        id: `event_ref_${o.id}`,
        tipo: 'reembolso',
        descricao: `Reembolso processado para o pedido #${o.id.slice(-6).toUpperCase()}`,
        data: o.created_at,
        badgeColor: 'amber'
      });
    } else if (o.status === 'cancelado' || o.status === 'expirado') {
      customer.linhaDoTempo.push({
        id: `event_canc_${o.id}`,
        tipo: 'cancelamento',
        descricao: `Pedido #${o.id.slice(-6).toUpperCase()} ${o.status === 'expirado' ? 'expirado' : 'cancelado'}`,
        data: o.created_at,
        badgeColor: 'amber'
      });
    }

    customer.linhaDoTempo.push({
      id: `event_ord_${o.id}`,
      tipo: 'pedido',
      descricao: `Realizou o pedido #${o.id.slice(-6).toUpperCase()} (${o.produto_titulo})`,
      data: o.created_at,
      badgeColor: 'slate'
    });
  });

  // Sort sub-arrays for each customer
  const customers = Array.from(customerMap.values()).map(cust => {
    cust.linhaDoTempo.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    cust.pedidos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    cust.pagamentos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    return cust;
  });

  // Sort overall customer list by recent purchase date descending
  return customers.sort((a, b) => {
    const timeA = a.ultimaCompra ? new Date(a.ultimaCompra).getTime() : new Date(a.dataCadastro).getTime();
    const timeB = b.ultimaCompra ? new Date(b.ultimaCompra).getTime() : new Date(b.dataCadastro).getTime();
    return timeB - timeA;
  });
}

// 2. Fetch Single Customer Details by Customer ID & Store ID (Strict Tenant Security / IDOR Guard)
export async function getCustomerById(storeId: string, customerId: string): Promise<Customer | null> {
  if (!storeId || !customerId) return null;
  const allCustomers = await getCustomersByStoreId(storeId);
  // Guarantee strict tenant boundary: must match customerId AND storeId
  const found = allCustomers.find(c => c.id === customerId && c.storeId === storeId);
  if (!found) return null;

  try {
    const rawLogs = await getCustomerAccessLogs(storeId, found.email || found.id);
    found.acessos = rawLogs.map(l => ({
      id: l.id,
      recurso: l.contentTitle,
      tipo: l.tipoEvento === 'FILE_DOWNLOAD' ? 'Download' : 'Acesso externo',
      data: l.data
    }));
  } catch (e) {
    // Non-critical
  }

  return found;
}

// 3. Compute Summary Statistics for Store Customers
export async function getCustomerSummaryStats(storeId: string): Promise<CustomerSummary> {
  const customers = await getCustomersByStoreId(storeId);
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const totalClientes = customers.length;
  const clientesAtivos = customers.filter(c => c.status === 'ativo').length;
  const novosClientes30d = customers.filter(c => new Date(c.dataCadastro) >= thirtyDaysAgo).length;

  return {
    totalClientes,
    clientesAtivos,
    novosClientes30d
  };
}
