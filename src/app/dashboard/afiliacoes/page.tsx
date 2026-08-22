"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getMyAffiliations, getAffiliateProfile } from '@/lib/affiliate-service';
import { Affiliate, AffiliateProfile } from '@/lib/types';
import { Link2, Copy, Check, DollarSign, MousePointerClick, ShoppingBag, Store, TrendingUp, BarChart, Percent, Calendar, AlertCircle, Wallet, Pencil } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AffiliateWallet } from './AffiliateWallet';

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
  const [storePerformance, setStorePerformance] = useState<any[]>([]);
  const [productPerformance, setProductPerformance] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileSlug, setProfileSlug] = useState<string | null>(null);
  
  const [dateFilter, setDateFilter] = useState('30_days');
  const [activeTab, setActiveTab] = useState<'stats' | 'wallet'>('stats');

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#carteira') {
        setActiveTab('wallet');
      } else if (window.location.hash === '#stats' || window.location.hash === '') {
        // não forçamos para stats se tiver outro hash, mas se for vazio ou stats, sim
        if (window.location.hash === '' && activeTab !== 'stats') {
           // não resetar na primeira carga se não precisar, mas se vier vazio, é stats
        }
      }
    };
    
    // Ler no primeiro carregamento
    handleHash();
    
    // Escutar mudanças
    window.addEventListener('hashchange', handleHash);
    
    // Fallback: em Next.js App Router, clicks em Link com hash as vezes não disparam hashchange.
    // Uma forma simples de contornar é interceptar os clicks se necessário, mas o Sidebar
    // já usa Link do Next. O hashchange deve pegar a maioria.
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    loadData();
  }, [dateFilter]);

  const getDateRange = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    switch (dateFilter) {
      case 'today':
        break;
      case '7_days':
        startDate.setDate(today.getDate() - 7);
        break;
      case '30_days':
        startDate.setDate(today.getDate() - 30);
        break;
      case 'this_month':
        startDate.setDate(1);
        break;
      case '90_days':
        startDate.setDate(today.getDate() - 90);
        break;
      case 'all':
        startDate = new Date('2020-01-01');
        break;
      default:
        startDate.setDate(today.getDate() - 30);
    }
    
    return { 
      start: startDate.toISOString(), 
      end: today.toISOString() 
    };
  };

  async function loadData() {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      setUserId(user.id);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const { start, end } = getDateRange();
      const statsUrl = dateFilter === 'all' 
        ? '/api/affiliates/stats' 
        : `/api/affiliates/stats?startDate=${start}&endDate=${end}`;

      const [affData, statsRes, profile] = await Promise.all([
        getMyAffiliations(),
        fetch(statsUrl, {
          headers: session ? { 'Authorization': `Bearer ${session.access_token}` } : {}
        }),
        getAffiliateProfile(user.id)
      ]);
      
      setAffiliations(affData);
      if (profile) setProfileSlug(profile.slug);
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.stats);
          setStorePerformance(statsData.storePerformance || []);
          setProductPerformance(statsData.productPerformance || []);
          setRecentTransactions(statsData.recentTransactions || []);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getAffiliateLink = (affiliate: any) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (affiliate.product_id) {
      return `${origin}/loja/${affiliate.store?.slug}/produto/${affiliate.product_id}?ref=${affiliate.id}`;
    }
    return `${origin}/loja/${affiliate.store?.slug}?ref=${affiliate.id}`;
  };

  if (isLoading && affiliations.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Carregando painel de afiliados...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Central de Afiliados</h1>
          <p className="text-slate-500 mt-1">Acompanhe seus links de divulgação e performance.</p>
        </div>
        {userId && (
          <div className="flex flex-wrap items-center gap-3">
            <Link 
              href="/dashboard/afiliacoes/mercado" 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-bold shadow-sm transition-all"
            >
              <Store className="w-4 h-4 text-brand-teal" />
              Mercado de Produtos
            </Link>
            {profileSlug ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <Link 
                  href={`/afiliado/${profileSlug}`} 
                  target="_blank"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-navy hover:bg-brand-navy-hover text-white rounded-xl text-sm font-bold shadow-md transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Minha Vitrine
                </Link>
                <Link 
                  href="/dashboard/afiliacoes/vitrine"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-bold shadow-sm transition-all"
                >
                  <Pencil className="w-4 h-4 text-slate-500" />
                  Editar Vitrine
                </Link>
              </div>
            ) : (
              <Link 
                href="/dashboard/afiliacoes/vitrine"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-navy hover:bg-brand-navy-hover text-white rounded-xl text-sm font-bold shadow-md transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                Configurar Vitrine
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('stats')}
          className={`pb-4 px-2 text-sm font-bold transition-all relative ${
            activeTab === 'stats' ? 'text-brand-primary' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Estatísticas e Links
          {activeTab === 'stats' && (
            <motion.div layoutId="affiliate-tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-primary rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('wallet')}
          className={`pb-4 px-2 text-sm font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'wallet' ? 'text-brand-primary' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Wallet className="w-4 h-4" />
          Saques e Carteira
          {activeTab === 'wallet' && (
            <motion.div layoutId="affiliate-tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-primary rounded-t-full" />
          )}
        </button>
      </div>

      {activeTab === 'wallet' ? (
        <div className="mt-8">
          <AffiliateWallet />
        </div>
      ) : (
        <>
          {/* Barra de Filtros */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <Calendar className="w-5 h-5 text-slate-400" />
          <span>Período de Análise</span>
        </div>
        <select 
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all font-medium"
          disabled={isLoading}
        >
          <option value="today">Hoje</option>
          <option value="7_days">Últimos 7 dias</option>
          <option value="30_days">Últimos 30 dias</option>
          <option value="this_month">Este mês</option>
          <option value="90_days">Últimos 90 dias</option>
          <option value="all">Todo o período</option>
        </select>
      </div>

      {/* Resumo Financeiro e Analítico */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
            <div className="w-8 h-8 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin"></div>
          </div>
        )}
        
        <motion.div 
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <MousePointerClick className="w-4 h-4" />
            </div>
            <h3 className="font-medium text-slate-700 text-sm">Cliques</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.cliques}</p>
        </motion.div>

        <motion.div 
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h3 className="font-medium text-slate-700 text-sm">Vendas Pagas</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.totalVendas}</p>
        </motion.div>

        <motion.div 
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Percent className="w-4 h-4" />
            </div>
            <h3 className="font-medium text-slate-700 text-sm">Conversão</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.conversao.toFixed(2)}%</p>
        </motion.div>

        <motion.div 
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
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

        <motion.div 
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
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

        <motion.div 
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm bg-green-50/30 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-100 rounded-bl-full -z-10 opacity-50"></div>
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-700">
              <DollarSign className="w-4 h-4" />
            </div>
            <h3 className="font-medium text-green-800 text-sm">Comissão Real</h3>
          </div>
          <p className="text-2xl font-bold text-green-900">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalComissoes)}
          </p>
        </motion.div>

      </div>

      {/* Lojas Afiliadas (Meus Links) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <Link2 className="w-5 h-5 text-brand-primary" />
          <h2 className="text-lg font-semibold text-slate-900">Meus Links (Afiliações Ativas)</h2>
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
              <Link href="/dashboard/afiliacoes/mercado" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
                Explorar Lojas
              </Link>
            </div>
          ) : (
            affiliations.map(affiliate => (
              <div key={affiliate.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors">
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
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        affiliate.status === 'aprovado' ? 'bg-green-100 text-green-700' :
                        affiliate.status === 'rejeitado' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {affiliate.status.toUpperCase()}
                      </span>
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                        {affiliate.product_id ? 'Link de Produto Específico' : 'Link da Loja Inteira'}
                      </span>
                      {affiliate.status === 'aprovado' && (
                        <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                          Comissão: {affiliate.commission_rate || affiliate.store?.affiliate_commission_rate || 0}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {affiliate.status === 'aprovado' && affiliate.store?.slug && (
                  <div className="flex-1 max-w-md w-full">
                    <div className="text-xs font-medium text-slate-500 mb-1.5 ml-1">Seu Link Exclusivo</div>
                    <div className="bg-white p-2 pl-4 rounded-xl border border-slate-200 flex items-center gap-2 shadow-sm">
                      <div className="flex-1 truncate text-sm text-slate-600 font-mono select-all">
                        {getAffiliateLink(affiliate)}
                      </div>
                      <button 
                        onClick={() => handleCopyLink(getAffiliateLink(affiliate), affiliate.id)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors flex items-center gap-2 shrink-0 text-sm"
                      >
                        {copiedId === affiliate.id ? <><Check className="w-4 h-4 text-green-600" /> Copiado</> : <><Copy className="w-4 h-4" /> Copiar</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance por Loja */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Performance por Loja</h2>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                  <th className="p-4 font-medium">Loja</th>
                  <th className="p-4 font-medium">Cliques</th>
                  <th className="p-4 font-medium">Vendas</th>
                  <th className="p-4 font-medium">Conv.</th>
                  <th className="p-4 font-medium">Comissão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 relative">
                {isLoading && storePerformance.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400">Carregando...</td></tr>
                )}
                {!isLoading && storePerformance.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">Sem dados neste período.</td></tr>
                )}
                {storePerformance.map((store, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="p-4 text-sm text-slate-900 font-medium truncate max-w-[120px]">{store.storeName}</td>
                    <td className="p-4 text-sm text-slate-600">{store.cliques}</td>
                    <td className="p-4 text-sm text-slate-600">{store.vendas}</td>
                    <td className="p-4 text-sm text-slate-600">{store.conversao.toFixed(1)}%</td>
                    <td className="p-4 text-sm text-green-600 font-semibold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(store.comissao)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance por Produto */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Produtos com Melhor Desempenho</h2>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                  <th className="p-4 font-medium">Produto</th>
                  <th className="p-4 font-medium">Cliques</th>
                  <th className="p-4 font-medium">Vendas</th>
                  <th className="p-4 font-medium">Receita Bruta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && productPerformance.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-400">Carregando...</td></tr>
                )}
                {!isLoading && productPerformance.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-500">Sem dados de vendas neste período.</td></tr>
                )}
                {productPerformance.map((prod, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="p-4 text-sm">
                      <div className="font-medium text-slate-900 truncate max-w-[150px]">{prod.productName}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[150px]">{prod.storeName}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{prod.cliques}</td>
                    <td className="p-4 text-sm text-slate-600">{prod.vendas}</td>
                    <td className="p-4 text-sm text-emerald-600 font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prod.receita)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Histórico Recente de Comissões */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Extrato de Comissões</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                <th className="p-4 font-medium">Data</th>
                <th className="p-4 font-medium">Detalhes</th>
                <th className="p-4 font-medium">Loja</th>
                <th className="p-4 font-medium">Tipo</th>
                <th className="p-4 font-medium">Valor</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && recentTransactions.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">Carregando extrato...</td></tr>
              )}
              {!isLoading && recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Nenhuma movimentação financeira neste período.
                  </td>
                </tr>
              )}
              {recentTransactions.map((tx) => {
                const isRefund = tx.type === 'REFUND';
                const isNegative = Number(tx.amount) < 0;
                
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/50">
                    <td className="p-4 text-sm text-slate-500">
                      {new Date(tx.date).toLocaleDateString('pt-BR')} <br/>
                      <span className="text-xs">{new Date(tx.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-900 font-medium truncate max-w-[200px]">{tx.productName}</div>
                      <div className="text-xs text-slate-400 font-mono mt-1">ID: {tx.orderId?.substring(0, 8)}...</div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 truncate max-w-[120px]">
                      {tx.storeName}
                    </td>
                    <td className="p-4">
                      {isRefund ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-xs font-bold border border-red-100">
                          <AlertCircle className="w-3.5 h-3.5" />
                          ESTORNO
                        </div>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          COMISSÃO
                        </span>
                      )}
                    </td>
                    <td className={`p-4 text-sm font-bold ${isRefund || isNegative ? 'text-red-600' : 'text-green-600'}`}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        tx.status === 'COMPLETED' ? 'text-green-700 bg-green-100' :
                        tx.status === 'PENDING' ? 'text-yellow-700 bg-yellow-100' :
                        'text-slate-700 bg-slate-100'
                      }`}>
                        {tx.status === 'COMPLETED' ? 'CONCLUÍDO' : tx.status === 'PENDING' ? 'PENDENTE' : tx.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
