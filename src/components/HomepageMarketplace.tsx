import FeaturedMonthlyCampaign from '@/components/FeaturedMonthlyCampaign';
import MainBannersCarousel from '@/components/MainBannersCarousel';
import MarketplaceKitCard from '@/components/MarketplaceKitCard';
import MonthlyCampaignCarousel from '@/components/MonthlyCampaignCarousel';
import ProductCard from '@/components/ProductCard';
import RecentlyViewed from '@/components/RecentlyViewed';
import UpcomingCalendarDates from '@/components/UpcomingCalendarDates';
import type { MainBanner } from '@/lib/banners-service';
import type { MarketplaceKit } from '@/lib/marketplace-kit-service';
import type { Product,Store as StoreData } from '@/lib/types';
import { CalendarDays,ChevronRight,Gift,ImageIcon,Rocket,Sparkles,Store } from 'lucide-react';
import Link from 'next/link';

type MarketplaceProduct = Product & { store?: StoreData };

const categories = [
  { href: '/atividades-alfabetizacao', label: 'Alfabetização', icon: '🔤' },
  { href: '/educacao-infantil', label: 'Educação infantil', icon: '🎨' },
  { href: '/atividades-ensino-fundamental', label: 'Ensino fundamental', icon: '📚' },
  { href: '/jogos-pedagogicos', label: 'Jogos pedagógicos', icon: '🧩' },
];

const calendarThemeIcons: Record<string, string> = {
  'Semana da Pátria': '🇧🇷',
  'Independência do Brasil': '🏛️',
  'Dia da Árvore': '🌳',
  'Primavera': '🌸',
  'Dia do Trânsito': '🚦',
  'Meio Ambiente': '🌿',
  'Festa Junina': '🎉',
  'Dia das Crianças': '🎈',
  'Dia dos Professores': '🍎',
  'Natal': '🎄',
};

