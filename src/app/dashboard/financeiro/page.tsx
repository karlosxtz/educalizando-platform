'use client';

import { useState, useEffect } from 'react';
import { 
  Wallet, TrendingUp, Clock, CheckCircle2, AlertCircle, DollarSign, 
  ArrowUpRight, ArrowDownLeft, ShieldCheck, Search, Filter, Calendar, 
  ChevronLeft, ChevronRight, Info, HelpCircle, Lock, Sparkles, RefreshCw, X, FileText 
} from 'lucide-react';
import { 
  calculateCreatorWallet, 
  getWalletTransactionsStatement, 
  CreatorWalletSummary, 
  WalletTransaction 
} from '@/lib/wallet-service';
import CustomSelect from '@/components/ui/CustomSelect';

export default function FinancialWalletDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<CreatorWalletSummary>({
    totalVendido: 0,
    saldoPendente: 0,
    saldoDisponivel: 0,
    totalRecebido: 0,
    taxasEducalizando: 0,
    taxasAsaas: 0,
    totalTaxas: 0
  });

  // Statement Filters & Search
  const [periodFilter, setPeriodFilter] = useState<'today' | '7d' | '30d' | 'month' | 'last_month' | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'COMPLETED' | 'PENDING' | 'REFUND'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Statement Data
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  // Sale Details Modal
  const [selectedTx, setSelectedTx] = useState<WalletTransaction | null>(null);

  const storeId = 'store-demo';

  useEffect(() => {
    loadData();
  }, [storeId, periodFilter, statusFilter, searchQuery, page]);

  async function loadData() {
    setLoading(true);
    try {
      const [sumData, stmtData] = await Promise.all([
        calculateCreatorWallet(storeId),
        getWalletTransactionsStatement({
          storeId,
          period: periodFilter,
          status: statusFilter,
          search: searchQuery,
          page,
          limit: 15
        })
      ]);

      setSummary(sumData);
      setTransactions(stmtData.transactions);
      setTotalPages(stmtData.totalPages);
      setTotalCount(stmtData.totalCount);
    } catch (err) {
      console.error('Erro ao carregar carteira financeira:', err);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-8 font-sans pb-12">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-2 rounded-xl bg-brand-navy/10 text-brand-navy">
              <Wallet className="w-5 h-5 text-brand-navy" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Carteira Financeira & Extrato</h1>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Acompanhe suas vendas brutas, taxas descontadas e seu saldo líquido disponível para saque.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all text-xs font-bold flex items-center gap-1.5"
            title="Atualizar Dados"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          {/* Solicitado no item 22: Botão de Saque Desabilitado (Fase C) */}
          <div className="relative group">
            <button
              disabled
              className="px-5 py-3 rounded-2xl bg-slate-200 text-slate-400 font-bold text-xs flex items-center gap-2 cursor-not-allowed border border-slate-300"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Solicitar Saque</span>
              <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-slate-300 text-slate-700 uppercase">
                Em Breve (Fase C)
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Cards de Saldo Principal (Item 7 da Especificação) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Total Vendido (Bruto) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Vendido</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {formatCurrency(summary.totalVendido)}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Valor bruto total de vendas pagas</p>
          </div>
        </div>

        {/* Card 2: Saldo Pendente */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Saldo Pendente</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight">
              {formatCurrency(summary.saldoPendente)}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Aguardando confirmação do pagamento</p>
          </div>
        </div>

        {/* Card 3: Saldo Disponível (DESTACADO VISUALMENTE) */}
        <div className="bg-gradient-to-br from-brand-navy to-slate-900 rounded-3xl p-6 shadow-xl space-y-2 flex flex-col justify-between text-white border border-brand-navy/30 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-brand-teal/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-300 relative z-10">
            <span className="text-xs font-extrabold uppercase tracking-wider text-brand-teal">Saldo Disponível</span>
            <span className="p-2 rounded-xl bg-white/10 text-brand-teal border border-white/10">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="relative z-10">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatCurrency(summary.saldoDisponivel)}
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-1">Líquido liberado para futuro saque</p>
          </div>
        </div>

        {/* Card 4: Total Recebido */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Recebido</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {formatCurrency(summary.totalRecebido)}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Retirado via saques PIX</p>
          </div>
        </div>

      </div>

      {/* Resumo de Taxas Descontadas (Item 8 da Especificação) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Detalhamento de Taxas Descontadas
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Transparência total: taxas da Educalizando e custos operacionais do Asaas separados.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans">
          
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Taxas Educalizando</span>
            <div className="text-lg font-black text-slate-900">{formatCurrency(summary.taxasEducalizando)}</div>
            <span className="text-[10px] text-slate-500 font-medium block">R$ 0,99/produto + 5% sobre o subtotal</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Taxas Asaas</span>
            <div className="text-lg font-black text-slate-900">{formatCurrency(summary.taxasAsaas)}</div>
            <span className="text-[10px] text-slate-500 font-medium block">Taxa real cobrada por transação no gateway</span>
          </div>

          <div className="bg-rose-50/50 border border-rose-200 p-4 rounded-2xl space-y-1">
            <span className="text-[11px] font-bold text-rose-700 uppercase block">Total de Taxas Retidas</span>
            <div className="text-lg font-black text-rose-800">{formatCurrency(summary.totalTaxas)}</div>
            <span className="text-[10px] text-rose-600 font-medium block">Descontado do valor bruto das vendas</span>
          </div>

        </div>
      </div>

      {/* Extrato Financeiro & Lançamentos (Item 9 da Especificação) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="w-full lg:w-auto">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Extrato do Ledger Financeiro</h3>
            <p className="text-xs text-slate-500 font-medium">
              Histórico imutável de lançamentos, vendas, estornos e atualizações de saldo.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Buscar por pedido, produto ou comprador..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all font-medium"
            />
          </div>
        </div>

        {/* Filters Bar (Item 13 da Especificação) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase text-slate-500 block">Período</label>
            <CustomSelect
              options={[
                { value: 'all', label: 'Todo o histórico' },
                { value: 'today', label: 'Hoje' },
                { value: '7d', label: 'Últimos 7 dias' },
                { value: '30d', label: 'Últimos 30 dias' },
                { value: 'month', label: 'Este mês' },
                { value: 'last_month', label: 'Mês anterior' }
              ]}
              value={periodFilter}
              onChange={(val) => { setPeriodFilter(val as any); setPage(1); }}
              size="sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase text-slate-500 block">Status Financeiro</label>
            <CustomSelect
              options={[
                { value: 'all', label: 'Todos os status' },
                { value: 'COMPLETED', label: 'Disponível (Confirmado)' },
                { value: 'PENDING', label: 'Pendente (Aguardando PIX)' },
                { value: 'REFUND', label: 'Estornado / Reembolsado' }
              ]}
              value={statusFilter}
              onChange={(val) => { setStatusFilter(val as any); setPage(1); }}
              size="sm"
            />
          </div>

          <div className="flex items-end justify-end">
            <span className="text-xs text-slate-500 font-bold">
              {totalCount} {totalCount === 1 ? 'registro encontrado' : 'registros encontrados'}
            </span>
          </div>

        </div>

        {/* Extrato Statement Table */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            Carregando extrato financeiro...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-200">
            <FileText className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900">Nenhum lançamento encontrado</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Nenhuma transação financeira corresponde aos filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Data</th>
                  <th className="py-3.5 px-4">Descrição</th>
                  <th className="py-3.5 px-4">Pedido</th>
                  <th className="py-3.5 px-4 text-right">Valor Bruto</th>
                  <th className="py-3.5 px-4 text-right">Taxa Educalizando</th>
                  <th className="py-3.5 px-4 text-right">Taxa Asaas</th>
                  <th className="py-3.5 px-4 text-right">Valor Líquido</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {transactions.map(tx => {
                  const isRefund = tx.type === 'REFUND';
                  const isPending = tx.status === 'PENDING';

                  return (
                    <tr 
                      key={tx.id} 
                      onClick={() => setSelectedTx(tx)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {/* Data */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      {/* Descrição */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block truncate max-w-xs">{tx.description}</span>
                        {tx.buyerName && <span className="text-[11px] text-slate-400 block">{tx.buyerName}</span>}
                      </td>

                      {/* Pedido */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {tx.orderId ? `#${tx.orderId.substring(4, 10).toUpperCase()}` : '—'}
                      </td>

                      {/* Valor Bruto */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(tx.grossAmount)}
                      </td>

                      {/* Taxa Educalizando */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                        - {formatCurrency(tx.platformFeeAmount)}
                      </td>

                      {/* Taxa Asaas */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                        - {formatCurrency(tx.asaasFeeAmount)}
                      </td>

                      {/* Valor Líquido (Destaque) */}
                      <td className={`py-3.5 px-4 text-right font-mono font-black text-sm ${
                        isRefund ? 'text-rose-600' : isPending ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {isRefund ? '' : '+'}{formatCurrency(tx.netAmount)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {isRefund ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Estornado
                          </span>
                        ) : isPending ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Pendente
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Disponível
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls (Item 14 da Especificação) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
            <span>Página {page} de {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 flex items-center gap-1 font-bold"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 flex items-center gap-1 font-bold"
              >
                Próximo <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Modal Detalhes da Venda (Item 12 da Especificação) */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-navy block">
                  Detalhamento da Venda
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {selectedTx.orderId ? `Pedido #${selectedTx.orderId.substring(4, 10).toUpperCase()}` : 'Lançamento Financeiro'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Produto:</span>
                  <strong className="text-slate-900">{selectedTx.productTitle || 'Infoproduto Digital'}</strong>
                </div>
                {selectedTx.buyerName && (
                  <div className="flex justify-between text-slate-600">
                    <span>Comprador:</span>
                    <strong className="text-slate-900">{selectedTx.buyerName}</strong>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Data da Transação:</span>
                  <strong className="text-slate-900">
                    {new Date(selectedTx.createdAt).toLocaleString('pt-BR')}
                  </strong>
                </div>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-slate-700 font-bold">
                  <span>Valor Bruto da Venda:</span>
                  <span className="font-mono text-sm">{formatCurrency(selectedTx.grossAmount)}</span>
                </div>

                <div className="flex justify-between text-slate-500 pl-3 border-l-2 border-slate-200">
                  <span>Taxa Fixa Educalizando (R$ 0,99/unid):</span>
                  <span className="font-mono">- {formatCurrency(selectedTx.platformFixedFeeAmount)}</span>
                </div>

                <div className="flex justify-between text-slate-500 pl-3 border-l-2 border-slate-200">
                  <span>Taxa 5% Educalizando (Subtotal):</span>
                  <span className="font-mono">- {formatCurrency(selectedTx.platformPercentageFeeAmount)}</span>
                </div>

                <div className="flex justify-between text-slate-700 font-bold pl-3 border-l-2 border-slate-300">
                  <span>Total Taxas Educalizando:</span>
                  <span className="font-mono text-rose-600">- {formatCurrency(selectedTx.platformFeeAmount)}</span>
                </div>

                <div className="flex justify-between text-slate-700 font-bold pl-3 border-l-2 border-slate-300">
                  <span>Taxa Real Asaas:</span>
                  <span className="font-mono text-rose-600">- {formatCurrency(selectedTx.asaasFeeAmount)}</span>
                </div>

                <div className="flex justify-between font-black text-slate-900 text-base pt-3 border-t border-slate-200">
                  <span>Valor Líquido do Criador:</span>
                  <span className="font-mono text-emerald-600">{formatCurrency(selectedTx.netAmount)}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedTx(null)}
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
