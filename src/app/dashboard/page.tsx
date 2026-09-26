'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Store, Package, DollarSign, TrendingUp, Sparkles,
  ArrowRight, ExternalLink, Plus, CheckCircle2, Percent, Wallet,
  Landmark, ReceiptText, CircleDollarSign, CalendarDays, Lightbulb, Search, UsersRound
} from 'lucide-react';
import { getCurrentCreatorStore, getProductsByStoreId } from '@/lib/store-service';
import { calculateCreatorWallet, CreatorWalletSummary } from '@/lib/wallet-service';
import { motion } from 'framer-motion';
import { Store as StoreType, Product } from '@/lib/types';
import SalesOverviewChart from '@/components/dashboard/SalesOverviewChart';
import TopProductsReport from '@/components/dashboard/TopProductsReport';
import RecentSalesFeed from '@/components/dashboard/RecentSalesFeed';
import { getSalesDataByPeriod } from '@/lib/sales-service';
import { getUpcomingSchoolEvents } from '@/lib/school-calendar';

const emptyWallet: CreatorWalletSummary = {
  totalVendido: 0,
  saldoPendente: 0,
  saldoDisponivel: 0,
  totalRecebido: 0,
  taxasEducalizando: 0,
  taxasAsaas: 0,
  totalTaxas: 0,
};

