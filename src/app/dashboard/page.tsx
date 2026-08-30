'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Store, Package, DollarSign, TrendingUp, Sparkles, 
  ArrowRight, ExternalLink, Plus, CheckCircle2, ShoppingBag, Percent
} from 'lucide-react';
import { getCurrentCreatorStore, getProductsByStoreId } from '@/lib/store-service';
import { motion } from 'framer-motion';
import { Store as StoreType, Product } from '@/lib/types';
import SalesOverviewChart from '@/components/dashboard/SalesOverviewChart';
import TopProductsReport from '@/components/dashboard/TopProductsReport';
import RecentSalesFeed from '@/components/dashboard/RecentSalesFeed';
import OnboardingTour from '@/components/dashboard/OnboardingTour';

export default function DashboardOverviewPage() {
  const [store, setStore] = useState<StoreType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [chartTotalRevenue, setChartTotalRevenue] = useState<number>(0);
  const [chartTotalSalesCount, setChartTotalSalesCount] = useState<number>(0);
  const [chartConversionRate, setChartConversionRate] = useState<number>(0);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    async function loadData() {
      const s = await getCurrentCreatorStore();
      setStore(s);
      if (s) {
        const prods = await getProductsByStoreId(s.id);
        setProducts(prods);
      }
    }
    loadData();

    // Check if it's the user's first visit
    const hasSeenOnboarding = localStorage.getItem('educalizando_onboarding_completed');
    if (!hasSeenOnboarding) {
      setIsFirstVisit(true);
    }
  }, []);

  const publishedCount = products.filter(p => p.status === 'publicado').length;

  const handleChartDataLoaded = (rev: number, count: number, conversionRate: number) => {
    setChartTotalRevenue(rev);
    setChartTotalSalesCount(count);
    setChartConversionRate(conversionRate);
  };

  return (
    <div className="space-y-8 bg-slate-50 min-h-screen p-4 sm:p-8 -m-4 sm:-m-8">
      <OnboardingTour />
      {/* Mural Pedagógico Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-yellow-300" /> Foco Pedagógico & Engajamento
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Dica da Semana: BNCC e Ludicidade
            </h1>
            <p className="text-base text-blue-100 leading-relaxed font-medium">
              Alinhamento de atividades lúdicas com as competências da Base. Utilize o nosso <strong>gerador de IA</strong> para transformar rascunhos de temas sazonais em descrições de alta conversão para outros professores.
            </p>

            <div className="pt-4 flex flex-wrap gap-3">
              <Link
                href="/dashboard/produtos"
                className="px-5 py-3 rounded-xl font-extrabold text-xs bg-white text-blue-600 hover:bg-blue-50 shadow-lg flex items-center gap-2 transition-all animate-pulse"
              >
                <Plus className="w-4 h-4" /> Cadastrar Novo Material
              </Link>
              <Link
                href="/dashboard/ia"
                className="px-5 py-3 rounded-xl font-bold text-xs bg-black/20 hover:bg-black/30 text-white backdrop-blur-sm flex items-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4" /> Gerador de Campanhas
              </Link>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center justify-center bg-white/10 p-6 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner min-w-[200px]">
             <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-200 mb-2">Loja Pública</p>
                <Link
                  href={`/loja/${store?.slug || 'prof-ricardo'}`}
                  target="_blank"
                  className="px-4 py-2 bg-white text-indigo-600 text-xs font-bold rounded-lg hover:bg-blue-50 transition-colors inline-flex items-center gap-1.5 shadow-sm"
                >
                  Visualizar <ExternalLink className="w-3.5 h-3.5" />
                </Link>
             </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Group Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center shrink-0 shadow-sm">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.333.158 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.332 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-extrabold text-blue-900 text-sm">Entre no grupo de vendedores no WhatsApp</h3>
            <p className="text-xs text-blue-700 font-medium mt-0.5">Dicas de marketing, novidades, vídeos como utilizar a plataforma...</p>
          </div>
        </div>
        <Link 
          href="https://chat.whatsapp.com/C7Yz19yfFh6CWu12DmZyJx"
          target="_blank"
          className="shrink-0 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center"
        >
          Entrar
        </Link>
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
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col justify-between cursor-pointer shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Produtos</span>
            <div className="p-2.5 rounded-full bg-blue-50 text-blue-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{publishedCount}</span>
            <span className="text-xs font-medium text-slate-400 block mt-1">de {products.length} cadastrados na loja</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col justify-between cursor-pointer shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Vendas via PIX</span>
            <div className="p-2.5 rounded-full bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{chartTotalSalesCount}</span>
            <span className="text-xs font-medium text-emerald-600 block mt-1">
              {chartTotalSalesCount > 0 ? 'Vendas confirmadas via PIX' : 'Aguardando primeiras vendas'}
            </span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col justify-between cursor-pointer shadow-sm hover:shadow-md transition-all relative group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Receita Líquida</span>
            <div className="p-2.5 rounded-full bg-indigo-50 text-indigo-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">
              R$ {chartTotalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-medium text-slate-400">Repasse sem mensalidade</span>
              <Link href="/dashboard/financeiro" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1">
                Sacar <ArrowRight className="w-3 h-3"/>
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col justify-between cursor-pointer shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Conversão</span>
            <div className="p-2.5 rounded-full bg-purple-50 text-purple-600">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">
              {chartTotalSalesCount > 0 ? `${chartConversionRate.toFixed(1)}%` : '0.0%'}
            </span>
            <span className="text-xs font-medium text-slate-400 block mt-1">Visitas convertidas em compras</span>
          </div>
        </motion.div>
      </div>

      {/* Interactive Sales Chart Component */}
      <SalesOverviewChart storeId={store?.id} onDataLoaded={handleChartDataLoaded} />

      {/* Top Products & Recent Sales Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        <TopProductsReport products={products} storeId={store?.id} />
        <RecentSalesFeed storeId={store?.id} />
      </div>

      {/* Quick Access Cards */}
      <div className="grid md:grid-cols-3 gap-6">
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

        <div className="glass-panel glass-panel-hover p-6 space-y-4 border-purple-100 bg-gradient-to-br from-white to-purple-50/30">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" /> Gerador de Campanhas por IA
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Crie títulos magnéticos, posts de WhatsApp e enquetes para seus materiais usando o Google Gemini.
          </p>
          <Link
            href="/dashboard/ia"
            className="inline-flex items-center gap-2 text-xs font-bold text-purple-600 hover:text-purple-700"
          >
            <span>Criar Campanha Inteligente</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

