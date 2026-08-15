'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingCart, Search, Filter, Download, ArrowRight, Eye, 
  DollarSign, TrendingUp, Calendar, Clock, CreditCard, ChevronDown, Check, X
} from 'lucide-react';
import { getCurrentCreatorStore } from '@/lib/store-service';
import { getCreatorOrders, DashboardOrder, DashboardOrderItem } from '@/lib/dashboard-order-service';
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

// Order Details Modal Component
function OrderDetailsModal({ order, onClose }: { order: DashboardOrder; onClose: () => void }) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col font-sans">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            Detalhes do Pedido <span className="text-slate-500 font-medium">#{order.id.slice(-8).toUpperCase()}</span>
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-8">
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
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Status</span>
                  <span className="font-bold text-slate-900 capitalize">
                    {order.status === 'paid' ? 'Pago' : order.status === 'pending' ? 'Pendente' : order.status}
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
                {order.asaas_payment_id && (
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Asaas ID</span>
                    <span className="text-xs font-mono text-slate-500 truncate block" title={order.asaas_payment_id}>
                      {order.asaas_payment_id}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Itens Comprados</h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
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
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Valor Bruto do Pedido</span>
                <span className="font-bold text-slate-900">{formatCurrency(order.total_amount)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Taxa da Plataforma</span>
                <span className="font-bold text-rose-600">-{formatCurrency(order.platform_fee_amount)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Taxa do Processador (Asaas)</span>
                <span className="font-bold text-rose-600">-{formatCurrency(order.asaas_fee_amount)}</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-900">Líquido do Criador</span>
                <span className="text-lg font-black text-emerald-600">{formatCurrency(order.creator_net_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
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
  const [storeId, setStoreId] = useState('');
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'todos' | 'hoje' | '7d' | '30d'>('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pagos' | 'pendentes' | 'cancelados'>('todos');
  const [productFilter, setProductFilter] = useState('todos');

  // Modal
  const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    async function init() {
      const store = await getCurrentCreatorStore();
      if (store?.id) {
        setStoreId(store.id);
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
      setLoading(false);
    }
    init();
  }, []);

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
    return <div className="text-center py-20 text-slate-500 font-medium">Carregando pedidos...</div>;
  }

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between md:items-center gap-4">
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
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center gap-3 text-slate-500 mb-4">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Total de Vendas</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{metrics.totalVendas}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center gap-3 text-slate-500 mb-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Faturamento Total</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{formatCurrency(metrics.faturamentoTotal)}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center gap-3 text-slate-500 mb-4">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Ticket Médio</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{formatCurrency(metrics.ticketMedio)}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
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
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-bold mb-2">
          <Filter className="w-4 h-4" /> Filtros
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou e-mail..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
        <div className="overflow-x-auto">
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
                const isPaid = isValidPaidStatus(order.status);
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
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                        isPaid ? 'bg-emerald-100 text-emerald-700' : 
                        order.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {isPaid ? <Check className="w-3 h-3" /> : order.status === 'pending' ? <Clock className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {isPaid ? 'Pago' : order.status === 'pending' ? 'Pendente' : 'Cancelado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
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
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} até {Math.min(currentPage * itemsPerPage, filteredOrders.length)} de {filteredOrders.length}
            </span>
            <div className="flex gap-1">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-bold disabled:opacity-50"
              >
                Anterior
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-bold disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Overlay */}
      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </div>
  );
}
