"use client";

import { useEffect, useState } from 'react';
import { DollarSign, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';

interface WithdrawalData {
  id: string;
  amount: number;
  status: string;
  requested_at: string;
  pix_key_masked: string;
  store: {
    nome_loja: string;
    slug: string;
  };
}

export default function SuperAdminSaques() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  async function fetchWithdrawals() {
    try {
      const res = await fetch('/api/admin/withdrawals');
      const data = await res.json();
      if (data.success) {
        setWithdrawals(data.withdrawals);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: 'approve' | 'reject') {
    if (!confirm(`Tem certeza que deseja ${action === 'approve' ? 'APROVAR' : 'REJEITAR'} este saque?`)) return;
    
    try {
      const res = await fetch(`/api/admin/withdrawals`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Saque ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso.`);
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
      "Chave PIX": w.pix_key_masked,
      "Data Solicitação": new Date(w.requested_at).toLocaleString('pt-BR'),
      "Status": w.status
    }));
    import('@/lib/csv-utils').then(({ downloadCSV }) => {
      downloadCSV(csvData, "educalizando_saques_contabil");
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Gestão de Saques</h1>
          <p className="text-slate-400 mt-1">Aprove ou rejeite solicitações de saque dos criadores.</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={loading || withdrawals.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Exportar CSV
        </button>
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
              ) : withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Nenhum saque solicitado.
                  </td>
                </tr>
              ) : (
                withdrawals.map((item) => (
                  <tr key={item.id} className="border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">
                      <Link href={`/loja/${item.store?.slug}`} className="hover:text-blue-400 transition-colors">
                        {item.store?.nome_loja}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-emerald-400 font-bold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {item.pix_key_masked}
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
                            onClick={() => handleAction(item.id, 'approve')}
                            className="text-emerald-500 hover:text-emerald-400 font-medium"
                          >
                            Aprovar
                          </button>
                          <button 
                            onClick={() => handleAction(item.id, 'reject')}
                            className="text-red-500 hover:text-red-400 font-medium"
                          >
                            Rejeitar
                          </button>
                        </>
                      )}
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
