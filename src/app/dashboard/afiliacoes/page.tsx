"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getMyAffiliations } from '@/lib/affiliate-service';
import { Affiliate } from '@/lib/types';
import { Link2, Copy, Check, DollarSign, MousePointerClick, ShoppingBag, Store, TrendingUp, BarChart, Percent } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AffiliateDashboardPage() {
  const [affiliations, setAffiliations] = useState<Affiliate[]>([]);
  const [stats, setStats] = useState({ 
    totalComissoes: 0, 
    totalVendas: 0, 
    pendente: 0, 
    pago: 0, 
    cliques: 0,
    receitaGerada: 0,
    conversao: 0,
    ticketMedio: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      setUserId(user.id);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const [affData, statsRes] = await Promise.all([
        getMyAffiliations(),
        fetch('/api/affiliates/stats', {
          headers: session ? { 'Authorization': `Bearer ${session.access_token}` } : {}
        })
      ]);
      
      setAffiliations(affData);
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.stats);
          setRecentTransactions(statsData.recentTransactions || []);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const handleCopyLink = (storeSlug: string, affiliateId: string) => {
    const url = `${window.location.origin}/loja/${storeSlug}?ref=${affiliateId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(affiliateId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return <div className="p-8">Carregando afiliações...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Minhas Afiliações</h1>
          <p className="text-slate-500 mt-1">Acompanhe seus links de divulgação e comissões.</p>
        </div>
        {userId && (
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard/afiliacoes/mercado" 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-bold shadow-sm transition-all"
            >
              <Store className="w-4 h-4 text-brand-teal" />
              Mercado de Produtos
            </Link>
            <Link 
              href={`/afiliado/${userId}`} 
              target="_blank"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-navy hover:bg-brand-navy-hover text-white rounded-xl text-sm font-bold shadow-md transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              Minha Loja de Afiliado
            </Link>
          </div>
        )}
      </div>

      {/* Resumo Financeiro e Analítico */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        
        {/* Cliques */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <MousePointerClick className="w-4 h-4" />
            </div>
            <h3 className="font-medium text-slate-700 text-sm">Cliques</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.cliques}</p>
        </motion.div>

        {/* Vendas */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h3 className="font-medium text-slate-700 text-sm">Vendas Pagas</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.totalVendas}</p>
        </motion.div>

        {/* Conversão */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Percent className="w-4 h-4" />
            </div>
            <h3 className="font-medium text-slate-700 text-sm">Conversão</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.conversao.toFixed(2)}%</p>
        </motion.div>

        {/* Receita Gerada */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="font-medium text-slate-700 text-sm">Receita Gerada</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.receitaGerada)}
          </p>
        </motion.div>

        {/* Ticket Médio */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
              <BarChart className="w-4 h-4" />
            </div>
            <h3 className="font-medium text-slate-700 text-sm">Ticket Médio</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.ticketMedio)}
          </p>
        </motion.div>

        {/* Comissão */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer bg-green-50/30"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-700">
              <DollarSign className="w-4 h-4" />
            </div>
            <h3 className="font-medium text-green-800 text-sm">Comissão</h3>
          </div>
          <p className="text-2xl font-bold text-green-900">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalComissoes)}
          </p>
        </motion.div>

      </div>

      {/* Lojas Afiliadas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Lojas Parceiras</h2>
        </div>
        
        <div className="divide-y divide-slate-100">
          {affiliations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Link2 className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-slate-900 font-medium">Você ainda não é afiliado de nenhuma loja</h3>
              <p className="text-slate-500 text-sm mt-1 mb-6">
                Explore a vitrine e envie solicitações de parceria.
              </p>
              <Link href="/vitrine" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
                Explorar Lojas
              </Link>
            </div>
          ) : (
            affiliations.map(affiliate => (
              <div key={affiliate.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  {affiliate.store?.logo_url ? (
                    <img src={affiliate.store.logo_url} alt="" className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-medium border border-slate-200">
                      Loja
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-slate-900 text-lg">{affiliate.store?.nome_loja}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        affiliate.status === 'aprovado' ? 'bg-green-100 text-green-700' :
                        affiliate.status === 'rejeitado' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {affiliate.status.toUpperCase()}
                      </span>
                      {affiliate.status === 'aprovado' && (
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                          Comissão: {affiliate.commission_rate || affiliate.store?.affiliate_commission_rate || 0}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {affiliate.status === 'aprovado' && affiliate.store?.slug && (
                  <div className="flex-1 max-w-md bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3">
                    <div className="flex-1 truncate text-sm text-slate-600 font-mono">
                      {`${typeof window !== 'undefined' ? window.location.origin : ''}/loja/${affiliate.store.slug}?ref=${affiliate.id}`}
                    </div>
                    <button 
                      onClick={() => handleCopyLink(affiliate.store!.slug, affiliate.id)}
                      className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600 shrink-0"
                      title="Copiar Link"
                    >
                      {copiedId === affiliate.id ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Histórico Recente de Comissões */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Comissões Recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                <th className="p-4 font-medium">Data</th>
                <th className="p-4 font-medium">Produto</th>
                <th className="p-4 font-medium">Valor Recebido</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    Nenhuma venda registrada ainda. Divulgue seu link para começar a ganhar!
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50">
                    <td className="p-4 text-sm text-slate-600">
                      {new Date(tx.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 text-sm text-slate-900 font-medium">
                      {tx.productName}
                    </td>
                    <td className="p-4 text-sm text-slate-900 font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        tx.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {tx.status === 'COMPLETED' ? 'APROVADO' : tx.status === 'PENDING' ? 'PENDENTE' : tx.status}
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
