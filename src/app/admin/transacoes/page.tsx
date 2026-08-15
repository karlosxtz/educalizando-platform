"use client";

import { useEffect, useState } from 'react';
import { DollarSign, Download } from 'lucide-react';
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

export default function SuperAdminTransacoes() {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    try {
      const res = await fetch('/api/admin/transactions');
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Auditoria de Transações</h1>
          <p className="text-slate-400 mt-1">Histórico completo financeiro das vendas geradas na plataforma.</p>
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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Carregando transações...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
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
