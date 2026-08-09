'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Store, Package, DollarSign, TrendingUp, Sparkles, 
  ArrowRight, ExternalLink, Plus, CheckCircle2, ShoppingBag, Percent
} from 'lucide-react';
import { getStoreByCreatorId, getProductsByStoreId } from '@/lib/store-service';
import { Store as StoreType, Product } from '@/lib/types';
import SalesOverviewChart from '@/components/dashboard/SalesOverviewChart';
import TopProductsReport from '@/components/dashboard/TopProductsReport';
import RecentSalesFeed from '@/components/dashboard/RecentSalesFeed';

export default function DashboardOverviewPage() {
  const [store, setStore] = useState<StoreType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [chartTotalRevenue, setChartTotalRevenue] = useState<number>(3517.50);
  const [chartTotalSalesCount, setChartTotalSalesCount] = useState<number>(98);

  useEffect(() => {
    async function loadData() {
      const s = await getStoreByCreatorId('creator-ricardo');
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
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full border border-white/20">
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

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
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

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Vendas via PIX</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{chartTotalSalesCount}</span>
            <span className="text-xs text-emerald-600 font-semibold block mt-0.5">+14.2% em relação ao período anterior</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
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

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Taxa de Conversão</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-purple-700">4.8%</span>
            <span className="text-xs text-slate-500 block mt-0.5">Visitas convertidas em compras</span>
          </div>
        </div>
      </div>

      {/* Interactive Sales Chart Component */}
      <SalesOverviewChart onDataLoaded={handleChartDataLoaded} />

      {/* Top Products & Recent Sales Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        <TopProductsReport products={products} />
        <RecentSalesFeed />
      </div>

      {/* Quick Access Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
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

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
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

