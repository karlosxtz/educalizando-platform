'use client';

import FinancialDialogs from './FinancialDialogs';
import FinancialOverview from './FinancialOverview';
import { getTransactionPresentation } from './transaction-presentation';

import CustomSelect from '@/components/ui/CustomSelect';
import { getCurrentCreatorStore } from '@/lib/store-service';
import { supabase } from '@/lib/supabase';
import {
CreatorWalletSummary,
WalletTransaction,
calculateCreatorWallet,
getWalletTransactionsStatement
} from '@/lib/wallet-service';
import { MIN_WITHDRAWAL_AMOUNT,type CreatorPixKey,type WithdrawalRecord } from '@/lib/withdrawal-service';
import {
ArrowUpRight,
CheckCircle2,
ChevronLeft,ChevronRight,
Clock,
DollarSign,
FileText,
RefreshCw,
Search,
TrendingUp,
Wallet
} from 'lucide-react';
import { useEffect,useRef,useState } from 'react';

export default function FinancialWalletDashboardPage() {
  const [storeId, setStoreId] = useState<string>('');
  const [creatorProfileCpf, setCreatorProfileCpf] = useState<string>('');
  const [calculatorPrice, setCalculatorPrice] = useState('50');
  const [calculatorInstallments, setCalculatorInstallments] = useState('1');

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

  const [periodFilter, setPeriodFilter] = useState<'today' | '7d' | '30d' | 'month' | 'last_month' | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'COMPLETED' | 'PENDING' | 'REFUND'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  const [activePixKey, setActivePixKey] = useState<CreatorPixKey | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);

  const [selectedTx, setSelectedTx] = useState<WalletTransaction | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRecord | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const withdrawTriggerRef = useRef<HTMLButtonElement | null>(null);
  const transactionTriggerRef = useRef<HTMLButtonElement | null>(null);
  const withdrawalTriggerRef = useRef<HTMLButtonElement | null>(null);

  const [withdrawAmountInput, setWithdrawAmountInput] = useState('');
  const [minimumWithdrawalAmount, setMinimumWithdrawalAmount] = useState(MIN_WITHDRAWAL_AMOUNT);
  const [withdrawalFee, setWithdrawalFee] = useState(0);
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  useEffect(() => {
    fetch('/api/financeiro/withdrawal-settings')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        setMinimumWithdrawalAmount(Number(data.minimumWithdrawalAmount || 0));
        setWithdrawalFee(Math.max(0, Number(data.withdrawalFee || 0)));
      })
      .catch(() => {});
  }, []);
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
          } catch {}
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

  useEffect(() => {
    if (storeId) {
      void refreshPixKey(storeId);
    }
  }, [storeId]);

  useEffect(() => {
    if (!showWithdrawModal && !selectedTx && !selectedWithdrawal) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || withdrawSubmitting) return;
      if (showWithdrawModal) {
        setShowWithdrawModal(false);
        window.requestAnimationFrame(() => withdrawTriggerRef.current?.focus());
      } else if (selectedTx) {
        setSelectedTx(null);
        window.requestAnimationFrame(() => transactionTriggerRef.current?.focus());
      } else if (selectedWithdrawal) {
        setSelectedWithdrawal(null);
        window.requestAnimationFrame(() => withdrawalTriggerRef.current?.focus());
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [showWithdrawModal, selectedTx, selectedWithdrawal, withdrawSubmitting]);

  async function loadActivePixKey(activeStoreId: string): Promise<CreatorPixKey | null> {
    const response = await fetch(`/api/financeiro/pix-key?storeId=${encodeURIComponent(activeStoreId)}&at=${Date.now()}`, {
      cache: 'no-store'
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.success) {
      throw new Error(payload.error || 'Não foi possível consultar a chave PIX cadastrada.');
    }
    if (!payload.hasKey || !payload.pixKey) return null;
    return {
      id: payload.pixKey.id,
      creatorId: '',
      storeId: activeStoreId,
      pixKeyType: 'CPF',
      pixKey: '',
      pixKeyMasked: payload.pixKey.pixKeyMasked,
      holderName: payload.pixKey.holderName || null,
      validationStatus: payload.pixKey.validationStatus,
      validatedAt: payload.pixKey.validatedAt || '',
      isActive: true,
      createdAt: '',
      updatedAt: ''
    };
  }

  async function loadWithdrawals(activeStoreId: string): Promise<WithdrawalRecord[]> {
    const response = await fetch(`/api/financeiro/saque?storeId=${encodeURIComponent(activeStoreId)}`, { cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.success) {
      throw new Error(payload.error || 'Não foi possível consultar o histórico de saques.');
    }
    return payload.withdrawals || [];
  }

  async function refreshPixKey(activeStoreId = storeId) {
    if (!activeStoreId) return null;
    try {
      const pixKey = await loadActivePixKey(activeStoreId);
      setActivePixKey(pixKey);
      return pixKey;
    } catch (error) {
      console.error('Erro ao recarregar a chave PIX:', error);
      setActivePixKey(null);
      throw error;
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      const [sumData, stmtData, wtdData] = await Promise.all([
        calculateCreatorWallet(storeId),
        getWalletTransactionsStatement({
          storeId,
          period: periodFilter,
          status: statusFilter,
          search: searchQuery,
          page,
          limit: 15
        }),
        loadWithdrawals(storeId)
      ]);

      setSummary(sumData);
      setTransactions(stmtData.transactions);
      setTotalPages(stmtData.totalPages);
      setTotalCount(stmtData.totalCount);
      setWithdrawals(wtdData);

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

  const handleOpenWithdrawModal = async () => {
    setWithdrawError(null);
    setWithdrawSuccess(null);
    const maxTransfer = Math.max(0, summary.saldoDisponivel - withdrawalFee);
    setWithdrawAmountInput(maxTransfer > 0 ? maxTransfer.toFixed(2) : '1.00');
    setShowWithdrawModal(true);
    try {
      await refreshPixKey();
    } catch {
      setWithdrawError('Não foi possível confirmar a chave PIX agora. Atualize a página ou cadastre a chave novamente.');
    }
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

    if (val < minimumWithdrawalAmount) {
      setWithdrawError(`O valor mínimo para saque é de ${formatCurrency(minimumWithdrawalAmount)}.`);
      return;
    }

    if (val + withdrawalFee > summary.saldoDisponivel) {
      setWithdrawError(`Saldo disponível insuficiente. O valor solicitado com a taxa totaliza ${formatCurrency(val + withdrawalFee)} e seu saldo é ${formatCurrency(summary.saldoDisponivel)}.`);
      return;
    }

    setWithdrawSubmitting(true);

    try {
      const { data: authData } = await supabase.auth.getSession();
      const jwtToken = authData.session?.access_token;
      if (!jwtToken) throw new Error("Sessão inválida. Faça login novamente.");
      const creatorId = authData.session?.user?.id || 'user-demo';

      const nonceRes = await fetch('/api/financeiro/nonce');
      const nonceData = await nonceRes.json();
      if (!nonceRes.ok || !nonceData.success) {
        throw new Error("Falha ao iniciar transação segura. Tente novamente.");
      }

      const payloadString = `${val}|${storeId}|${nonceData.nonce}`;
      const enc = new TextEncoder();
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw', enc.encode(jwtToken), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
      const signatureBuffer = await window.crypto.subtle.sign('HMAC', cryptoKey, enc.encode(payloadString));
      const clientSignature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

      const res = await fetch('/api/financeiro/saque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
        body: JSON.stringify({
          storeId,
          creatorId,
          amount: val,
          creatorProfileCpf,
          nonce: nonceData.nonce,
          expiresAt: nonceData.expiresAt,
          serverSignature: nonceData.signature,
          clientSignature
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao solicitar saque PIX.');
      }

      setWithdrawSuccess(`Saque de ${formatCurrency(val)} solicitado com sucesso${withdrawalFee > 0 ? ` (taxa: ${formatCurrency(withdrawalFee)})` : ''}! O saldo foi reservado e aguarda pagamento pela administração.`);
      setTimeout(() => {
        setShowWithdrawModal(false);
        loadData();
      }, 2500);

    } catch (err: unknown) {
      setWithdrawError(err instanceof Error ? err.message : 'Falha ao processar a solicitação de saque.');
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 font-sans pb-12">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
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

        <div className="flex flex-col min-[390px]:flex-row items-stretch min-[390px]:items-center gap-3">
          <button
            onClick={() => loadData()}
            aria-label="Atualizar dados financeiros"
            className="min-h-11 justify-center p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all text-xs font-bold flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy"
            title="Atualizar Dados"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          <button
            onClick={(event) => { withdrawTriggerRef.current = event.currentTarget; handleOpenWithdrawModal(); }}
            className="min-h-11 justify-center px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Solicitar Saque PIX</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-2 flex flex-col justify-between">
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

        <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-2 flex flex-col justify-between">
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

        <div className="bg-gradient-to-br from-brand-navy to-slate-900 rounded-3xl p-4 sm:p-6 shadow-xl space-y-2 flex flex-col justify-between text-white border border-brand-navy/30 relative overflow-hidden">
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

        <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-2 flex flex-col justify-between">
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

      <FinancialOverview {...{ calculatorPrice, setCalculatorPrice, calculatorInstallments, activePixKey, summary, withdrawals, withdrawalTriggerRef, setSelectedWithdrawal, formatCurrency }} setCalculatorInstallments={setCalculatorInstallments} />

      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-6">
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
              aria-label="Buscar no extrato financeiro"
              className="min-h-11 w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all font-medium focus:ring-2 focus:ring-brand-navy/20"
            />
          </div>
        </div>

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
              onChange={(val) => { setPeriodFilter(val as typeof periodFilter); setPage(1); }}
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
              onChange={(val) => { setStatusFilter(val as typeof statusFilter); setPage(1); }}
              size="sm"
            />
          </div>

          <div className="flex items-end justify-end">
            <span className="text-xs text-slate-500 font-bold">
              {totalCount} {totalCount === 1 ? 'registro encontrado' : 'registros encontrados'}
            </span>
          </div>
        </div>

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
            <div className="divide-y divide-slate-100 sm:hidden">
              {transactions.map(tx => {
                const presentation = getTransactionPresentation(tx);
                return <button key={tx.id} type="button" onClick={(event) => { transactionTriggerRef.current = event.currentTarget; setSelectedTx(tx); }} className="w-full space-y-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-inset"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words text-sm font-bold text-slate-900">{tx.description}</p>{tx.buyerName && <p className="mt-1 truncate text-xs text-slate-500">{tx.buyerName}</p>}</div><span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${presentation.className}`}>{presentation.label}</span></div><div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs"><div><p className="font-bold uppercase tracking-wide text-slate-400">Data</p><p className="mt-1 text-slate-700">{new Date(tx.createdAt).toLocaleString('pt-BR')}</p></div><div className="text-right"><p className="font-bold uppercase tracking-wide text-slate-400">{presentation.direction}</p><p className={`mt-1 font-mono text-sm font-black ${presentation.valueClass}`}>{formatCurrency(tx.netAmount)}</p></div></div></button>;
              })}
            </div>
            <table className="hidden w-full text-left border-collapse font-sans sm:table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Data</th>
                  <th className="py-3.5 px-4">Descrição</th>
                  <th className="py-3.5 px-4">Pedido / Ref</th>
                  <th className="py-3.5 px-4 text-right">Valor Bruto</th>
                  <th className="py-3.5 px-4 text-right">Taxa Educalizando</th>
                  <th className="py-3.5 px-4 text-right">Taxa do gateway</th>
                  <th className="py-3.5 px-4 text-right">Valor Líquido</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {transactions.map(tx => {
                  const presentation = getTransactionPresentation(tx);

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

                      <td className={`py-3.5 px-4 text-right font-mono font-black text-sm ${presentation.valueClass}`}>
                        {formatCurrency(tx.netAmount)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${presentation.className}`}>{presentation.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

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

      <FinancialDialogs {...{ showWithdrawModal, setShowWithdrawModal, withdrawTriggerRef, withdrawError, withdrawSuccess, handleExecuteWithdrawal, summary, activePixKey, withdrawAmountInput, setWithdrawAmountInput, minimumWithdrawalAmount, withdrawalFee, withdrawSubmitting, selectedTx, setSelectedTx, selectedWithdrawal, setSelectedWithdrawal, formatCurrency }} />

    </div>
  );
}
