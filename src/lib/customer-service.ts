import { supabase, isRealSupabaseConfigured } from './supabase';
import { getLocalOrders } from './sales-service';
import { ProductType } from './types';

export interface CustomerOrderItem {
  id: string;
  codigoPedido: string;
  data: string;
  status: 'pago' | 'pendente_pix' | 'expirado' | 'estornado';
  valorTotal: number;
  metodoPagamento: string;
  produtosTitulos: string[];
}

export interface CustomerProductItem {
  id: string;
  titulo: string;
  tipo: ProductType | 'combo';
  preco: number;
  quantidade: number;
  dataCompra: string;
  pedidoId: string;
  capaUrl?: string | null;
}

export interface CustomerPaymentItem {
  id: string;
  pedidoId: string;
  data: string;
  metodo: string;
  valor: number;
  status: 'pago' | 'pendente_pix' | 'expirado' | 'estornado';
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
  totalCompras: number;
  valorTotalGasto: number;
  ultimaCompra: string | null;
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

// Internal raw order shape to aggregate
interface RawOrderRecord {
  id: string;
  store_id: string;
  cliente_nome: string;
  cliente_email: string;
  cliente_telefone?: string | null;
  produto_titulo: string;
  tipo_produto?: ProductType;
  valor_total: number;
  status: string;
  created_at: string;
}

// 1. Fetch and aggregate all real customers for a given store
export async function getCustomersByStoreId(storeId: string): Promise<Customer[]> {
  let rawOrders: RawOrderRecord[] = [];

  if (isRealSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        rawOrders = data.map((o: any) => ({
          id: o.id,
          store_id: o.store_id || storeId,
          cliente_nome: o.cliente_nome || o.buyer_name || 'Cliente',
          cliente_email: o.cliente_email || o.buyer_email || '',
          cliente_telefone: o.cliente_telefone || o.buyer_phone || null,
          produto_titulo: o.produto_titulo || o.product_title || 'Infoproduto Digital',
          tipo_produto: o.tipo_produto || 'pdf',
          valor_total: Number(o.valor_total || o.amount || 0),
          status: o.status === 'pago' ? 'pago' : o.status === 'expirado' ? 'expirado' : o.status === 'estornado' ? 'estornado' : 'pendente_pix',
          created_at: o.created_at
        }));
      }
    } catch (err) {
      console.error('[getCustomersByStoreId] Erro ao buscar pedidos no Supabase:', err);
    }
  }

  // Fallback to local storage real orders if Supabase returned 0 records
  if (rawOrders.length === 0) {
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
      status: o.statusPagamento || 'pago',
      created_at: o.dataCompra
    }));
  }

  // Also query purchases if available for registered students
  let studentPurchasesMap = new Map<string, any>();
  if (isRealSupabaseConfigured()) {
    try {
      const { data: purchases } = await supabase
        .from('purchases')
        .select('*, store:stores(*), product:products(*), kit:kits(*)')
        .eq('store_id', storeId);

      if (purchases && purchases.length > 0) {
        purchases.forEach((p: any) => {
          if (p.student_id) {
            studentPurchasesMap.set(p.student_id, p);
          }
        });
      }
    } catch (e) {
      // Non-critical
    }
  }

  // Group raw orders by buyer email (or student ID)
  const customerMap = new Map<string, Customer>();

  rawOrders.forEach(o => {
    const key = o.cliente_email.toLowerCase().trim() || o.id;

    if (!customerMap.has(key)) {
      const custId = `cust_${Buffer.from(key).toString('hex').slice(0, 12)}`;
      customerMap.set(key, {
        id: custId,
        storeId: o.store_id || storeId,
        nome: o.cliente_nome,
        email: o.cliente_email,
        telefone: o.cliente_telefone || null,
        dataCadastro: o.created_at,
        status: o.status === 'pago' ? 'ativo' : 'inativo',
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

    const customer = customerMap.get(key)!;

    // Update customer registration date (earliest order)
    if (new Date(o.created_at) < new Date(customer.dataCadastro)) {
      customer.dataCadastro = o.created_at;
    }

    // Update latest purchase date
    if (!customer.ultimaCompra || new Date(o.created_at) > new Date(customer.ultimaCompra)) {
      customer.ultimaCompra = o.created_at;
    }

    // Update status if customer has at least 1 paid order
    if (o.status === 'pago') {
      customer.status = 'ativo';
      customer.valorTotalGasto += o.valor_total;
    }

    customer.totalCompras += 1;

    // Build Order Item
    const orderItem: CustomerOrderItem = {
      id: o.id,
      codigoPedido: `#${o.id.slice(-6).toUpperCase()}`,
      data: o.created_at,
      status: o.status as any,
      valorTotal: o.valor_total,
      metodoPagamento: 'PIX',
      produtosTitulos: [o.produto_titulo]
    };
    customer.pedidos.push(orderItem);

    // Build Product Item
    const productItem: CustomerProductItem = {
      id: `prod_${o.id}`,
      titulo: o.produto_titulo,
      tipo: o.tipo_produto || 'pdf',
      preco: o.valor_total,
      quantidade: 1,
      dataCompra: o.created_at,
      pedidoId: o.id
    };
    customer.produtos.push(productItem);

    // Build Payment Item
    const paymentItem: CustomerPaymentItem = {
      id: `pay_${o.id}`,
      pedidoId: o.id,
      data: o.created_at,
      metodo: 'PIX Instantâneo',
      valor: o.valor_total,
      status: o.status as any
    };
    customer.pagamentos.push(paymentItem);

    // Build Timeline Events
    if (o.status === 'pago') {
      customer.linhaDoTempo.push({
        id: `event_pay_${o.id}`,
        tipo: 'pagamento',
        descricao: `Pagamento aprovado via PIX no valor de R$ ${o.valor_total.toFixed(2).replace('.', ',')}`,
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
    }

    customer.linhaDoTempo.push({
      id: `event_ord_${o.id}`,
      tipo: 'pedido',
      descricao: `Realizou o pedido #${o.id.slice(-6).toUpperCase()} (${o.produto_titulo})`,
      data: o.created_at,
      badgeColor: 'slate'
    });
  });

  // Sort timeline events descending by date for each customer
  const customers = Array.from(customerMap.values()).map(cust => {
    cust.linhaDoTempo.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    cust.pedidos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    return cust;
  });

  // Sort customers by recent purchase date descending
  return customers.sort((a, b) => {
    const timeA = a.ultimaCompra ? new Date(a.ultimaCompra).getTime() : 0;
    const timeB = b.ultimaCompra ? new Date(b.ultimaCompra).getTime() : 0;
    return timeB - timeA;
  });
}

// 2. Fetch Single Customer Details by Customer ID & Store ID (Multi-tenant check)
export async function getCustomerById(storeId: string, customerId: string): Promise<Customer | null> {
  const allCustomers = await getCustomersByStoreId(storeId);
  const found = allCustomers.find(c => c.id === customerId && c.storeId === storeId);
  return found || null;
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
