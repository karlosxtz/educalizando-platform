export const revalidate = 60; // Atualiza a página estática a cada 60 segundos

import Link from 'next/link';
import type { Metadata } from 'next';
import { TrendingUp, BookOpen, Gift, Rocket, ChevronRight, Store as StoreIcon, Boxes, Calendar, CheckCircle2, Download, Lock, Headset, ShieldCheck, Users, Banknote, Sparkles, HeartHandshake } from 'lucide-react';
import { getAllPublicMarketplaceProducts, getTopMarketplaceStores } from '@/lib/store-service';
import { getActiveBanners } from '@/lib/banners-service';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import RecentlyViewed from '@/components/RecentlyViewed';
import MainBannersCarousel from '@/components/MainBannersCarousel';
import { getSchoolCalendarTagsForMonth, getUpcomingSchoolEvents } from '@/lib/school-calendar';
import PartnerStoresMarquee from '@/components/PartnerStoresMarquee';
import SearchBar from '@/components/SearchBar';

export const metadata: Metadata = {
  title: 'Materiais Didáticos Digitais para Professores | Educalizando',
  description: 'Encontre materiais didáticos digitais, atividades pedagógicas, apostilas, planos de aula e jogos educativos criados por professores. Compre com acesso imediato na Educalizando.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Materiais Didáticos Digitais para Professores | Educalizando',
    description: 'Atividades pedagógicas, apostilas, planos de aula e jogos educativos com acesso digital imediato.',
    url: '/',
  },
};

