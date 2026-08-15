'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Store, Package, DollarSign, TrendingUp, Sparkles, 
  ArrowRight, ExternalLink, Plus, CheckCircle2, ShoppingBag, Percent
} from 'lucide-react';
import { getCurrentCreatorStore, getProductsByStoreId } from '@/lib/store-service';
import { Store as StoreType, Product } from '@/lib/types';
import SalesOverviewChart from '@/components/dashboard/SalesOverviewChart';
import TopProductsReport from '@/components/dashboard/TopProductsReport';
import RecentSalesFeed from '@/components/dashboard/RecentSalesFeed';

export default function DashboardOverviewPage() {
  const [store, setStore] = useState<StoreType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [chartTotalRevenue, setChartTotalRevenue] = useState<number>(0);
  const [chartTotalSalesCount, setChartTotalSalesCount] = useState<number>(0);

  useEffect(() => {
    async function loadData() {
      const s = await getCurrentCreatorStore();
      setStore(s);
      const prods = await getProductsByStoreId(s.id);
      setProducts(prods);
    }
    loadData();
  }, []);

  const publishedCount = products.filter(p => p.status === 'publicado').length;

  const handleChartDataLoaded = (rev: number, count: number) => {
    setChartTotalRevenue(rev);
    setChartTotalSalesCount(count);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-all duration-700"></div>
        <div className="relative z-10 space-y-3 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full border border-white/20 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" /> PAINEL DO CRIADOR EDUCALIZANDO
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Bem-vindo de volta, {store?.nome_loja || 'Prof. Ricardo'}!
          </h1>
          <p className="text-sm text-blue-100 leading-relaxed">
            Sua loja exclusiva está ativa em <strong className="underline font-mono">educalizando.com.br/loja/{store?.slug || 'prof-ricardo'}</strong>. Cadastre novos materiais e acompanhe os recebimentos via PIX instantâneo.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/dashboard/produtos"
              className="px-4 py-2.5 rounded-xl font-extrabold text-xs bg-white text-blue-700 hover:bg-slate-100 shadow-md flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" /> Cadastrar Produto
            </Link>
            <Link
              href={`/loja/${store?.slug || 'prof-ricardo'}`}
              target="_blank"
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-2 transition-all"
            >
              <ExternalLink className="w-4 h-4" /> Ver Loja Pública
            </Link>
          </div>
        </div>
      </div>

      {/* Gamification Onboarding Progress */}
      {chartTotalSalesCount === 0 && (
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="flex justify-between items-end mb-3">
            <div>
              <h3 className="font-black text-slate-900 text-lg">Sua Jornada Educalizando 🚀</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Complete os passos abaixo para destravar suas primeiras vendas.</p>
            </div>
            <span className="text-2xl font-black text-blue-600">50%</span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 w-1/2 rounded-full relative">
              <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress-bar-stripes_1s_linear_infinite]" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="text-xs font-bold text-emerald-600 flex flex-col items-center gap-1">
              <CheckCircle2 className="w-5 h-5" /> Criar Conta
            </div>
            <div className="text-xs font-bold text-emerald-600 flex flex-col items-center gap-1">
              <CheckCircle2 className="w-5 h-5" /> Configurar Loja
            </div>
            <div className="text-xs font-bold text-slate-400 flex flex-col items-center gap-1">
              <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center">3</div> Realizar Primeira Venda
            </div>
          </div>
        </div>
      )}

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel glass-panel-hover p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Produtos Publicados</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{publishedCount}</span>
            <span className="text-xs text-slate-500 block mt-0.5">de {products.length} cadastrados</span>
          </div>
        </div>

        <div className="glass-panel glass-panel-hover p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Vendas via PIX</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{chartTotalSalesCount}</span>
            <span className="text-xs text-emerald-600 font-semibold block mt-0.5">
              {chartTotalSalesCount > 0 ? 'Vendas confirmadas via PIX' : 'Aguardando primeiras vendas'}
            </span>
          </div>
        </div>

        <div className="glass-panel glass-panel-hover p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Receita Líquida</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">
              R$ {chartTotalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">Repasse automático sem mensalidade</span>
          </div>
        </div>

        <div className="glass-panel glass-panel-hover p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Taxa de Conversão</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-purple-700">
              {chartTotalSalesCount > 0 ? '4.8%' : '0.0%'}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">Visitas convertidas em compras</span>
          </div>
        </div>
      </div>

      {/* Interactive Sales Chart Component */}
      <SalesOverviewChart storeId={store?.id} onDataLoaded={handleChartDataLoaded} />

      {/* Top Products & Recent Sales Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        <TopProductsReport products={products} storeId={store?.id} />
        <RecentSalesFeed storeId={store?.id} />
      </div>

      {/* Quick Access Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-panel glass-panel-hover p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-600" /> Personalizar Identidade Visual
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Altere o nome da loja, a cor de destaque, foto de perfil e imagem de capa para destacar a sua marca.
          </p>
          <Link
            href="/dashboard/loja"
            className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            <span>Configurar Minha Loja</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="glass-panel glass-panel-hover p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" /> Cadastrar Apostilas & E-books
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Faça upload dos seus materiais didáticos em PDF, defina o preço de venda e publique para seus alunos.
          </p>
          <Link
            href="/dashboard/produtos"
            className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            <span>Gerenciar Meus Produtos</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

