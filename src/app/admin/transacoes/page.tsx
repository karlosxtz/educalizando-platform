"use client";

import { useEffect, useState } from 'react';
import { DollarSign, Download, Loader2, RotateCcw, ShieldAlert } from 'lucide-react';
import { downloadCSV } from '@/lib/csv-utils';

interface TransactionData {
  id: string;
  status: string;
  created_at: string;
  buyer_name: string;
  buyer_email: string;
  total_amount: number;
  platform_fee_amount: number;
  creator_net_amount: number;
  store: {
    nome_loja: string;
  };
}

interface RefundRequestData {
  id: string;
  order_id: string;
  requester_email: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  review_note?: string | null;
  created_at: string;
}

export default function SuperAdminTransacoes() {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [refundRequests, setRefundRequests] = useState<RefundRequestData[]>([]);
  const [refundRequestsError, setRefundRequestsError] = useState('');

  useEffect(() => {
    fetchTransactions();
    fetchRefundRequests();
  }, []);

  async function fetchTransactions() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/transactions');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Não foi possível carregar as transações.');
      setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Erro ao carregar transações.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchRefundRequests() {
    setRefundRequestsError('');
    try {
      const res = await fetch('/api/admin/refund-requests');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Não foi possível carregar solicitações de reembolso.');
      setRefundRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch (requestError) {
      setRefundRequestsError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar solicitações de reembolso.');
    }
  }

  function handleExportCSV() {
    const csvData = transactions.map(t => ({
      "ID Pedido": t.id,
      "Data": new Date(t.created_at).toLocaleString('pt-BR'),
      "Loja": t.store?.nome_loja || 'Desconhecida',
      "Cliente": t.buyer_name,
      "Email Cliente": t.buyer_email,
      "Status": t.status,
      "Valor Total Bruto (R$)": Number(t.total_amount).toFixed(2),
      "Taxa Educalizando (R$)": Number(t.platform_fee_amount).toFixed(2),
      "Líquido Criador (R$)": Number(t.creator_net_amount).toFixed(2)
    }));
    downloadCSV(csvData, "educalizando_transacoes_contabil");
  }

  async function handleRefund(transaction: TransactionData, fromCustomerRequest = false) {
    if (transaction.status !== 'paid' || refundingId) return;

    const orderSuffix = transaction.id.slice(-6).toUpperCase();
    const reason = window.prompt('Informe o motivo do estorno administrativo (será registrado na auditoria):');
    if (!reason?.trim()) return;

    const confirmation = window.prompt(
      `Atenção: esta ação revoga o acesso do pedido e ajusta os saldos internos. Ela não faz o reembolso no gateway automaticamente.\n\nPara confirmar, digite exatamente: ESTORNAR ${orderSuffix}`
    );
    if (!confirmation) return;

    setRefundingId(transaction.id);
    try {
      const res = await fetch(`/api/admin/transactions/${encodeURIComponent(transaction.id)}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim(), confirmation: confirmation.trim(), fromCustomerRequest })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || 'Não foi possível registrar o estorno.');
      alert(data.message || 'Estorno administrativo registrado com sucesso.');
      await fetchTransactions();
      await fetchRefundRequests();
    } catch (refundError) {
      alert(refundError instanceof Error ? refundError.message : 'Erro ao registrar o estorno.');
    } finally {
      setRefundingId(null);
    }
  }

  async function handleRejectRefundRequest(refundRequest: RefundRequestData) {
    if (refundRequest.status !== 'PENDING') return;
    const reviewNote = window.prompt('Informe a justificativa da recusa para o comprador:');
    if (!reviewNote?.trim()) return;
    try {
      const res = await fetch('/api/admin/refund-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: refundRequest.id, reviewNote: reviewNote.trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || 'Não foi possível recusar a solicitação.');
      alert('Solicitação recusada e registrada.');
      await fetchRefundRequests();
    } catch (requestError) {
      alert(requestError instanceof Error ? requestError.message : 'Não foi possível recusar a solicitação.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Auditoria de Transações</h1>
          <p className="text-slate-400 mt-1">Histórico financeiro das vendas, com estorno administrativo rastreável.</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={loading || transactions.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      <div className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <p><strong>Antes de estornar:</strong> devolva o valor ao comprador pelo gateway quando aplicável. Esta ação da Educalizando revoga o acesso e registra os ajustes financeiros internos; ela não envia um PIX nem solicita reembolso automaticamente ao gateway.</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs uppercase bg-slate-900 text-slate-500 border-b border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4">Cliente / Pedido</th>
                <th scope="col" className="px-6 py-4">Loja</th>
                <th scope="col" className="px-6 py-4 text-right">Valor Bruto</th>
                <th scope="col" className="px-6 py-4 text-right">Taxa Plat.</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Carregando transações...
                  </td>
                </tr>
              ) : error ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-rose-400">{error}<button onClick={fetchTransactions} className="ml-3 underline">Tentar novamente</button></td></tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Nenhuma transação registrada.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="line-clamp-1 max-w-xs">{t.buyer_name}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{t.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {t.store?.nome_loja}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-200">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.total_amount)}
                    </td>
                    <td className="px-6 py-4 text-right text-red-400">
                      -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.platform_fee_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        t.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 
                        t.status === 'failed' || t.status === 'refunded' ? 'bg-red-500/10 text-red-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        {t.status === 'paid' ? 'pago' : t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {t.status === 'paid' ? (
                        <button
                          type="button"
                          onClick={() => handleRefund(t)}
                          disabled={refundingId !== null}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 px-3 py-2 text-xs font-bold text-rose-300 transition-colors hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {refundingId === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                          {refundingId === t.id ? 'Estornando...' : 'Estornar'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <section className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex flex-col gap-1 border-b border-slate-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Solicitações de reembolso</h2>
            <p className="text-sm text-slate-400">Pedidos enviados pelos clientes e aguardando análise manual.</p>
          </div>
          <button type="button" onClick={fetchRefundRequests} className="text-xs font-bold text-blue-300 hover:text-blue-200">Atualizar solicitações</button>
        </div>
        {refundRequestsError ? (
          <p className="px-6 py-5 text-sm text-amber-300">{refundRequestsError}</p>
        ) : refundRequests.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-500">Nenhuma solicitação de reembolso até o momento.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-900 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Cliente / pedido</th>
                  <th className="px-6 py-3">Motivo</th>
                  <th className="px-6 py-3">Solicitada em</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Análise</th>
                </tr>
              </thead>
              <tbody>
                {refundRequests.map((refundRequest) => {
                  const transaction = transactions.find((item) => item.id === refundRequest.order_id);
                  return (
                    <tr key={refundRequest.id} className="border-t border-slate-800/70 align-top">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-200">{refundRequest.requester_email}</p>
                        <p className="mt-1 font-mono text-[10px] text-slate-500">{refundRequest.order_id}</p>
                      </td>
                      <td className="max-w-sm px-6 py-4 text-xs leading-relaxed text-slate-300">{refundRequest.reason}</td>
                      <td className="px-6 py-4 text-xs">{new Date(refundRequest.created_at).toLocaleString('pt-BR')}</td>
                      <td className="px-6 py-4"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${refundRequest.status === 'PENDING' ? 'bg-amber-500/10 text-amber-300' : refundRequest.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>{refundRequest.status === 'PENDING' ? 'EM ANÁLISE' : refundRequest.status === 'APPROVED' ? 'APROVADA' : 'RECUSADA'}</span></td>
                      <td className="px-6 py-4 text-right">
                        {refundRequest.status === 'PENDING' ? (
                          <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => transaction ? handleRefund(transaction, true) : alert('Pedido não encontrado na lista de transações. Atualize a página e tente novamente.')} className="text-xs font-bold text-emerald-300 hover:text-emerald-200">Aprovar e estornar</button>
                            <button type="button" onClick={() => handleRejectRefundRequest(refundRequest)} className="text-xs font-bold text-rose-300 hover:text-rose-200">Recusar</button>
                          </div>
                        ) : <span className="text-xs text-slate-600">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
