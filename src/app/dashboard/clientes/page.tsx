'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, UserCheck, UserPlus, Search, Eye, Filter, 
  ShoppingBag, DollarSign, Calendar, ArrowRight, ShieldCheck, RefreshCw 
} from 'lucide-react';
import { getCustomersByStoreId, getCustomerSummaryStats, Customer, CustomerSummary } from '@/lib/customer-service';
import { getCurrentCreatorStore } from '@/lib/store-service';
import CustomSelect from '@/components/ui/CustomSelect';

export default function CustomersPage() {
  const [storeId, setStoreId] = useState('');
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [summary, setSummary] = useState<CustomerSummary>({
    totalClientes: 0,
    clientesAtivos: 0,
    novosClientes30d: 0
  });

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativos' | 'inativos' | 'com_compras' | 'sem_compras'>('todos');
  const [periodFilter, setPeriodFilter] = useState<'todos' | '7d' | '30d' | '90d'>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function initStore() {
      const store = await getCurrentCreatorStore();
      if (store?.id) setStoreId(store.id);
    }
    initStore();
  }, []);

  useEffect(() => {
    if (!storeId) return;
    async function loadData() {
      setLoading(true);
      try {
        const [custData, sumData] = await Promise.all([
          getCustomersByStoreId(storeId),
          getCustomerSummaryStats(storeId)
        ]);
        setCustomers(custData);
        setSummary(sumData);
      } catch (err) {
        console.error('Erro ao carregar módulo de clientes:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [storeId]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, periodFilter]);

  // Filter Logic
  const filteredCustomers = customers.filter(cust => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = cust.nome.toLowerCase().includes(q);
      const matchEmail = cust.email.toLowerCase().includes(q);
      const matchPhone = cust.telefone ? cust.telefone.toLowerCase().includes(q) : false;
      if (!matchName && !matchEmail && !matchPhone) return false;
    }

    // 2. Status Filter
    if (statusFilter === 'ativos' && cust.status !== 'ativo') return false;
    if (statusFilter === 'inativos' && cust.status !== 'inativo') return false;
    if (statusFilter === 'com_compras' && cust.totalCompras === 0) return false;
    if (statusFilter === 'sem_compras' && cust.totalCompras > 0) return false;

    // 3. Period Filter (Registration date)
    if (periodFilter !== 'todos') {
      const custDate = new Date(cust.dataCadastro).getTime();
      const now = new Date().getTime();
      const days = periodFilter === '7d' ? 7 : periodFilter === '30d' ? 30 : 90;
      const cutoff = now - days * 24 * 60 * 60 * 1000;
      if (custDate < cutoff) return false;
    }

    return true;
  });

  return (
    <div className="space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-brand-navy/10 text-brand-navy">
              <Users className="w-5 h-5 text-brand-navy" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Clientes</h1>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Gerencie os clientes que compraram em sua loja e acompanhe o histórico de compras.
          </p>
        </div>

        {/* Top Header Summary Badge */}
        <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>{summary.totalClientes} Clientes</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{summary.clientesAtivos} Ativos</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 text-indigo-700">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>+{summary.novosClientes30d} este mês</span>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: Total Clientes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total de Clientes</span>
            <div className="text-2xl font-black text-slate-900">{summary.totalClientes}</div>
            <p className="text-[11px] text-slate-500 font-medium">Base total de compradores</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-brand-navy border border-blue-100 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Clientes Ativos */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Clientes Ativos</span>
            <div className="text-2xl font-black text-emerald-700">{summary.clientesAtivos}</div>
            <p className="text-[11px] text-slate-500 font-medium">Com pedidos pagos/aprovados</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Novos Clientes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Novos (Últimos 30d)</span>
            <div className="text-2xl font-black text-indigo-700">+{summary.novosClientes30d}</div>
            <p className="text-[11px] text-slate-500 font-medium">Primeira compra recente</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
            <UserPlus className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Controls & Search */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, e-mail ou telefone..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all font-medium"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full lg:w-auto overflow-x-auto">
            <button
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === 'todos' ? 'bg-white text-brand-navy shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('ativos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === 'ativos' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ativos
            </button>
            <button
              onClick={() => setStatusFilter('inativos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === 'inativos' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inativos
            </button>
            <button
              onClick={() => setStatusFilter('com_compras')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === 'com_compras' ? 'bg-white text-brand-navy shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Com compras
            </button>
            <button
              onClick={() => setStatusFilter('sem_compras')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === 'sem_compras' ? 'bg-white text-slate-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sem compras
            </button>
          </div>

          {/* Period Filter Dropdown */}
          <div className="w-full lg:w-48">
            <CustomSelect
              options={[
                { value: 'todos', label: 'Período: Todos' },
                { value: '7d', label: 'Últimos 7 dias' },
                { value: '30d', label: 'Últimos 30 dias' },
                { value: '90d', label: 'Últimos 90 dias' }
              ]}
              value={periodFilter}
              onChange={(val) => setPeriodFilter(val as any)}
              size="sm"
            />
          </div>
        </div>

        {/* Results Count Banner */}
        <div className="text-xs text-slate-500 font-medium pt-2 border-t border-slate-100 flex items-center justify-between">
          <span>Exibindo <strong>{filteredCustomers.length}</strong> de <strong>{customers.length}</strong> clientes cadastrados</span>
          {(searchQuery || statusFilter !== 'todos' || periodFilter !== 'todos') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('todos');
                setPeriodFilter('todos');
              }}
              className="text-brand-navy font-bold hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Customer List / Table */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 font-medium">
          Carregando base de clientes...
        </div>
      ) : filteredCustomers.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200 p-12 sm:p-16 text-center space-y-5 shadow-xs">
          <div className="w-16 h-16 bg-blue-50 text-brand-navy rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-xl font-black text-slate-900">
              {customers.length === 0 ? 'Você ainda não possui clientes' : 'Nenhum cliente encontrado'}
            </h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {customers.length === 0
                ? 'Os clientes aparecerão aqui automaticamente assim que realizarem compras em sua loja.'
                : 'Nenhum cliente corresponde aos critérios de busca ou filtros aplicados.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-4 px-6">Cliente</th>
                    <th className="py-4 px-6">E-mail</th>
                    <th className="py-4 px-6">Telefone</th>
                    <th className="py-4 px-6 text-center">Compras</th>
                    <th className="py-4 px-6 text-right">Total Comprado</th>
                    <th className="py-4 px-6">Última Compra</th>
                    <th className="py-4 px-6">Cadastro</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(cust => (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Customer Name & Avatar */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-navy text-white font-extrabold flex items-center justify-center text-xs shadow-2xs">
                            {cust.nome.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-900 text-sm">{cust.nome}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-6 font-mono text-slate-600">{cust.email}</td>

                      {/* Phone */}
                      <td className="py-4 px-6 text-slate-500 font-mono">
                        {cust.telefone || '—'}
                      </td>

                      {/* Purchases Count */}
                      <td className="py-4 px-6 text-center font-bold text-slate-900">
                        {cust.totalCompras}
                      </td>

                      {/* Total Spent */}
                      <td className="py-4 px-6 text-right font-mono font-bold text-emerald-700">
                        R$ {cust.valorTotalGasto.toFixed(2).replace('.', ',')}
                      </td>

                      {/* Last Purchase Date */}
                      <td className="py-4 px-6 text-slate-500">
                        {cust.ultimaCompra ? new Date(cust.ultimaCompra).toLocaleDateString('pt-BR') : '—'}
                      </td>

                      {/* Registration Date */}
                      <td className="py-4 px-6 text-slate-500">
                        {new Date(cust.dataCadastro).toLocaleDateString('pt-BR')}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        {cust.status === 'ativo' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Inativo
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/dashboard/clientes/${cust.id}`}
                          className="p-2 rounded-lg text-brand-navy hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all inline-flex items-center gap-1 text-xs font-bold"
                          title="Visualizar Perfil do Cliente"
                        >
                          <Eye className="w-4 h-4 text-brand-navy" />
                          <span>Detalhes</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden space-y-4">
            {filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(cust => (
              <div key={cust.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-navy text-white font-extrabold flex items-center justify-center text-sm">
                      {cust.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{cust.nome}</h4>
                      <span className="text-xs text-slate-500 font-mono block">{cust.email}</span>
                    </div>
                  </div>
                  {cust.status === 'ativo' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Ativo
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      Inativo
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Comprado:</span>
                    <strong className="text-emerald-700 font-mono text-sm">R$ {cust.valorTotalGasto.toFixed(2).replace('.', ',')}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Última Compra:</span>
                    <span className="text-slate-700 font-medium">
                      {cust.ultimaCompra ? new Date(cust.ultimaCompra).toLocaleDateString('pt-BR') : '—'}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/dashboard/clientes/${cust.id}`}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-brand-navy border border-slate-200 flex items-center justify-center gap-2 transition-all"
                >
                  <Eye className="w-4 h-4 text-brand-navy" />
                  <span>Ver Histórico Completo</span>
                </Link>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {Math.ceil(filteredCustomers.length / itemsPerPage) > 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between text-xs font-bold text-slate-600">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 transition-all"
              >
                ← Anterior
              </button>

              <span>
                Página <strong>{currentPage}</strong> de <strong>{Math.ceil(filteredCustomers.length / itemsPerPage)}</strong>
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, Math.ceil(filteredCustomers.length / itemsPerPage)))}
                disabled={currentPage === Math.ceil(filteredCustomers.length / itemsPerPage)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 transition-all"
              >
                Próxima →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