export default function HomepageMarketplace({
  banners,
  products,
  stores,
  kits,
  monthlyTags,
}: {
  banners: MainBanner[];
  products: MarketplaceProduct[];
  stores: StoreData[];
  kits: MarketplaceKit[];
  monthlyTags: readonly string[];
}) {
  const featured = products.slice(0, 4);
  const freeProducts = products.filter((product) => product.is_free || Number(product.preco) === 0).slice(0, 4);
  const plrProducts = products.filter((product) => product.is_plr && Number(product.preco_plr || 0) > 0 && product.has_plr_delivery).slice(0, 4);
  const offers = products.filter((product) => !product.is_free && Number(product.preco_original || 0) > Number(product.preco || 0)).slice(0, 4);

  return (
    <main className="flex flex-col flex-1 pb-16 sm:pb-20">
      <h1 className="sr-only">Materiais didáticos digitais para professores e educadores</h1>

      <section className="order-11 border-b border-violet-100 bg-[radial-gradient(circle_at_90%_0%,#e0e7ff_0,transparent_34%),linear-gradient(130deg,#f8fafc_10%,#f5f3ff_58%,#ecfeff)]" aria-labelledby="home-proposta">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-9 sm:px-6 sm:py-14 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-10 lg:px-10 lg:py-20">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3 py-1.5 text-xs font-black uppercase tracking-[.15em] text-violet-700 shadow-sm"><Sparkles className="h-3.5 w-3.5" /> Marketplace educacional</p>
            <h2 id="home-proposta" className="mt-5 text-3xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-5xl">Materiais didáticos prontos para ensinar melhor.</h2>
            <p className="mt-4 max-w-xl text-base font-medium leading-7 text-slate-600 sm:text-lg">Encontre atividades, apostilas, jogos e recursos digitais para apoiar o planejamento da sua aula.</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href="/buscar" className="inline-flex min-h-12 items-center justify-center gap-1 rounded-full bg-violet-700 px-6 text-sm font-black text-white shadow-lg shadow-violet-700/20 transition hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700">Explorar materiais <ChevronRight className="h-4 w-4" /></Link>
              <Link href="/lojas" className="inline-flex min-h-12 items-center justify-center gap-1 rounded-full border border-violet-200 bg-white px-6 text-sm font-black text-violet-800 transition hover:border-violet-400 hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700">Conhecer as lojas</Link>
            </div>
          </div>
          <div className="relative min-h-64 overflow-hidden rounded-[2rem] border border-violet-200 bg-violet-800 p-6 text-white shadow-xl shadow-violet-950/15 sm:min-h-80 sm:p-9">
            <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-fuchsia-400/40 blur-2xl" />
            <div className="absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-cyan-300/30 blur-2xl" />
            <div className="relative flex h-full flex-col justify-between">
              <div><span className="inline-flex rounded-full bg-lime-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-violet-950">Para o seu planejamento</span><h3 className="mt-4 max-w-sm text-2xl font-black leading-tight sm:text-3xl">Descubra recursos para cada etapa da sua aula.</h3></div>
              <div className="grid grid-cols-2 gap-3 text-sm font-bold"><Link href="/materiais-gratis" className="rounded-2xl bg-white/15 p-4 backdrop-blur-sm transition hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-white"><Gift className="mb-2 h-5 w-5 text-lime-200" />Materiais gratuitos</Link><Link href="/buscar?filter=plr" className="rounded-2xl bg-white/15 p-4 backdrop-blur-sm transition hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-white"><Rocket className="mb-2 h-5 w-5 text-lime-200" />Revenda autorizada</Link></div>
            </div>
          </div>
        </div>
      </section>

      <section className="order-4 mx-auto w-full max-w-[1600px] px-3 py-7 sm:px-6 sm:py-12 lg:px-10" aria-labelledby="home-categorias">
        <div className="mb-3 flex items-end justify-between gap-4 sm:mb-4"><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-blue-700 sm:text-xs">Explore do seu jeito</p><h2 id="home-categorias" className="mt-1 text-xl font-black text-slate-950 sm:text-3xl">Categorias para começar</h2></div><Link href="/buscar" className="shrink-0 text-xs font-black text-blue-700 hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 sm:text-sm">Ver todas</Link></div>
        <div className="marketplace-horizontal-scroll flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:pb-0 lg:grid-cols-4">{categories.map((category) => <Link key={category.href} href={category.href} className="group flex min-h-16 w-[165px] shrink-0 snap-start items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 sm:min-h-24 sm:w-auto sm:flex-col sm:items-start sm:justify-between sm:rounded-2xl sm:p-4"><span className="text-lg sm:text-xl" aria-hidden="true">{category.icon}</span><span className="text-xs font-black text-slate-800 group-hover:text-blue-700 sm:text-sm">{category.label}</span></Link>)}</div>
      </section>

      <section className="order-12 mx-auto w-full max-w-[1440px] px-4 pb-6 sm:px-6 sm:pb-10 lg:px-10" aria-label="Banners e campanhas disponíveis">{banners.length > 0 ? <div className="overflow-hidden rounded-[2rem] border border-violet-100 shadow-sm"><MainBannersCarousel banners={banners} /></div> : <div className="rounded-[2rem] border border-violet-100 bg-violet-50 p-6 sm:p-8"><div className="flex items-start gap-4"><ImageIcon className="mt-0.5 h-6 w-6 shrink-0 text-violet-700" /><div><h2 className="text-xl font-black text-slate-950">Encontre o material ideal para sua próxima aula</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Navegue pelas categorias, descubra materiais gratuitos e veja as vitrines de criadores disponíveis.</p><Link href="/buscar" className="mt-4 inline-flex text-sm font-black text-violet-700 hover:text-violet-900">Ir para o catálogo <ChevronRight className="h-4 w-4" /></Link></div></div></div>}</section>

      <FeaturedMonthlyCampaign products={products} initialTags={monthlyTags} />

      <MonthlyCampaignCarousel tags={monthlyTags} orderClass="order-13" />

      <UpcomingCalendarDates products={products} orderClass="order-14" />

      <Shelf priority title="Materiais em destaque" description="Uma seleção dos materiais publicados no catálogo." href="/buscar?sort=popular" products={featured} />
      {kits.length > 0 && <section className="order-3 mx-auto w-full max-w-[1440px] px-4 py-9 sm:px-6 sm:py-12 lg:px-10" aria-labelledby="home-combos"><div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.14em] text-violet-700">Pacotes completos</p><h2 id="home-combos" className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">Combos para aproveitar mais</h2><p className="mt-1 text-sm text-slate-600">Materiais finais organizados em um único pedido, com acesso individual a cada arquivo.</p></div><Link href="/buscar?categoria=combo" className="shrink-0 text-sm font-black text-violet-700 hover:underline">Ver todos</Link></div><div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{kits.slice(0, 4).map(kit => <MarketplaceKitCard key={kit.id} kit={kit} />)}</div></section>}

      <section className="order-9 mx-auto w-full max-w-[1440px] px-4 py-9 sm:px-6 sm:py-12 lg:px-10" aria-labelledby="home-calendario">
        <div className="home-calendar-panel relative isolate overflow-hidden rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-indigo-950 via-violet-900 to-fuchsia-800 p-5 text-white shadow-xl shadow-violet-950/20 sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-fuchsia-300/25 blur-3xl" />
            <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" />
            <span className="home-calendar-float absolute right-[8%] top-8 text-5xl drop-shadow-lg sm:text-6xl">{calendarThemeIcons[monthlyTags[2]] || '✨'}</span>
            <span className="home-calendar-float-delayed absolute bottom-9 right-[22%] text-3xl opacity-80 sm:text-4xl">{calendarThemeIcons[monthlyTags[4]] || '🌟'}</span>
            <span className="home-calendar-sparkle absolute right-[4%] top-1/2 text-2xl text-yellow-200">✦</span>
            <span className="home-calendar-sparkle-delayed absolute left-[54%] top-7 text-xl text-fuchsia-200">✧</span>
          </div>

          <div className="relative">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-xl">
                <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[.14em] text-fuchsia-100 backdrop-blur-sm"><CalendarDays className="h-4 w-4" /> Planejamento do mês</p>
                <h2 id="home-calendario" className="mt-3 text-2xl font-black sm:text-3xl">Temas para o calendário escolar</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100">Use as datas e temas já cadastrados para encontrar recursos alinhados ao seu planejamento.</p>
              </div>
              <Link href="/calendario" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-white px-5 text-sm font-black text-indigo-900 shadow-lg shadow-indigo-950/20 transition hover:-translate-y-0.5 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Ver calendário</Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 pb-2" aria-label="Temas do calendário do mês">
              {monthlyTags.map((tag, index) => <Link key={tag} href={`/buscar?data=${encodeURIComponent(tag)}`} className="group inline-flex min-h-12 shrink-0 snap-start items-center rounded-2xl border border-white/20 bg-white/10 px-3.5 text-sm font-bold text-white shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                <span aria-hidden="true" className={`mr-2 inline-flex h-7 w-7 items-center justify-center rounded-xl bg-white/15 text-base transition-transform group-hover:scale-110 ${index % 2 === 0 ? 'home-calendar-chip-icon' : ''}`}>{calendarThemeIcons[tag] || '✨'}</span>{tag}
              </Link>)}
            </div>
          </div>
        </div>
      </section>

      {offers.length > 0 && <Shelf orderClass="order-5" title="Ofertas cadastradas" description="Materiais com preço promocional informado pelos criadores." href="/ofertas" products={offers} accent="orange" />}
      {freeProducts.length > 0 && <Shelf orderClass="order-6" title="Materiais gratuitos" description="Recursos disponíveis para você conhecer a plataforma." href="/materiais-gratis" products={freeProducts} accent="emerald" />}
      {plrProducts.length > 0 && <Shelf orderClass="order-8" title="Licenças de revenda" description="Materiais com modalidade PLR e entrega configurada." href="/buscar?filter=plr" products={plrProducts} accent="violet" purchaseMode="plr" />}

      <div className="order-15"><RecentlyViewed /></div>

      <section className="order-7 border-y border-slate-200 bg-white py-10" aria-labelledby="home-lojas">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0"><p className="text-xs font-black uppercase tracking-[.14em] text-blue-700">Vitrines criadoras</p><h2 id="home-lojas" className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">Conheça as lojas da plataforma</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Explore os materiais de todos os criadores da Educalizando.</p></div>
            <Link href="/lojas" className="inline-flex min-h-11 shrink-0 items-center text-sm font-black text-blue-700 hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Ver lojas <ChevronRight className="h-4 w-4" /></Link>
          </div>
        </div>
        {stores.length ? <div className="marketplace-store-rail relative mt-6 overflow-hidden py-1">
          <div className="marketplace-store-track flex w-max">
            {[0, 1].map((copy) => <div key={copy} className={`flex shrink-0 gap-3 pr-3 ${copy === 1 ? 'marketplace-store-copy' : ''}`} aria-hidden={copy === 1 || undefined}>
              {stores.map((store) => <Link href={`/loja/${store.slug}`} key={`${copy}-${store.id}`} tabIndex={copy === 1 ? -1 : undefined} className="flex min-h-20 w-[245px] shrink-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 sm:w-[285px] sm:p-4">
                {store.logo_url ? <img src={store.logo_url} alt="" className="h-12 w-12 shrink-0 rounded-full border border-slate-100 object-cover" /> : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-black text-blue-700">{store.nome_loja?.charAt(0).toUpperCase() || 'L'}</span>}
                <span className="min-w-0"><span className="block truncate text-sm font-black text-slate-900">{store.nome_loja}</span><span className="mt-1 flex items-center text-xs font-semibold text-slate-500"><Store className="mr-1 h-3.5 w-3.5" />Visitar vitrine</span></span>
              </Link>)}
            </div>)}
          </div>
        </div> : <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8"><div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">As vitrines disponíveis aparecerão aqui. <Link href="/lojas" className="font-black text-blue-700">Ver página de lojas</Link></div></div>}
      </section>

      <section className="order-10 mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10"><div className="rounded-[2rem] bg-slate-950 p-7 text-white shadow-xl sm:p-10"><div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="text-xs font-black uppercase tracking-[.14em] text-lime-300">Para quem cria</p><h2 className="mt-2 text-2xl font-black sm:text-4xl">Publique seus materiais em uma vitrine própria.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Crie uma loja, organize seus conteúdos e disponibilize materiais para educadores pela plataforma.</p></div><Link href="/cadastro/produtor" className="inline-flex min-h-12 items-center justify-center rounded-full bg-lime-300 px-6 text-sm font-black text-slate-950 hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Quero vender <ChevronRight className="ml-1 h-4 w-4" /></Link></div></div></section>
    </main>
  );
}