const formatCurrency = (value: number) => `R$ ${Number(value || 0).toLocaleString('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

export default function DashboardOverviewPage() {
  const [store, setStore] = useState<StoreType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [wallet, setWallet] = useState<CreatorWalletSummary>(emptyWallet);
  const [chartTotalSalesCount, setChartTotalSalesCount] = useState<number>(0);
  const [chartConversionRate, setChartConversionRate] = useState<number>(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [monthSalesCount, setMonthSalesCount] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [popularTerms, setPopularTerms] = useState<Array<{ term: string; count: number }>>([]);

  useEffect(() => {
    async function loadData() {
      const s = await getCurrentCreatorStore();
      setStore(s);
      if (s) {
        const [prods, walletSummary, monthSales, referrals, searchInsights] = await Promise.all([
          getProductsByStoreId(s.id),
          calculateCreatorWallet(s.id),
          getSalesDataByPeriod(s.id, 'month'),
          fetch('/api/creator-referrals', { cache: 'no-store' }).then(response => response.ok ? response.json() : null).catch(() => null),
          fetch('/api/catalog-search-insights', { cache: 'no-store' }).then(response => response.ok ? response.json() : null).catch(() => null),
        ]);
        setProducts(prods);
        setWallet(walletSummary);
        setMonthRevenue(monthSales.chartData.reduce((total, point) => total + point.revenue, 0));
        setMonthSalesCount(monthSales.chartData.reduce((total, point) => total + point.salesCount, 0));
        setReferralCount(referrals?.referrals?.length || 0);
        setPopularTerms(searchInsights?.terms || []);
      }
    }
    loadData();
  }, []);

  const publishedCount = products.filter(p => p.status === 'publicado').length;
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const newMaterialsThisMonth = products.filter(product => new Date(product.created_at) >= monthStart).length;
  const upcomingEvents = getUpcomingSchoolEvents(new Date(), 3);
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date());

  const handleChartDataLoaded = useCallback((_rev: number, count: number, conversionRate: number) => {
    setChartTotalSalesCount(count);
    setChartConversionRate(conversionRate);
  }, []);

  const netGenerated = Math.max(0, wallet.totalVendido - wallet.totalTaxas);
  const financialDistributionTotal = wallet.saldoDisponivel + wallet.totalRecebido + wallet.saldoPendente;
  const financialDistribution = [
    { label: 'Disponível para saque', value: wallet.saldoDisponivel, className: 'bg-emerald-500' },
    { label: 'Já recebido', value: wallet.totalRecebido, className: 'bg-blue-500' },
    { label: 'Em processamento', value: wallet.saldoPendente, className: 'bg-amber-400' },
  ];

  return (
    <div className="space-y-8 bg-slate-50 min-h-screen p-4 sm:p-8 -m-4 sm:-m-8">
      <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-[1.05fr_1fr_1fr_1fr]">
        <article className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-6 shadow-sm"><div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-lime-200/60 blur-2xl" /><div className="relative"><div className="flex items-center gap-2 text-emerald-800"><CalendarDays className="h-5 w-5" /><p className="font-black">Ritmo da sua loja</p></div><p className="mt-3 text-sm text-slate-600">Acompanhe seus resultados em <span className="font-black capitalize text-slate-900">{monthLabel}</span>.</p><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white/85 p-3"><p className="text-xs font-semibold text-slate-500">Vendas do mês</p><p className="mt-1 text-xl font-black text-slate-950">{monthSalesCount}</p><p className="text-xs text-emerald-700">{formatCurrency(monthRevenue)}</p></div><div className="rounded-2xl bg-white/85 p-3"><p className="text-xs font-semibold text-slate-500">Materiais novos</p><p className="mt-1 text-xl font-black text-slate-950">{newMaterialsThisMonth}</p><p className="text-xs text-slate-500">{publishedCount} publicados</p></div></div><Link href="/dashboard/produtos/novo" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-emerald-800 hover:text-emerald-950">Criar material agora <ArrowRight className="h-4 w-4" /></Link></div></article>
        <article className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sky-800"><Search className="h-5 w-5" /><p className="font-black">Próximas oportunidades</p></div><Lightbulb className="h-5 w-5 text-amber-500" /></div><p className="mt-3 text-sm text-slate-600">Datas pedagógicas para planejar antes da procura aumentar.</p><div className="mt-4 space-y-2.5">{upcomingEvents.map(event => { const hasMaterial = products.some(product => product.status === 'publicado' && product.seasonal_tags?.includes(event.tag)); return <div key={event.tag} className="flex items-center justify-between gap-3 rounded-2xl bg-sky-50/70 p-3"><div className="min-w-0"><p className="truncate text-sm font-black text-slate-900">{event.tag}</p><p className="text-xs text-slate-500">{event.daysUntil === 0 ? 'É hoje' : `Faltam ${event.daysUntil} dias`}</p></div>{hasMaterial ? <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700">Você já tem</span> : <Link href={`/dashboard/produtos/novo?tema=${encodeURIComponent(event.tag)}`} className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-800 transition hover:bg-amber-200">Criar material</Link>}</div>; })}</div></article>
        <article className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-violet-800"><TrendingUp className="h-5 w-5" /><p className="font-black">Mais procurados</p></div><span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-black text-violet-700">últimos 7 dias</span></div><p className="mt-3 text-sm text-slate-600">Termos buscados de verdade no catálogo da plataforma.</p><div className="mt-4 space-y-2">{popularTerms.length ? popularTerms.map((item, index) => <Link key={item.term} href={`/dashboard/produtos/novo?titulo=${encodeURIComponent(item.term)}`} className="group flex items-center justify-between rounded-xl px-2 py-1.5 transition hover:bg-violet-50"><span className="flex min-w-0 items-center gap-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-black text-violet-700">{index + 1}</span><span className="truncate text-sm font-bold text-slate-800">{item.term}</span></span><span className="text-[10px] font-bold text-slate-400">{item.count} busca{item.count === 1 ? '' : 's'}</span></Link>) : <div className="rounded-2xl bg-violet-50/70 p-4 text-sm leading-6 text-slate-600">Ainda não há buscas suficientes para formar um ranking. Ele aparecerá automaticamente conforme visitantes pesquisarem no catálogo.</div>}</div></article>
        <article className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-6 shadow-sm"><div className="flex items-center gap-2 text-violet-800"><UsersRound className="h-5 w-5" /><p className="font-black">Comunidade e crescimento</p></div><p className="mt-3 text-sm text-slate-600">Ações rápidas para expandir sua loja hoje.</p><div className="mt-5 space-y-3"><Link href="/dashboard/indicacoes" className="group flex items-center justify-between rounded-2xl border border-violet-100 bg-white/80 p-3.5 transition hover:border-violet-300 hover:shadow-sm"><div><p className="text-sm font-black text-slate-900">{referralCount} indicação{referralCount === 1 ? '' : 'ões'} ativa{referralCount === 1 ? '' : 's'}</p><p className="mt-0.5 text-xs text-slate-500">Compartilhe seu link e acompanhe bônus.</p></div><ArrowRight className="h-4 w-4 text-violet-600 transition group-hover:translate-x-0.5" /></Link><Link href={`/loja/${store?.slug || 'prof-ricardo'}`} target="_blank" className="group flex items-center justify-between rounded-2xl border border-sky-100 bg-white/80 p-3.5 transition hover:border-sky-300 hover:shadow-sm"><div><p className="text-sm font-black text-slate-900">Sua vitrine pública</p><p className="mt-0.5 text-xs text-slate-500">Confira como seus materiais aparecem.</p></div><ExternalLink className="h-4 w-4 text-sky-600" /></Link></div></article>
      </section>

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
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Vendas brutas</span>
            <div className="p-2.5 rounded-full bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{formatCurrency(wallet.totalVendido)}</span>
            <span className="text-xs font-medium text-emerald-600 block mt-1">Somente pedidos confirmados</span>
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
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Disponível para saque</span>
            <div className="p-2.5 rounded-full bg-indigo-50 text-indigo-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">
              {formatCurrency(wallet.saldoDisponivel)}
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-medium text-slate-400">Valor líquido liberado</span>
              <Link href="/dashboard/financeiro" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1">
                Ver carteira <ArrowRight className="w-3 h-3"/>
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
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Já recebido</span>
            <div className="p-2.5 rounded-full bg-purple-50 text-purple-600">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">
              {formatCurrency(wallet.totalRecebido)}
            </span>
            <span className="text-xs font-medium text-slate-400 block mt-1">Saques concluídos para você</span>
          </div>
        </motion.div>
      </div>

      {/* Financial snapshot - all values originate from paid orders, wallet ledger and completed withdrawals */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-600">
              <CircleDollarSign className="h-4 w-4" /> Resumo financeiro real
            </div>
            <h2 className="mt-2 text-xl font-black text-slate-900">Entenda o dinheiro da sua loja</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Os valores consideram pedidos confirmados, taxas registradas, saldo da carteira e saques concluídos.
            </p>
          </div>
          <Link href="/dashboard/financeiro" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-slate-700">
            Abrir financeiro <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700"><DollarSign className="h-4 w-4" /> Receita bruta</div>
            <p className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(wallet.totalVendido)}</p>
            <p className="mt-1 text-xs text-slate-500">Total dos pagamentos aprovados</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-700"><ReceiptText className="h-4 w-4" /> Taxas aplicadas</div>
            <p className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(wallet.totalTaxas)}</p>
            <p className="mt-1 text-xs text-slate-500">Educalizando + meio de pagamento</p>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-violet-700"><TrendingUp className="h-4 w-4" /> Receita líquida gerada</div>
            <p className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(netGenerated)}</p>
            <p className="mt-1 text-xs text-slate-500">Bruto menos as taxas aplicadas</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700"><Percent className="h-4 w-4" /> Em processamento</div>
            <p className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(wallet.saldoPendente)}</p>
            <p className="mt-1 text-xs text-slate-500">Pedidos aguardando confirmação</p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900">Distribuição do seu saldo líquido</h3>
                <p className="mt-1 text-xs text-slate-500">Acompanhe o que pode sacar, o que já foi pago e o que ainda está em processamento.</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">{formatCurrency(financialDistributionTotal)}</span>
            </div>
            <div className="mt-5 space-y-4">
              {financialDistribution.map((item) => {
                const percentage = financialDistributionTotal > 0 ? (item.value / financialDistributionTotal) * 100 : 0;
                return (
                  <div key={item.label}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold text-slate-600">{item.label}</span>
                      <span className="font-black text-slate-800">{formatCurrency(item.value)}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                      <div className={`h-full rounded-full transition-all ${item.className}`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-indigo-50 to-white p-5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-600"><TrendingUp className="h-4 w-4" /> Indicadores do período</div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-black text-slate-900">{chartTotalSalesCount}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">Vendas no período selecionado</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{chartConversionRate.toFixed(1)}%</p>
                <p className="mt-1 text-xs font-medium text-slate-500">Conversão de visitas</p>
              </div>
            </div>
            <p className="mt-5 border-t border-indigo-100 pt-4 text-xs leading-relaxed text-slate-600">
              Use o gráfico abaixo para comparar receita bruta e quantidade de vendas em 7, 30 dias, mês ou ano.
            </p>
          </div>
        </div>
      </section>

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
