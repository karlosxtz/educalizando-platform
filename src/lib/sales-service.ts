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

function getPeriodDates(period: PeriodFilter): { startDate: string, endDate: string } {
  const now = new Date();
  const end = new Date(now);
  let start = new Date(now);

  if (period === '7d') {
    start.setDate(now.getDate() - 6);
  } else if (period === '30d') {
    start.setDate(now.getDate() - 29);
  } else if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'year') {
    start = new Date(now.getFullYear(), 0, 1);
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

// 1. Fetch Real Sales Analytics by Period
export async function getSalesDataByPeriod(storeId: string, period: PeriodFilter): Promise<{ chartData: SalesDataPoint[], totalGeneratedCount: number }> {
  let realOrders: RecentOrder[] = [];
  const { startDate, endDate } = getPeriodDates(period);
  let totalGeneratedCount = 0;

  if (isRealSupabaseConfigured()) {
    try {
      const { data, error, count } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('store_id', storeId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true });

      if (!error && data) {
        totalGeneratedCount = count || data.length;
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
    const local = getLocalOrders();
    const filteredLocal = local.filter(o => o.dataCompra >= startDate && o.dataCompra <= endDate);
    realOrders = filteredLocal;
    totalGeneratedCount = filteredLocal.length;
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
    return { chartData: days, totalGeneratedCount };
  }

  if (period === '30d') {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 29); 

    const weeks: SalesDataPoint[] = [
      { date: 'Semana 1', label: 'Sem 1', revenue: 0, salesCount: 0 },
      { date: 'Semana 2', label: 'Sem 2', revenue: 0, salesCount: 0 },
      { date: 'Semana 3', label: 'Sem 3', revenue: 0, salesCount: 0 },
      { date: 'Semana 4', label: 'Sem 4', revenue: 0, salesCount: 0 }
    ];

    paidOrders.forEach(o => {
      const oDate = new Date(o.dataCompra);
      if (oDate >= cutoff) {
        const diffTime = Math.abs(oDate.getTime() - cutoff.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        let weekIndex = Math.floor(diffDays / 7);
        if (weekIndex > 3) weekIndex = 3; 
        
        weeks[weekIndex].revenue += o.valorTotal;
        weeks[weekIndex].salesCount += 1;
      }
    });

    return { chartData: weeks, totalGeneratedCount };
  }

  if (period === 'month') {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthDays: SalesDataPoint[] = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const dStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayOrders = paidOrders.filter(o => o.dataCompra.startsWith(dStr));
      const revenue = dayOrders.reduce((sum, o) => sum + o.valorTotal, 0);

      monthDays.push({
        date: dStr,
        label: `${i}`,
        revenue,
        salesCount: dayOrders.length
      });
    }
    return { chartData: monthDays, totalGeneratedCount };
  }

  // year
  const months: SalesDataPoint[] = [];
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const now = new Date();
  
  for (let i = 0; i < 12; i++) {
    const mStr = `${now.getFullYear()}-${String(i + 1).padStart(2, '0')}`;
    const mOrders = paidOrders.filter(o => o.dataCompra.startsWith(mStr));
    const revenue = mOrders.reduce((sum, o) => sum + o.valorTotal, 0);

    months.push({
      date: mStr,
      label: monthNames[i],
      revenue,
      salesCount: mOrders.length
    });
  }

  return { chartData: months, totalGeneratedCount };
}

// 2. Fetch Top Performing Products Report
export async function getTopProductsReport(storeId: string, products: Product[], period: PeriodFilter = '30d'): Promise<TopProductStat[]> {
  let realOrders: RecentOrder[] = [];
  const { startDate, endDate } = getPeriodDates(period);

  if (isRealSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount, subtotal_amount, valor_total, product_title, produto_titulo, status, created_at')
        .eq('store_id', storeId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        realOrders = data.map(o => {
          const isPaid = o.status === 'paid' || o.status === 'PAID' || o.status === 'pago';
          return {
            id: o.id,
            clienteNome: '',
            clienteEmail: '',
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
    const local = getLocalOrders();
    const filteredLocal = local.filter(o => o.dataCompra >= startDate && o.dataCompra <= endDate);
    realOrders = filteredLocal.filter(o => o.statusPagamento === 'pago');
  } else {
    realOrders = realOrders.filter(o => o.statusPagamento === 'pago');
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
  return getLocalOrders().slice(0, 10);
}