function Shelf({ title, description, href, products, accent = 'violet', purchaseMode, priority = false, orderClass }: { title: string; description: string; href: string; products: MarketplaceProduct[]; accent?: 'violet' | 'orange' | 'emerald'; purchaseMode?: 'plr'; priority?: boolean; orderClass?: string }) {
  if (!products.length) return null;
  const accentClass = accent === 'orange' ? 'text-orange-700' : accent === 'emerald' ? 'text-emerald-700' : 'text-violet-700';
  return <section className={`${priority ? 'order-3 ' : ''}${orderClass || ''} mx-auto w-full max-w-[1440px] px-3 py-7 sm:px-6 sm:py-12 lg:px-10`}><div className="mb-4 flex items-end justify-between gap-3 sm:mb-6 sm:gap-4"><div className="min-w-0"><p className={`text-[10px] font-black uppercase tracking-[.14em] sm:text-xs ${accentClass}`}>Catálogo Educalizando</p><h2 className="mt-1 text-xl font-black leading-tight text-slate-950 sm:text-3xl">{title}</h2><p className="mt-1 max-w-[240px] text-xs leading-5 text-slate-600 sm:max-w-none sm:text-sm">{description}</p></div><Link href={href} className={`shrink-0 pb-0.5 text-xs font-black sm:text-sm ${accentClass} hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700`}>Ver todos</Link></div><div className="grid grid-cols-2 gap-2.5 sm:gap-6 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} purchaseMode={purchaseMode} />)}</div></section>;
}