export default async function Home() {
  // Buscar dados no lado do servidor
  const allProducts = await getAllPublicMarketplaceProducts(100);
  const activeBanners = await getActiveBanners();
  
  // 2. Busca aumentada de parceiros (Para preencher o carrossel de bolinhas)
  const topStores = await getTopMarketplaceStores(12);

  // Filtrar as prateleiras
  const produtosEmAlta = allProducts.slice(0, 8);
  const produtosGratuitos = allProducts.filter(p => p.is_free === true || p.preco === 0).slice(0, 4);
  const produtosPLR = allProducts
    .filter(p => p.is_plr === true && Number(p.preco_plr || 0) > 0 && Boolean(p.has_plr_delivery))
    .slice(0, 4);
  const monthlyTags = getSchoolCalendarTagsForMonth();
  const upcomingEvents = getUpcomingSchoolEvents();
  const produtosSazonais = allProducts.filter((product) => product.seasonal_tags?.some((tag) => monthlyTags.includes(tag as typeof monthlyTags[number]))).slice(0, 4);
  const featuredOffers = allProducts
    .filter((product) => !product.is_free && Number(product.preco_original || 0) > Number(product.preco || 0))
    .sort((a, b) => {
      const aSeasonal = a.seasonal_tags?.some((tag) => monthlyTags.includes(tag as typeof monthlyTags[number])) ? 1 : 0;
      const bSeasonal = b.seasonal_tags?.some((tag) => monthlyTags.includes(tag as typeof monthlyTags[number])) ? 1 : 0;
      if (aSeasonal !== bSeasonal) return bSeasonal - aSeasonal;
      const day = new Date().toISOString().slice(0, 10);
      const rank = (value: string) => `${value}:${day}`.split('').reduce((total, character) => (total * 31 + character.charCodeAt(0)) % 10007, 7);
      return rank(a.id) - rank(b.id);
    })
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      <MarketplaceHeader />

      <main className="flex-1 pb-20">
        <h1 className="sr-only">Materiais didáticos digitais para professores e educadores</h1>

        <section className="mx-auto max-w-7xl px-4 pb-6 pt-6 sm:px-6 sm:pt-10 lg:px-8" aria-labelledby="home-proposta">
          <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5 shadow-sm sm:p-8">
            <div className="max-w-3xl">
              <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700">Educalizando</p>
              <h2 id="home-proposta" className="text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">Materiais didáticos prontos para ensinar melhor</h2>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600 sm:text-base">Encontre atividades, apostilas, jogos e recursos digitais criados para professores e educadores.</p>
              <div className="mt-5 max-w-2xl" aria-label="Buscar materiais didáticos"><SearchBar /></div>
              <Link href="/buscar" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Explorar materiais <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8" aria-labelledby="home-categorias">
          <div className="mb-3 flex items-center justify-between"><h2 id="home-categorias" className="text-lg font-black text-slate-900 sm:text-2xl">Encontre por categoria</h2><Link href="/buscar" className="text-sm font-bold text-blue-700">Ver todas</Link></div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {[['/buscar?categoria=alfabetizacao','Alfabetização'],['/buscar?categoria=educacao-infantil','Educação Infantil'],['/buscar?categoria=ensino-fundamental','Ensino Fundamental'],['/buscar?categoria=jogos','Jogos e atividades']].map(([href,label]) => <Link key={href} href={href} className="flex min-h-12 items-center rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600">{label}</Link>)}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8" aria-labelledby="home-destaques">
          <div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-blue-700">Para começar</p><h2 id="home-destaques" className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Em destaque</h2></div><Link href="/buscar?sort=popular" className="text-sm font-bold text-blue-700">Ver todos</Link></div>
          {produtosEmAlta.length > 0 ? <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">{produtosEmAlta.slice(0, 4).map((produto) => <ProductCard key={produto.id} product={produto} />)}</div> : <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Nenhum material publicado ainda.</div>}
        </section>
        
        {/* HERO BANNER CAROUSEL */}
        <MainBannersCarousel banners={activeBanners} />

        {/* CARROSSEL DE LOJAS EM MOVIMENTO (BOLINHAS) */}
        <section className="hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 border-b border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <StoreIcon className="w-6 h-6 text-blue-600" />
              Nossas Lojas Parceiras
            </h2>
            <Link href="/lojas" className="hidden sm:flex text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors items-center gap-1">
              Ver Todas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <PartnerStoresMarquee stores={topStores} />
        </section>

        <section className="hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-5 shadow-sm sm:p-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl"><Calendar className="h-7 w-7 text-blue-600" /> Prepare-se com antecedência</h2>
                <p className="mt-2 text-sm font-medium text-slate-600">Planeje suas aulas e encontre materiais para as próximas datas do calendário escolar.</p>
              </div>
              <Link href="/buscar" className="text-sm font-bold text-blue-700 hover:text-blue-900">Explorar todas as datas →</Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {upcomingEvents.map((event) => <Link key={`${event.tag}-${event.date.getFullYear()}`} href={`/buscar?data=${encodeURIComponent(event.tag)}`} className="rounded-2xl border border-white bg-white/85 p-4 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
                <p className="font-black text-slate-900">{event.tag}</p>
                <p className="mt-1 text-xs font-semibold text-blue-700">{event.daysUntil === 0 ? 'É hoje' : `em ${event.daysUntil} dias`} · {event.date.toLocaleDateString('pt-BR', { month: 'long' })}</p>
              </Link>)}
            </div>
          </div>
        </section>

        {/* 4. Prateleiras de Produtos (Grids) */}
        
        {/* Vistos Recentemente (Histórico Local) */}
        <RecentlyViewed />

        {false && featuredOffers.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="overflow-hidden rounded-[2rem] border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-rose-50 p-5 shadow-sm sm:p-8">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="mb-2 inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-orange-700"><Sparkles className="h-3.5 w-3.5" /> Seleção rotativa</p>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Oferta em Destaque</h2>
                  <p className="mt-2 max-w-2xl text-sm font-medium text-slate-600">Preços promocionais cadastrados pelos criadores, com prioridade para materiais das datas pedagógicas deste mês.</p>
                </div>
                <Link href="/ofertas" className="text-sm font-bold text-orange-700 hover:text-orange-900">Ver todas as ofertas →</Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
                {featuredOffers.slice(0, 4).map((produto) => <ProductCard key={produto.id} product={produto} />)}
              </div>
            </div>
          </section>
        )}

        {/* Seção 1: Em Alta */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-orange-500" />
              Em destaque na plataforma
            </h2>
            <Link href="/buscar?sort=popular" className="hidden sm:flex text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors items-center gap-1">
              Ver Todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {produtosEmAlta.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
              <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nenhum material publicado ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {produtosEmAlta.map(produto => (
                <ProductCard key={produto.id} product={produto} />
              ))}
            </div>
          )}
        </section>

        {/* Prateleira Temática (Especial do Mês) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-blue-50/50 border-y border-blue-100 mt-6 mb-12 rounded-[2.5rem]">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2 mb-2">
                <Calendar className="w-8 h-8 text-blue-600" />
                Especial do Mês
              </h2>
              <p className="text-slate-600 font-medium text-sm sm:text-base">
                Prepare suas aulas para as principais datas comemorativas
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {monthlyTags.map(tag => (
                <Link key={tag} href={`/buscar?data=${encodeURIComponent(tag)}`} className="px-4 py-1.5 bg-white border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white rounded-full text-xs font-bold transition-colors">
                  {tag}
                </Link>
              ))}
              <Link href={`/buscar?data=${encodeURIComponent(monthlyTags[0] || 'Volta às aulas')}`} className="ml-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">
                Ver Todos <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          
          {produtosSazonais.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nenhum material sazonal no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {produtosSazonais.map(produto => (
                <ProductCard key={produto.id} product={produto} />
              ))}
            </div>
          )}
        </section>

        {/* Seção 2: Gratuitos */}
        {produtosGratuitos.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-white border-y border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Gift className="w-8 h-8 text-emerald-500" />
                Materiais Gratuitos
              </h2>
              <Link href="/buscar?preco=gratis" className="hidden sm:flex text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors items-center gap-1">
                Ver Todos <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {produtosGratuitos.map(produto => (
                <ProductCard key={produto.id} product={produto} />
              ))}
            </div>
          </section>
        )}

        {/* Seção 3: Direitos de Revenda (PLR) */}
        {produtosPLR.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Rocket className="w-8 h-8 text-purple-600" />
                Licenças PLR (Direitos de Revenda)
              </h2>
              <Link href="/buscar?filter=plr" className="hidden sm:flex text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors items-center gap-1">
                Ver Todos <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {produtosPLR.map(produto => (
                <ProductCard key={produto.id} product={produto} purchaseMode="plr" />
              ))}
            </div>
          </section>
        )}

        {/* 5. Seção de Confiança & Recrutamento de Vendedores */}
        <section className="bg-white border-t border-slate-200/60 pt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Trust Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-16">
              <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-slate-50 border border-slate-100">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                  <Download className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">Entrega Imediata</h3>
                <p className="text-xs text-slate-500">Acesso instantâneo após a compra</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-slate-50 border border-slate-100">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">Download Ilimitado</h3>
                <p className="text-xs text-slate-500">Baixe quantas vezes precisar</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-slate-50 border border-slate-100">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">Pagamento Seguro</h3>
                <p className="text-xs text-slate-500">Ambiente criptografado e seguro</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-slate-50 border border-slate-100">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
                  <Headset className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">Suporte Dedicado</h3>
                <p className="text-xs text-slate-500">Estamos aqui para ajudar você</p>
              </div>
            </div>

            {/* Banner B2B (Recrutamento) */}
            <div className="bg-blue-600 rounded-[2.5rem] p-8 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden mb-16">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3"></div>
              
              <div className="relative z-10 lg:w-1/2 space-y-6 text-center lg:text-left">
                <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                  Transforme seu conhecimento em <span className="text-yellow-300">renda extra</span>
                </h2>
                <p className="text-blue-100 text-lg md:text-xl font-medium">
                  Crie sua loja, publique seus materiais didáticos e alcance educadores. Nós cuidamos da tecnologia para você.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link href="/cadastro/produtor" className="px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black rounded-full shadow-lg transition-transform hover:scale-105 w-full sm:w-auto text-center">
                    Criar Conta Grátis
                  </Link>
                </div>
              </div>

              <div className="relative z-10 grid grid-cols-2 gap-4 lg:w-5/12 w-full">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
                  <div className="text-3xl font-black text-white mb-1"><StoreIcon className="mx-auto h-8 w-8" /></div>
                  <div className="text-sm font-medium text-blue-200">Publique sua loja</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
                  <div className="text-3xl font-black text-white mb-1"><TrendingUp className="mx-auto h-8 w-8" /></div>
                  <div className="text-sm font-medium text-blue-200">Acompanhe suas vendas</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center col-span-2">
                  <div className="text-3xl font-black text-white mb-1 flex justify-center items-center gap-2">
                    <Users className="h-8 w-8" />
                  </div>
                  <div className="text-sm font-medium text-blue-200">Conecte-se a educadores</div>
                </div>
              </div>
            </div>
            
          </div>
        </section>

        {/* 6. Seção Institucional ("O que é o Educalizando?") */}
        <section className="bg-slate-50 py-20 border-t border-slate-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">O que é o Educalizando?</h2>
            <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto mb-16">
              Conectamos criadores de conteúdos a educadores que buscam praticidade e qualidade.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                  <BookOpen className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Materiais para Todas as Disciplinas</h3>
                <p className="text-slate-600 font-medium">De atividades de alfabetização a desafios matemáticos complexos. Tudo em um só lugar.</p>
              </div>
              
              <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-6">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Recursos para Educadores</h3>
                <p className="text-slate-600 font-medium">Planejamentos, sequências didáticas e painéis prontos para otimizar a sua rotina escolar.</p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Qualidade Garantida</h3>
                <p className="text-slate-600 font-medium">Os materiais são criados por especialistas e avaliados rigorosamente pela comunidade.</p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <Banknote className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Compra Segura e Rápida</h3>
                <p className="text-slate-600 font-medium">Pagamento via Pix processado na hora com liberação imediata do seu conteúdo.</p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <HeartHandshake className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Comunidade Ativa</h3>
                <p className="text-slate-600 font-medium">Foco na troca de experiências e crescimento contínuo entre educadores de todo o Brasil.</p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
                  <Headset className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Suporte Dedicado</h3>
                <p className="text-slate-600 font-medium">Atendimento humanizado e rápido para apoiar totalmente criadores e compradores na plataforma.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Programa de Afiliados */}
        <section className="bg-slate-50 text-slate-900 py-24 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">
              Tenha sua Própria Vitrine e Lucre como Afiliado
            </h2>
            <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto mb-16">
              Vá além dos links tradicionais. Crie a sua própria loja personalizada dentro do Educalizando e escolha os melhores materiais para indicar. As comissões são justas e definidas diretamente pelos autores.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
              <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <StoreIcon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Vitrine Personalizada</h3>
                <p className="text-slate-600 font-medium">
                  Organize e divulgue os materiais que você mais confia em uma página exclusiva com o seu nome.
                </p>
              </div>

              <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Comissões Atrativas</h3>
                <p className="text-slate-600 font-medium">
                  Selecione produtos com excelentes taxas de comissão no mercado, definidas diretamente por quem cria.
                </p>
              </div>

              <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                  <Banknote className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Gestão Descomplicada</h3>
                <p className="text-slate-600 font-medium">
                  Acompanhe seus cliques, conversões e solicite seus saques de forma transparente e rápida.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/cadastro" className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg transition-transform hover:scale-105 w-full sm:w-auto text-center">
                Criar Conta de Afiliado
              </Link>
              <Link href="/entrar" className="px-8 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-full transition-colors w-full sm:w-auto text-center">
                Já sou afiliado
              </Link>
            </div>
            
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
