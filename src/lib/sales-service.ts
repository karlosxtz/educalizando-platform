import { supabase, isRealSupabaseConfigured } from './supabase';
import { PeriodFilter, SalesDataPoint, TopProductStat, RecentOrder, Product } from './types';

// Helper to retrieve real orders from LocalStorage when offline
export function getLocalOrders(): RecentOrder[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('educalizando_orders_v3');
  if (!saved) return [];
  return JSON.parse(saved);
}

export function saveLocalOrders(orders: RecentOrder[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('educalizando_orders_v3', JSON.stringify(orders));
  }
}

// 1. Fetch Real Sales Analytics by Period
export async function getSalesDataByPeriod(storeId: string, period: PeriodFilter): Promise<SalesDataPoint[]> {
  let realOrders: RecentOrder[] = [];

  if (isRealSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        realOrders = data.map(o => {
          const isPaid = o.status === 'paid' || o.status === 'PAID' || o.status === 'pago';
          const isRefunded = o.status === 'refunded' || o.status === 'expirado';
          const statusPagamento: RecentOrder['statusPagamento'] = isPaid ? 'pago' : isRefunded ? 'expirado' : 'pendente_pix';

          return {
            id: o.id,
            clienteNome: o.buyer_name || o.cliente_nome || 'Comprador',
            clienteEmail: o.buyer_email || o.cliente_email || '',
            produtoTitulo: o.product_title || o.produto_titulo || 'Infoproduto Digital',
            tipoProduto: 'pdf',
            valorTotal: Number(o.total_amount || o.subtotal_amount || o.valor_total || 0),
            statusPagamento,
            dataCompra: o.created_at,
            metodoPagamento: 'PIX'
          };
        });
      }
    } catch (err) {
      console.error('[getSalesDataByPeriod] Erro ao buscar pedidos no Supabase:', err);
    }
  }

  // Fallback to local storage real orders if Supabase returned 0
  if (realOrders.length === 0) {
    realOrders = getLocalOrders();
  }

  // Only paid orders generate revenue and sales count
  const paidOrders = realOrders.filter(o => o.statusPagamento === 'pago');

  // Build time series labels based on requested period
  if (period === '7d') {
    const days: SalesDataPoint[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' });
      const formattedLabel = dayName.charAt(0).toUpperCase() + dayName.slice(1, 3);

      const dayOrders = paidOrders.filter(o => o.dataCompra.startsWith(dateStr));
      const revenue = dayOrders.reduce((sum, o) => sum + o.valorTotal, 0);

      days.push({
        date: dateStr,
        label: formattedLabel,
        revenue,
        salesCount: dayOrders.length
      });
    }
    return days;
  }

  if (period === '30d') {
    const weeks: SalesDataPoint[] = [
      { date: 'Semana 1', label: 'Sem 1', revenue: 0, salesCount: 0 },
      { date: 'Semana 2', label: 'Sem 2', revenue: 0, salesCount: 0 },
      { date: 'Semana 3', label: 'Sem 3', revenue: 0, salesCount: 0 },
      { date: 'Semana 4', label: 'Sem 4', revenue: 0, salesCount: 0 }
    ];
    // Distribute paid orders if any exist
    paidOrders.forEach((o, index) => {
      const weekIdx = Math.min(Math.floor(index / 7), 3);
      weeks[weekIdx].revenue += o.valorTotal;
      weeks[weekIdx].salesCount += 1;
    });
    return weeks;
  }

  if (period === 'month') {
    const monthDays: SalesDataPoint[] = [
      { date: 'Dia 01-05', label: '01-05', revenue: 0, salesCount: 0 },
      { date: 'Dia 06-10', label: '06-10', revenue: 0, salesCount: 0 },
      { date: 'Dia 11-15', label: '11-15', revenue: 0, salesCount: 0 },
      { date: 'Dia 16-20', label: '16-20', revenue: 0, salesCount: 0 },
      { date: 'Dia 21-25', label: '21-25', revenue: 0, salesCount: 0 },
      { date: 'Dia 26-31', label: '26-31', revenue: 0, salesCount: 0 }
    ];
    paidOrders.forEach(o => {
      const dayNum = new Date(o.dataCompra).getDate();
      const idx = Math.min(Math.floor((dayNum - 1) / 5), 5);
      monthDays[idx].revenue += o.valorTotal;
      monthDays[idx].salesCount += 1;
    });
    return monthDays;
  }

  // year
  const monthsStr = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const months: SalesDataPoint[] = monthsStr.map(m => ({
    date: m,
    label: m,
    revenue: 0,
    salesCount: 0
  }));

  paidOrders.forEach(o => {
    const monthIdx = new Date(o.dataCompra).getMonth();
    months[monthIdx].revenue += o.valorTotal;
    months[monthIdx].salesCount += 1;
  });

  return months;
}

