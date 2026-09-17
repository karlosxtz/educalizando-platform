"use client";

import { useEffect, useState } from 'react';
import { DollarSign, CheckCircle2, XCircle, Clock, Search, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface WithdrawalData {
  id: string;
  amount: number;
  net_amount?: number | null;
  withdrawal_fee?: number | null;
  status: string;
  requested_at: string;
  pix_key_masked: string;
  pix_key_full?: string | null;
  pix_key_type?: string;
  holder_name?: string | null;
  bank_name?: string | null;
  store: {
    nome_loja: string;
    slug: string;
  };
}

export default function SuperAdminSaques() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  async function fetchWithdrawals() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/withdrawals');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Não foi possível carregar os saques.');
      setWithdrawals(Array.isArray(data.withdrawals) ? data.withdrawals : []);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Erro ao carregar saques.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: 'complete' | 'reject' | 'reopen' | 'reverse') {
    const paymentReference = action === 'complete'
      ? prompt('Após realizar o PIX, informe a referência da transferência ou do comprovante:')
      : null;
    if (action === 'complete' && !paymentReference?.trim()) return;
    const reviewNote = action !== 'complete'
      ? prompt(action === 'reverse' ? 'Informe o motivo do estorno (o valor será devolvido ao saldo):' : action === 'reopen' ? 'Informe o motivo para reabrir a solicitação:' : 'Informe o motivo da rejeição (o saldo será devolvido ao produtor):')
      : null;
    if ((action === 'reject' || action === 'reverse' || action === 'reopen') && !reviewNote?.trim()) return;
    if (!confirm(`Confirma ${action === 'complete' ? 'que o PIX já foi pago' : action === 'reopen' ? 'reabrir esta solicitação' : 'a alteração e devolução do saldo'}?`)) return;
    
    try {
      const res = await fetch(`/api/admin/withdrawals`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, paymentReference, reviewNote })
      });
      const data = await res.json();
      if (data.success) {
        const result = action === 'complete' ? 'marcado como pago' : action === 'reopen' ? 'reaberto e reservado novamente' : action === 'reverse' ? 'estornado e devolvido ao saldo' : 'rejeitado e devolvido ao saldo';
        alert(`Saque ${result} com sucesso.`);
        fetchWithdrawals();
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (e) {
      alert('Erro inesperado.');
    }
  }

  function handleExportCSV() {
    const csvData = withdrawals.map(w => ({
      "ID Saque": w.id,
      "Loja": w.store?.nome_loja || 'Desconhecida',
      "Valor (R$)": Number(w.amount).toFixed(2),
      "Taxa de saque (R$)": Number(w.withdrawal_fee || 0).toFixed(2),
      "Chave PIX": w.pix_key_masked,
      "Data Solicitação": new Date(w.requested_at).toLocaleString('pt-BR'),
      "Status": w.status
    }));
    import('@/lib/csv-utils').then(({ downloadCSV }) => {
      downloadCSV(csvData, "educalizando_saques_contabil");
    });
  }

  const filteredWithdrawals = withdrawals.filter((item) => {
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const haystack = `${item.store?.nome_loja || ''} ${item.pix_key_masked || ''} ${item.id}`.toLowerCase();
    return matchesStatus && haystack.includes(query.toLowerCase());
  });
  const pendingTotal = withdrawals.filter((w) => w.status === 'PENDING').reduce((sum, w) => sum + Number(w.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Gestão de Saques</h1>
          <p className="text-slate-400 mt-1">Aprove ou rejeite solicitações de saque dos criadores.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchWithdrawals()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium"><RefreshCw className="w-4 h-4" /> Atualizar</button>
          <button onClick={handleExportCSV} disabled={loading || withdrawals.length === 0} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium disabled:opacity-50">Exportar CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4"><p className="text-xs text-slate-500 uppercase font-bold">Solicitações</p><p className="text-2xl text-white font-black mt-1">{withdrawals.length}</p></div>
        <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-4"><p className="text-xs text-amber-400 uppercase font-bold">Pendentes</p><p className="text-2xl text-white font-black mt-1">{withdrawals.filter((w) => w.status === 'PENDING').length}</p></div>
        <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4"><p className="text-xs text-emerald-400 uppercase font-bold">A pagar</p><p className="text-2xl text-white font-black mt-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pendingTotal)}</p></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por loja, chave ou ID" className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-3 text-white placeholder:text-slate-600" /></div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-3 text-white"><option value="ALL">Todos os status</option><option value="PENDING">Pendentes</option><option value="COMPLETED">Pagos</option><option value="FAILED">Rejeitados</option></select>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs uppercase bg-slate-900 text-slate-500 border-b border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4">Loja</th>
                <th scope="col" className="px-6 py-4">Valor</th>
                <th scope="col" className="px-6 py-4">Chave PIX</th>
                <th scope="col" className="px-6 py-4">Data</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Carregando saques...
                  </td>
                </tr>
              ) : error ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-rose-400">{error}<button onClick={fetchWithdrawals} className="ml-3 underline">Tentar novamente</button></td></tr>
              ) : filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Nenhum saque solicitado.
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((item) => (
                  <tr key={item.id} className="border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">
                      <Link href={`/loja/${item.store?.slug}`} className="hover:text-blue-400 transition-colors">
                        {item.store?.nome_loja}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-emerald-400 font-bold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.net_amount ?? item.amount)}
                      {Number(item.withdrawal_fee || 0) > 0 && <span className="block mt-1 text-[10px] font-medium text-amber-400">Taxa: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.withdrawal_fee || 0)}</span>}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      <span className="text-white">{item.pix_key_full || item.pix_key_masked}</span>
                      <span className="block text-[10px] text-slate-500">{item.pix_key_type || 'PIX'} · chave para pagamento manual</span>
                      <span className="block text-[10px] text-slate-400">Titular: {item.holder_name || 'Não informado'} · Banco: {item.bank_name || 'Não informado'}</span>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(item.requested_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit ${
                        item.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : 
                        item.status === 'FAILED' ? 'bg-red-500/10 text-red-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        {item.status === 'COMPLETED' ? <CheckCircle2 className="w-3 h-3" /> : 
                         item.status === 'FAILED' ? <XCircle className="w-3 h-3" /> :
                         <Clock className="w-3 h-3" />}
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      {item.status === 'PENDING' && (
                        <>
                          <button 
                            onClick={() => handleAction(item.id, 'complete')}
                            className="text-emerald-500 hover:text-emerald-400 font-medium"
                          >
                            Marcar como pago
                          </button>
                          <button 
                            onClick={() => handleAction(item.id, 'reject')}
                            className="text-red-500 hover:text-red-400 font-medium"
                          >
                            Rejeitar
                          </button>
                        </>
                      )}
                      {item.status === 'COMPLETED' && <button onClick={() => handleAction(item.id, 'reverse')} className="text-rose-400 hover:text-rose-300 font-medium">Estornar</button>}
                      {item.status === 'FAILED' && <button onClick={() => handleAction(item.id, 'reopen')} className="text-amber-400 hover:text-amber-300 font-medium">Reabrir</button>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
