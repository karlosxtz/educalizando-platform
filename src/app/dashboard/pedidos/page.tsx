'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShoppingCart, Search, Filter, Download, Eye,
  DollarSign, TrendingUp, Calendar, Clock, Check, X
} from 'lucide-react';
import { getCurrentCreatorStore } from '@/lib/store-service';
import { getCreatorOrders, DashboardOrder } from '@/lib/dashboard-order-service';
import { syncCustomerNamesByEmails } from '@/app/actions/customer-actions';
import CustomSelect from '@/components/ui/CustomSelect';

function isValidPaidStatus(status: string) {
  const s = (status || '').toLowerCase();
  return s === 'paid' || s === 'pago' || s === 'liberado' || s === 'aprovado' || s === 'concluido';
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function formatDate(isoDate: string, includeTime = false) {
  if (!isoDate) return '-';
  const d = new Date(isoDate);
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
  if (includeTime) {
    opts.hour = '2-digit';
    opts.minute = '2-digit';
  }
  return d.toLocaleDateString('pt-BR', opts);
}

function getOrderStatus(status: string) {
  const normalized = (status || '').toLowerCase();
  if (isValidPaidStatus(normalized)) return { label: 'Pago', className: 'bg-emerald-100 text-emerald-800', icon: Check };
  if (normalized === 'pending') return { label: 'Pendente', className: 'bg-amber-100 text-amber-800', icon: Clock };
  if (normalized === 'expired') return { label: 'Expirado', className: 'bg-slate-100 text-slate-700', icon: X };
  if (normalized === 'refunded') return { label: 'Reembolsado', className: 'bg-slate-100 text-slate-700', icon: X };
  if (normalized === 'canceled') return { label: 'Cancelado', className: 'bg-slate-100 text-slate-700', icon: X };
  if (normalized === 'failed') return { label: 'Falhou', className: 'bg-rose-100 text-rose-800', icon: X };
  return { label: status || 'Não informado', className: 'bg-slate-100 text-slate-700', icon: Clock };
}

// Order Details Modal Component
function OrderDetailsModal({ order, onClose }: { order: DashboardOrder; onClose: () => void }) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  if (!order) return null;

  const status = getOrderStatus(order.status);
  const StatusIcon = status.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm" role="presentation">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[calc(100vh-1.5rem)] sm:max-h-[90vh] flex flex-col font-sans" role="dialog" aria-modal="true" aria-labelledby="order-details-title">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50">
          <h3 id="order-details-title" className="min-w-0 text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <span className="truncate">Detalhes do pedido</span>
          </h3>
          <button ref={closeButtonRef} onClick={onClose} aria-label="Fechar detalhes do pedido" className="min-h-11 min-w-11 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 sm:space-y-8">
          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dados do Cliente</h4>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="font-bold text-slate-900">{order.buyer_name}</p>
                <p className="text-sm text-slate-600">{order.buyer_email}</p>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status & Pagamento</h4>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-1 min-[380px]:grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Status</span>
                  <span className={`inline-flex w-fit items-center gap-1 rounded-md px-2 py-1 text-xs font-bold ${status.className}`}>
                    <StatusIcon className="h-3.5 w-3.5" /> {status.label}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Método</span>
                  <span className="font-bold text-slate-900 capitalize">
                    {order.payment_method === 'credit_card' ? 'Cartão' : order.payment_method}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Data</span>
                  <span className="text-sm font-medium text-slate-700">{formatDate(order.created_at, true)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Itens Comprados</h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="divide-y divide-slate-100 sm:hidden">
                {order.items?.map((item, idx) => (
                  <div key={item.id || idx} className="space-y-2 p-4">
                    <p className="font-semibold text-slate-900 break-words">{item.product_title || 'Produto sem título'}</p>
                    <div className="flex items-center justify-between gap-3 text-xs text-slate-600"><span>Quantidade: {item.quantity}</span><strong className="text-slate-900">{formatCurrency(item.total_price)}</strong></div>
                  </div>
                ))}
                {(!order.items || order.items.length === 0) && <p className="px-4 py-6 text-center text-sm text-slate-500">Nenhum item detalhado encontrado.</p>}
              </div>
              <table className="hidden w-full text-left text-sm sm:table">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-bold text-slate-700">Produto</th>
                    <th className="px-4 py-3 font-bold text-slate-700 text-center">Qtd</th>
                    <th className="px-4 py-3 font-bold text-slate-700 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items && order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900">{item.product_title || 'Produto sem título'}</td>
                      <td className="px-4 py-3 text-slate-600 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 font-bold text-slate-900 text-right">{formatCurrency(item.total_price)}</td>
                    </tr>
                  ))}
                  {(!order.items || order.items.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                        Nenhum item detalhado encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financials */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detalhamento Financeiro</h4>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <div className="flex flex-wrap justify-between gap-2 items-center text-sm">
                <span className="text-slate-600">Valor Bruto do Pedido</span>
                <span className="font-bold text-slate-900">{formatCurrency(order.total_amount)}</span>
              </div>
              <div className="flex flex-wrap justify-between gap-2 items-center text-sm">
                <span className="text-slate-600">Taxa da Plataforma</span>
                <span className="font-bold text-rose-600">-{formatCurrency(order.platform_fee_amount)}</span>
              </div>
              <div className="flex flex-wrap justify-between gap-2 items-center text-sm">
                <span className="text-slate-600">Taxa do meio de pagamento</span>
                <span className="font-bold text-rose-600">-{formatCurrency(order.asaas_fee_amount)}</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex flex-wrap justify-between gap-2 items-center">
                <span className="font-bold text-slate-900">Líquido do Criador</span>
                <span className="text-lg font-black text-emerald-600">{formatCurrency(order.creator_net_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button 
            onClick={onClose}
            className="min-h-11 w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}


export default function OrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'todos' | 'hoje' | '7d' | '30d'>('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pagos' | 'pendentes' | 'cancelados'>('todos');
  const [productFilter, setProductFilter] = useState('todos');

  // Modal
  const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(null);
  const detailsTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    async function init() {
      try {
        const store = await getCurrentCreatorStore();
        if (store?.id) {
          const fetchedOrders = await getCreatorOrders(store.id);
        
        // Sincronizar nomes reais
        if (fetchedOrders.length > 0) {
          try {
            const emails = fetchedOrders.map(o => o.buyer_email).filter(Boolean);
            const namesMap = await syncCustomerNamesByEmails(emails);
            fetchedOrders.forEach(o => {
              const e = o.buyer_email?.toLowerCase().trim();
              if (e && namesMap[e]) {
                o.buyer_name = namesMap[e];
              }
            });
          } catch (e) {
            console.error('Erro ao sincronizar nomes:', e);
          }
        }
        
          setOrders(fetchedOrders);
        }
      } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
        setLoadError('Não foi possível carregar seus pedidos agora. Atualize a página e tente novamente.');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const closeOrderDetails = () => {
    setSelectedOrder(null);
    window.requestAnimationFrame(() => detailsTriggerRef.current?.focus());
  };

  // Filter products list
  const uniqueProducts = useMemo(() => {
    const map = new Map<string, string>();
    orders.forEach(o => {
      o.items?.forEach(i => {
        if (i.product_id && i.product_title) {
          map.set(i.product_id, i.product_title);
        }
      });
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [orders]);

  // Derived filtered orders
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return orders.filter(o => {
      // 1. Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = o.buyer_name?.toLowerCase().includes(q);
        const matchesEmail = o.buyer_email?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail) return false;
      }

      // 2. Status
      if (statusFilter === 'pagos' && !isValidPaidStatus(o.status)) return false;
      if (statusFilter === 'pendentes' && o.status !== 'pending') return false;
      if (statusFilter === 'cancelados' && !['expired', 'refunded', 'canceled', 'failed'].includes(o.status)) return false;

      // 3. Period
      const d = new Date(o.created_at);
      if (periodFilter === 'hoje' && d < todayStart) return false;
      if (periodFilter === '7d' && d < sevenDaysAgo) return false;
      if (periodFilter === '30d' && d < thirtyDaysAgo) return false;

      // 4. Product
      if (productFilter !== 'todos') {
        const hasProduct = o.items?.some(i => i.product_id === productFilter);
        if (!hasProduct) return false;
      }

      return true;
    });
  }, [orders, searchQuery, periodFilter, statusFilter, productFilter]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const currentOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Metrics (only paid orders within filtered or all? Typically metrics respect filters or show overall. Let's show overall for the store but filtered by default if filters apply, actually usually top cards show global metrics for the store context. Let's make them global but dependent on period filter).
  const metrics = useMemo(() => {
    const paidOrders = orders.filter(o => isValidPaidStatus(o.status));
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalVendas = paidOrders.length;
    const faturamentoTotal = paidOrders.reduce((acc, o) => acc + o.total_amount, 0);
    const ticketMedio = totalVendas > 0 ? faturamentoTotal / totalVendas : 0;
    const vendas30d = paidOrders.filter(o => new Date(o.created_at) >= thirtyDaysAgo).length;

    return { totalVendas, faturamentoTotal, ticketMedio, vendas30d };
  }, [orders]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) return;

    const headers = ['ID do Pedido', 'Data', 'Status', 'Cliente Nome', 'Cliente Email', 'Método', 'Valor Bruto (R$)', 'Valor Líquido (R$)', 'Itens'];
    const rows = filteredOrders.map(o => {
      const itemsStr = o.items?.map(i => `${i.quantity}x ${i.product_title}`).join(' | ') || '';
      return [
        o.id,
        formatDate(o.created_at, true),
        o.status,
        o.buyer_name,
        o.buyer_email,
        o.payment_method,
        o.total_amount.toFixed(2),
        o.creator_net_amount.toFixed(2),
        itemsStr
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(';');
    });

    const csvContent = [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pedidos_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-slate-500 font-medium" role="status" aria-live="polite"><Clock className="h-8 w-8 animate-pulse text-blue-600" />Carregando pedidos...</div>;
  }

  return (
    <div className="space-y-6 sm:space-y-8 font-sans pb-12">
      {/* Page Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <ShoppingCart className="w-6 h-6 text-blue-600" /> Pedidos & Vendas
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Acompanhe o histórico de vendas e gerencie seus pedidos.
          </p>
        </div>
        <button 
          onClick={handleExportCSV}
          disabled={filteredOrders.length === 0}
          className="min-h-11 w-full md:w-auto bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center gap-3 text-slate-500 mb-4">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Total de Vendas</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{metrics.totalVendas}</p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center gap-3 text-slate-500 mb-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Faturamento Total</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{formatCurrency(metrics.faturamentoTotal)}</p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center gap-3 text-slate-500 mb-4">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Ticket Médio</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{formatCurrency(metrics.ticketMedio)}</p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center gap-3 text-slate-500 mb-4">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Últimos 30 dias</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{metrics.vendas30d} <span className="text-sm font-medium text-slate-500">pedidos</span></p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-bold mb-2">
          <Filter className="w-4 h-4" /> Filtros
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <label className="sr-only" htmlFor="orders-search">Buscar por nome ou e-mail</label><input
              id="orders-search"
              type="text" 
              placeholder="Buscar por nome ou e-mail..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="min-h-11 w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          
          <CustomSelect 
            value={periodFilter} 
            onChange={setPeriodFilter as (value: string) => void} 
            options={[
              { value: 'todos', label: 'Todo o período' },
              { value: 'hoje', label: 'Hoje' },
              { value: '7d', label: 'Últimos 7 dias' },
              { value: '30d', label: 'Últimos 30 dias' },
            ]} 
          />

          <CustomSelect 
            value={statusFilter} 
            onChange={setStatusFilter as (value: string) => void} 
            options={[
              { value: 'todos', label: 'Todos os Status' },
              { value: 'pagos', label: 'Pagos / Aprovados' },
              { value: 'pendentes', label: 'Pendentes' },
              { value: 'cancelados', label: 'Cancelados / Expirados' },
            ]} 
          />

          <CustomSelect 
            value={productFilter} 
            onChange={setProductFilter} 
            options={[
              { value: 'todos', label: 'Todos os Produtos' },
              ...uniqueProducts.map(p => ({ value: p.id, label: p.title }))
            ]} 
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loadError ? (
          <div className="p-6 text-center" role="alert">
            <p className="font-bold text-rose-800">Não foi possível carregar os pedidos.</p>
            <p className="mt-1 text-sm text-rose-700">Atualize a página para tentar novamente.</p>
          </div>
        ) : (
          <>
        <div className="divide-y divide-slate-100 sm:hidden">
          {currentOrders.length > 0 ? currentOrders.map(order => {
            const status = getOrderStatus(order.status);
            const StatusIcon = status.icon;
            const itemsCount = order.items?.length || 0;
            const productDesc = itemsCount === 1 ? order.items[0].product_title || 'Produto sem título' : itemsCount > 1 ? `${itemsCount} itens` : 'Nenhum item';

            return (
              <article key={order.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><p className="font-bold text-slate-900 break-words">{order.buyer_name || 'Cliente'}</p><p className="truncate text-xs text-slate-500">{order.buyer_email}</p></div>
                  <span className={`shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold ${status.className}`}><StatusIcon className="h-3.5 w-3.5" />{status.label}</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Produtos</p><p className="mt-1 break-words text-sm font-semibold text-slate-800">{productDesc}</p></div>
                <div className="grid grid-cols-2 gap-3 text-xs"><div><p className="font-bold uppercase tracking-wide text-slate-400">Data</p><p className="mt-1 font-semibold text-slate-700">{formatDate(order.created_at)}</p></div><div><p className="font-bold uppercase tracking-wide text-slate-400">Total</p><p className="mt-1 text-base font-black text-slate-900">{formatCurrency(order.total_amount)}</p></div></div>
                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3"><span className="min-w-0 truncate text-xs font-medium text-slate-500">{order.payment_method === 'credit_card' ? 'Cartão' : order.payment_method}</span><button onClick={(event) => { detailsTriggerRef.current = event.currentTarget; setSelectedOrder(order); }} className="min-h-11 shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"><Eye className="h-4 w-4" />Detalhes</button></div>
              </article>
            );
          }) : (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center text-slate-400"><ShoppingCart className="mb-3 h-12 w-12 text-slate-200" /><p className="font-medium text-slate-600">Nenhum pedido encontrado.</p><p className="mt-1 text-xs">Tente ajustar seus filtros de busca.</p></div>
          )}
        </div>
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-700">Cliente</th>
                <th className="px-6 py-4 font-bold text-slate-700">Produto(s)</th>
                <th className="px-6 py-4 font-bold text-slate-700">Total</th>
                <th className="px-6 py-4 font-bold text-slate-700">Status</th>
                <th className="px-6 py-4 font-bold text-slate-700">Data</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentOrders.length > 0 ? currentOrders.map(order => {
                const status = getOrderStatus(order.status);
                const StatusIcon = status.icon;
                const itemsCount = order.items?.length || 0;
                let productDesc = 'Nenhum item';
                if (itemsCount === 1) {
                  productDesc = order.items[0].product_title || 'Produto sem título';
                } else if (itemsCount > 1) {
                  productDesc = `${itemsCount} itens`;
                }

                return (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{order.buyer_name}</div>
                      <div className="text-xs text-slate-500">{order.buyer_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md text-xs truncate max-w-[200px] inline-block">
                        {productDesc}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{formatCurrency(order.total_amount)}</div>
                      <div className="text-[10px] uppercase font-bold text-slate-500">
                        {order.payment_method === 'credit_card' ? 'Cartão' : order.payment_method}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${status.className}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={(event) => { detailsTriggerRef.current = event.currentTarget; setSelectedOrder(order); }}
                        className="min-h-11 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                      >
                        <Eye className="w-3.5 h-3.5" /> Detalhes
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <ShoppingCart className="w-12 h-12 mb-3 text-slate-200" />
                      <p className="font-medium text-slate-600">Nenhum pedido encontrado.</p>
                      <p className="text-xs mt-1">Tente ajustar seus filtros de busca.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Info */}
        {totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <span className="text-xs font-medium text-slate-500">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} até {Math.min(currentPage * itemsPerPage, filteredOrders.length)} de {filteredOrders.length}
            </span>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-1">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="min-h-11 px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-bold disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                Anterior
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="min-h-11 px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-bold disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* Modal Overlay */}
      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={closeOrderDetails}
        />
      )}
    </div>
  );
}
