'use client';

import { useState, useEffect } from 'react';
import { 
  Wallet, TrendingUp, Clock, CheckCircle2, AlertCircle, DollarSign, 
  ArrowUpRight, ArrowDownLeft, ShieldCheck, Search, Filter, Calendar, 
  ChevronLeft, ChevronRight, Info, HelpCircle, Lock, Sparkles, RefreshCw, X, FileText, Loader2, Key 
} from 'lucide-react';
import { 
  calculateCreatorWallet, 
  getWalletTransactionsStatement, 
  CreatorWalletSummary, 
  WalletTransaction 
} from '@/lib/wallet-service';
import { 
  getActiveCreatorPixKey, 
  getWithdrawalsHistory, 
  MIN_WITHDRAWAL_AMOUNT, 
  CreatorPixKey, 
  WithdrawalRecord 
} from '@/lib/withdrawal-service';
import CustomSelect from '@/components/ui/CustomSelect';
import { getCurrentCreatorStore } from '@/lib/store-service';
import Link from 'next/link';

export default function FinancialWalletDashboardPage() {
  const [storeId, setStoreId] = useState<string>('');
  const [creatorProfileCpf, setCreatorProfileCpf] = useState<string>('');

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

  // PIX Key & Withdrawals State
  const [activePixKey, setActivePixKey] = useState<CreatorPixKey | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);

  // Modals State
  const [selectedTx, setSelectedTx] = useState<WalletTransaction | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRecord | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Withdrawal Form State
  const [withdrawAmountInput, setWithdrawAmountInput] = useState('');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function initCreatorStore() {
      const store = await getCurrentCreatorStore();
      if (store?.id) {
        setStoreId(store.id);
      }
      if (typeof window !== 'undefined') {
        const rawSession = localStorage.getItem('educalizando_creator_session');
        if (rawSession) {
          try {
            const sess = JSON.parse(rawSession);
            if (sess.cpf) setCreatorProfileCpf(sess.cpf);
          } catch (e) {}
        }
      }
    }
    initCreatorStore();
  }, []);

  useEffect(() => {
    if (storeId) {
      loadData();
    }
  }, [storeId, periodFilter, statusFilter, searchQuery, page]);

  async function loadData() {
    setLoading(true);
    try {
      const [sumData, stmtData, pixData, wtdData] = await Promise.all([
        calculateCreatorWallet(storeId),
        getWalletTransactionsStatement({
          storeId,
          period: periodFilter,
          status: statusFilter,
          search: searchQuery,
          page,
          limit: 15
        }),
        getActiveCreatorPixKey(storeId, creatorProfileCpf),
        getWithdrawalsHistory(storeId)
      ]);

      setSummary(sumData);
      setTransactions(stmtData.transactions);
      setTotalPages(stmtData.totalPages);
      setTotalCount(stmtData.totalCount);
      setActivePixKey(pixData);
      setWithdrawals(wtdData);

      // Calcular total recebido real a partir dos saques concluídos
      const totalRec = wtdData
        .filter(w => w.status === 'COMPLETED')
        .reduce((sum, w) => sum + w.amount, 0);
      
      setSummary(prev => ({ ...prev, totalRecebido: Number(totalRec.toFixed(2)) }));

    } catch (err) {
      console.error('Erro ao carregar carteira financeira:', err);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleOpenWithdrawModal = () => {
    setWithdrawError(null);
    setWithdrawSuccess(null);
    setWithdrawAmountInput(summary.saldoDisponivel > 0 ? summary.saldoDisponivel.toFixed(2) : '20.00');
    setShowWithdrawModal(true);
  };

  const handleExecuteWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    setWithdrawSuccess(null);

    const val = Number(withdrawAmountInput.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      setWithdrawError('Por favor, informe um valor válido para o saque.');
      return;
    }

    if (val < MIN_WITHDRAWAL_AMOUNT) {
      setWithdrawError(`O valor mínimo para saque é de ${formatCurrency(MIN_WITHDRAWAL_AMOUNT)}.`);
      return;
    }

    if (val > summary.saldoDisponivel) {
      setWithdrawError(`Saldo disponível insuficiente. Seu saldo atual é ${formatCurrency(summary.saldoDisponivel)}.`);
      return;
    }

    setWithdrawSubmitting(true);

    try {
      const res = await fetch('/api/financeiro/saque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          creatorId: 'user-demo',
          amount: val,
          creatorProfileCpf
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao solicitar saque PIX.');
      }

      setWithdrawSuccess(`Saque de ${formatCurrency(val)} solicitado com sucesso! A transferência PIX foi enviada para o Asaas.`);
      setTimeout(() => {
        setShowWithdrawModal(false);
        loadData();
      }, 2500);

    } catch (err: any) {
      setWithdrawError(err.message || 'Falha ao processar a solicitação de saque.');
    } finally {
      setWithdrawSubmitting(false);
    }
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Carteira Financeira & Saques PIX</h1>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Acompanhe suas vendas brutas, saldo disponível e solicite saques automáticos para sua chave PIX CPF.
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

          {/* Botão Solicitar Saque (Fase C — Ativo!) */}
          <button
            onClick={handleOpenWithdrawModal}
            className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Solicitar Saque PIX</span>
          </button>
        </div>
      </div>

      {/* 4 Cards de Saldo Principal */}
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
            <p className="text-[11px] text-slate-300 font-medium mt-1">Pronto para saque imediato via PIX</p>
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
            <p className="text-[11px] text-slate-500 font-medium mt-1">Já transferido para sua chave PIX</p>
          </div>
        </div>

      </div>

      {/* Banner / Card da Chave PIX Cadastrada */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase text-slate-500">Chave PIX Cadastrada</span>
              {activePixKey ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ✓ Validada
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Pendente
                </span>
              )}
            </div>
            <div className="text-sm font-black text-slate-900 font-mono mt-0.5">
              {activePixKey ? `${activePixKey.pixKeyMasked} (Titular: ${activePixKey.holderName})` : 'Nenhuma chave PIX CPF cadastrada'}
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/conta"
          className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all text-center"
        >
          {activePixKey ? 'Gerenciar Chave PIX' : 'Cadastrar Chave PIX CPF'}
        </Link>
      </div>

      {/* Resumo de Taxas Descontadas */}
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

      {/* Histórico de Saques Realizados (Item 26 & 27 da Especificação) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Histórico de Saques PIX
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Acompanhe as solicitações e o processamento em tempo real via Asaas.
            </p>
          </div>
        </div>

        {withdrawals.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-slate-200">
            Nenhum saque solicitado até o momento.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Solicitado em</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Chave PIX</th>
                  <th className="py-3 px-4">ID Transferência Asaas</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawals.map(wtd => (
                  <tr 
                    key={wtd.id}
                    onClick={() => setSelectedWithdrawal(wtd)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {new Date(wtd.requestedAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {formatCurrency(wtd.amount)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {wtd.pixKeyMasked}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {wtd.asaasTransferId || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {wtd.status === 'COMPLETED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ✓ Concluído
                        </span>
                      ) : wtd.status === 'PROCESSING' || wtd.status === 'PENDING' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Em Processamento
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          Falhou
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Extrato Financeiro & Lançamentos */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="w-full lg:w-auto">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Extrato do Ledger Financeiro</h3>
            <p className="text-xs text-slate-500 font-medium">
              Histórico imutável de lançamentos, vendas, estornos e saques.
            </p>
          </div>

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

        {/* Filters Bar */}
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

        {/* Statement Table */}
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
                  <th className="py-3.5 px-4">Pedido / Ref</th>
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
                  const isWithdrawal = tx.type === 'WITHDRAWAL';
                  const isPending = tx.status === 'PENDING';

                  return (
                    <tr 
                      key={tx.id} 
                      onClick={() => setSelectedTx(tx)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block truncate max-w-xs">{tx.description}</span>
                        {tx.buyerName && <span className="text-[11px] text-slate-400 block">{tx.buyerName}</span>}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {tx.orderId ? `#${tx.orderId.substring(4, 10).toUpperCase()}` : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(tx.grossAmount)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                        {tx.platformFeeAmount > 0 ? `- ${formatCurrency(tx.platformFeeAmount)}` : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                        {tx.asaasFeeAmount > 0 ? `- ${formatCurrency(tx.asaasFeeAmount)}` : '—'}
                      </td>

                      <td className={`py-3.5 px-4 text-right font-mono font-black text-sm ${
                        isRefund || isWithdrawal ? 'text-rose-600' : isPending ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {formatCurrency(tx.netAmount)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isWithdrawal ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Saque PIX
                          </span>
                        ) : isRefund ? (
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

        {/* Pagination Controls */}
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

      {/* MODAL 1: Solicitar Saque PIX (Item 10, 11, 12, 13 & 16) */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block">
                  Saque Automático PIX
                </span>
                <h3 className="text-lg font-black text-slate-900">Solicitar Saque</h3>
              </div>
              <button onClick={() => setShowWithdrawModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {withdrawError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl text-xs flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{withdrawError}</span>
              </div>
            )}

            {withdrawSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{withdrawSuccess}</span>
              </div>
            )}

            <form onSubmit={handleExecuteWithdrawal} className="space-y-4 text-xs font-sans">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Saldo Disponível:</span>
                  <strong className="text-slate-900 font-mono text-sm">{formatCurrency(summary.saldoDisponivel)}</strong>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Chave PIX (CPF):</span>
                  <strong className="text-slate-900 font-mono">
                    {activePixKey ? activePixKey.pixKeyMasked : 'Nenhuma chave cadastrada'}
                  </strong>
                </div>

                {activePixKey && (
                  <div className="flex justify-between text-slate-600">
                    <span>Titular Confirmado:</span>
                    <strong className="text-slate-900">{activePixKey.holderName}</strong>
                  </div>
                )}
              </div>

              {!activePixKey ? (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl space-y-2">
                  <p className="font-bold">Chave PIX não cadastrada!</p>
                  <p className="text-[11px]">Você precisa cadastrar e validar sua chave PIX CPF em Configurações da Conta antes de solicitar um saque.</p>
                  <Link
                    href="/dashboard/conta"
                    className="inline-block mt-2 px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-[11px]"
                  >
                    Cadastrar Chave PIX Agora
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Valor do Saque (R$) *
                    </label>
                    <input
                      type="text"
                      value={withdrawAmountInput}
                      onChange={(e) => setWithdrawAmountInput(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-600 rounded-xl text-slate-900 text-lg font-mono font-bold focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 block font-medium">
                      Valor mínimo: {formatCurrency(MIN_WITHDRAWAL_AMOUNT)}. Sem taxas adicionais de saque.
                    </span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={withdrawSubmitting || summary.saldoDisponivel < MIN_WITHDRAWAL_AMOUNT}
                      className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {withdrawSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Processando Transferência Asaas...</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-4 h-4" />
                          <span>Confirmar Saque PIX Implícito</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Detalhes da Venda no Extrato */}
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
              <button onClick={() => setSelectedTx(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
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
                  <strong className="text-slate-900">{new Date(selectedTx.createdAt).toLocaleString('pt-BR')}</strong>
                </div>
              </div>

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

      {/* MODAL 3: Detalhes do Saque (Item 27 da Especificação) */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block">
                  Detalhes da Transferência PIX
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Saque #{selectedWithdrawal.id.substring(4, 10).toUpperCase()}
                </h3>
              </div>
              <button onClick={() => setSelectedWithdrawal(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Valor do Saque:</span>
                  <strong className="text-slate-900 font-mono text-sm">{formatCurrency(selectedWithdrawal.amount)}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Chave PIX:</span>
                  <strong className="text-slate-900 font-mono">{selectedWithdrawal.pixKeyMasked}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Solicitado em:</span>
                  <strong className="text-slate-900">{new Date(selectedWithdrawal.requestedAt).toLocaleString('pt-BR')}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Status:</span>
                  <strong className="text-emerald-700">{selectedWithdrawal.status}</strong>
                </div>
                {selectedWithdrawal.asaasTransferId && (
                  <div className="flex justify-between text-slate-600">
                    <span>ID Transferência Asaas:</span>
                    <strong className="text-slate-900 font-mono">{selectedWithdrawal.asaasTransferId}</strong>
                  </div>
                )}
                {selectedWithdrawal.failureReason && (
                  <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-[11px] font-medium mt-2">
                    Motivo da falha: {selectedWithdrawal.failureReason}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedWithdrawal(null)}
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