// 2. Fetch Top Performing Products Report
export async function getTopProductsReport(storeId: string, products: Product[]): Promise<TopProductStat[]> {
  let realOrders: RecentOrder[] = [];

  if (isRealSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        realOrders = data.map(o => {
          const isPaid = o.status === 'paid' || o.status === 'PAID' || o.status === 'pago';
          return {
            id: o.id,
            clienteNome: o.buyer_name || o.cliente_nome || '',
            clienteEmail: o.buyer_email || o.cliente_email || '',
            produtoTitulo: o.product_title || o.produto_titulo || '',
            tipoProduto: 'pdf',
            valorTotal: Number(o.total_amount || o.subtotal_amount || o.valor_total || 0),
            statusPagamento: isPaid ? 'pago' : 'pendente_pix',
            dataCompra: o.created_at,
            metodoPagamento: 'PIX'
          };
        });
      }
    } catch (err) {
      console.error('[getTopProductsReport] Erro:', err);
    }
  }

  if (realOrders.length === 0) {
    realOrders = getLocalOrders().filter(o => o.statusPagamento === 'pago');
  }

  const totalStoreRevenue = realOrders.reduce((acc, o) => acc + o.valorTotal, 0);

  const stats: TopProductStat[] = products.map(p => {
    // Find all real orders for this specific product
    const matchingOrders = realOrders.filter(o => o.produtoTitulo === p.titulo || o.id === p.id);
    const unidadesVendidas = matchingOrders.length;
    const faturamentoTotal = matchingOrders.reduce((sum, o) => sum + o.valorTotal, 0);
    const porcentagem = totalStoreRevenue > 0 ? Math.round((faturamentoTotal / totalStoreRevenue) * 100) : 0;

    return {
      id: p.id,
      titulo: p.titulo,
      tipo: p.tipo,
      preco: p.preco,
      unidadesVendidas,
      faturamentoTotal,
      porcentagem,
      capa_url: p.capa_url
    };
  });

  // Sort by revenue descending
  return stats.sort((a, b) => b.faturamentoTotal - a.faturamentoTotal);
}

// 3. Fetch Real Orders Feed
export async function getRecentOrdersFeed(storeId: string): Promise<RecentOrder[]> {
  if (isRealSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data && data.length > 0) {
        return data.map(o => {
          const isPaid = o.status === 'paid' || o.status === 'PAID' || o.status === 'pago';
          const isRefunded = o.status === 'refunded' || o.status === 'expirado';
          const statusPagamento: RecentOrder['statusPagamento'] = isPaid ? 'pago' : isRefunded ? 'expirado' : 'pendente_pix';

          return {
            id: o.id,
            clienteNome: o.buyer_name || o.cliente_nome || 'Comprador',
            clienteEmail: o.buyer_email || o.cliente_email || '',
            produtoTitulo: o.product_title || o.produto_titulo || 'Infoproduto Digital',
            tipoProduto: 'pdf',
            valorTotal: Number(o.total_amount || o.subtotal_amount || o.valor_total || 0),
            statusPagamento,
            dataCompra: new Date(o.created_at).toLocaleDateString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit'
            }),
            metodoPagamento: 'PIX'
          };
        });
      }
    } catch (err) {
      console.error('[getRecentOrdersFeed] Erro ao buscar no Supabase:', err);
    }
  }

  // Fallback to real local storage orders
  return getLocalOrders();
}
