import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays, ChevronRight, Gift, ImageIcon, Rocket, Sparkles, Store } from 'lucide-react';
import type { MainBanner } from '@/lib/banners-service';
import type { Product, Store as StoreData } from '@/lib/types';
import MainBannersCarousel from '@/components/MainBannersCarousel';
import MonthlyCampaignCarousel from '@/components/MonthlyCampaignCarousel';
import ProductCard from '@/components/ProductCard';
import RecentlyViewed from '@/components/RecentlyViewed';
import SearchBar from '@/components/SearchBar';
import { getSchoolCalendarArtworkForTag, getSchoolCalendarMonthArtwork, SCHOOL_CALENDAR_EVENTS } from '@/lib/school-calendar';

type MarketplaceProduct = Product & { store?: StoreData };

const categories = [
  { href: '/buscar?categoria=alfabetizacao', label: 'Alfabetização', icon: '🔤' },
  { href: '/buscar?categoria=educacao-infantil', label: 'Educação infantil', icon: '🎨' },
  { href: '/buscar?categoria=ensino-fundamental', label: 'Ensino fundamental', icon: '📚' },
  { href: '/buscar?categoria=jogos', label: 'Jogos e atividades', icon: '🧩' },
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
  monthlyTags,
}: {
  banners: MainBanner[];
  products: MarketplaceProduct[];
  stores: StoreData[];
  monthlyTags: readonly string[];
}) {
  const featured = products.slice(0, 4);
  const freeProducts = products.filter((product) => product.is_free || Number(product.preco) === 0).slice(0, 4);
  const plrProducts = products.filter((product) => product.is_plr && Number(product.preco_plr || 0) > 0 && product.has_plr_delivery).slice(0, 4);
  const offers = products.filter((product) => !product.is_free && Number(product.preco_original || 0) > Number(product.preco || 0)).slice(0, 4);
  const currentCalendarMonth = new Date().getMonth();
  const featuredCalendarTag = monthlyTags[0];
  const featuredCalendarEvent = monthlyTags
    .map((tag) => SCHOOL_CALENDAR_EVENTS.find((event) => event.searchTerm === tag))
    .find((event) => Boolean(event));
  const featuredCalendarArtwork = getSchoolCalendarMonthArtwork(currentCalendarMonth);
  const featuredThemeName = featuredCalendarEvent?.name || featuredCalendarTag;
  const featuredThemeSearchTerm = featuredCalendarEvent?.searchTerm || featuredCalendarTag;
  const featuredThemeProducts = featuredThemeSearchTerm
    ? products.filter((product) => product.seasonal_tags?.includes(featuredThemeSearchTerm)).slice(0, 4)
    : [];
  const featuredThemeFreeProducts = featuredThemeProducts.filter((product) => product.is_free || Number(product.preco) === 0).slice(0, 2);

  return (
    <main className="flex-1 pb-16 sm:pb-20">
      <h1 className="sr-only">Materiais didáticos digitais para professores e educadores</h1>

      <section className="border-b border-violet-100 bg-[radial-gradient(circle_at_90%_0%,#e0e7ff_0,transparent_34%),linear-gradient(130deg,#f8fafc_10%,#f5f3ff_58%,#ecfeff)]" aria-labelledby="home-proposta">
        <div className="mx-auto grid max-w-7xl gap-7 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8 lg:py-16">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3 py-1.5 text-xs font-black uppercase tracking-[.15em] text-violet-700 shadow-sm"><Sparkles className="h-3.5 w-3.5" /> Marketplace educacional</p>
            <h2 id="home-proposta" className="mt-5 text-3xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-5xl">Materiais didáticos prontos para ensinar melhor.</h2>
            <p className="mt-4 max-w-xl text-base font-medium leading-7 text-slate-600 sm:text-lg">Encontre atividades, apostilas, jogos e recursos digitais para apoiar o planejamento da sua aula.</p>
            <div className="mt-6 max-w-2xl" aria-label="Buscar materiais didáticos"><SearchBar /></div>
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

      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8" aria-labelledby="home-categorias">
        <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.14em] text-violet-700">Explore do seu jeito</p><h2 id="home-categorias" className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">Categorias para começar</h2></div><Link href="/buscar" className="shrink-0 text-sm font-black text-violet-700 hover:text-violet-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700">Ver todas</Link></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{categories.map((category) => <Link key={category.href} href={category.href} className="group flex min-h-24 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"><span className="text-xl" aria-hidden="true">{category.icon}</span><span className="text-sm font-black text-slate-800 group-hover:text-violet-700">{category.label}</span></Link>)}</div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-3 sm:px-6 sm:pb-6 lg:px-8" aria-label="Banners e campanhas disponíveis">{banners.length > 0 ? <div className="overflow-hidden rounded-[2rem] border border-violet-100 shadow-sm"><MainBannersCarousel banners={banners} /></div> : <div className="rounded-[2rem] border border-violet-100 bg-violet-50 p-6 sm:p-8"><div className="flex items-start gap-4"><ImageIcon className="mt-0.5 h-6 w-6 shrink-0 text-violet-700" /><div><h2 className="text-xl font-black text-slate-950">Encontre o material ideal para sua próxima aula</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Navegue pelas categorias, descubra materiais gratuitos e veja as vitrines de criadores disponíveis.</p><Link href="/buscar" className="mt-4 inline-flex text-sm font-black text-violet-700 hover:text-violet-900">Ir para o catálogo <ChevronRight className="h-4 w-4" /></Link></div></div></div>}</section>

      {featuredThemeName && featuredThemeSearchTerm && <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8" aria-labelledby="tema-em-destaque">
        <div className="homepage-featured-campaign overflow-hidden rounded-[2rem] border border-indigo-100 bg-white shadow-lg shadow-indigo-950/5">
          <div className="relative isolate min-h-[24rem] overflow-hidden bg-gradient-to-br from-indigo-950 via-violet-900 to-fuchsia-800 p-6 text-white sm:min-h-[27rem] sm:p-9">
            {featuredCalendarArtwork && <Image src={featuredCalendarArtwork.src} alt="" fill sizes="(min-width: 1280px) 80rem, 100vw" className="object-cover object-right opacity-70" priority />}
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-indigo-950 via-indigo-950/90 via-45% to-violet-800/10" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0"><span className="home-calendar-float absolute right-[8%] top-8 text-5xl drop-shadow-lg">{calendarThemeIcons[featuredThemeName] || '✨'}</span><span className="home-calendar-sparkle absolute right-[28%] top-10 text-2xl text-yellow-100">✦</span></div>
            <div className="relative flex h-full max-w-2xl flex-col justify-center"><p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[.14em] text-fuchsia-100 backdrop-blur-sm"><CalendarDays className="h-4 w-4" /> Campanha do mês</p><h2 id="tema-em-destaque" className="mt-4 text-3xl font-black leading-tight sm:text-5xl">{featuredThemeName}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">Uma campanha visual para inspirar seu planejamento e localizar materiais que os criadores marcaram para esta data.</p><div className="mt-6 flex flex-col gap-3 sm:flex-row">{featuredCalendarEvent ? <Link href={`/calendario/${featuredCalendarEvent.slug}`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-black text-indigo-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Ver tema completo <ChevronRight className="h-4 w-4" /></Link> : <Link href="/calendario" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-black text-indigo-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Ver calendário <ChevronRight className="h-4 w-4" /></Link>}<Link href={`/buscar?data=${encodeURIComponent(featuredThemeSearchTerm)}`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/30 px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Explorar materiais</Link></div><div className="mt-6 flex max-w-2xl snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]" aria-label="Campanhas do mês">{monthlyTags.map((tag) => { const artwork = getSchoolCalendarArtworkForTag(tag as Parameters<typeof getSchoolCalendarArtworkForTag>[0]); return <Link key={tag} href={`/buscar?data=${encodeURIComponent(tag)}`} className="group relative inline-flex min-h-11 shrink-0 snap-start items-center overflow-hidden rounded-full border border-white/25 px-3.5 text-xs font-black text-white transition hover:-translate-y-0.5 hover:border-white/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><Image src={artwork.src} alt="" fill sizes="10rem" className="object-cover opacity-30 transition group-hover:scale-110" /><span aria-hidden="true" className="absolute inset-0 bg-indigo-950/60" /><span className="relative">{calendarThemeIcons[tag] || '✦'} {tag}</span></Link>; })}</div></div>
          </div>
          <div className="p-5 sm:p-7"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.14em] text-indigo-700">Materiais vinculados ao tema</p><h3 className="mt-1 text-xl font-black text-slate-950">{featuredThemeProducts.length ? 'Escolhas para começar agora' : 'A campanha está pronta para receber materiais'}</h3></div><Link href={`/buscar?data=${encodeURIComponent(featuredThemeSearchTerm)}`} className="text-sm font-black text-indigo-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700">Ver todos →</Link></div>{featuredThemeProducts.length ? <div className="mt-5 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-5 lg:grid-cols-4">{featuredThemeProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <p className="mt-4 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 p-4 text-sm leading-6 text-slate-600">Quando um criador marcar um material com este tema, ele aparecerá aqui automaticamente.</p>}{featuredThemeFreeProducts.length > 0 && <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-emerald-50 p-4"><Gift className="h-5 w-5 text-emerald-700" /><p className="text-sm font-bold text-emerald-900">Também há {featuredThemeFreeProducts.length === 1 ? 'material gratuito' : `${featuredThemeFreeProducts.length} materiais gratuitos`} relacionado(s) a esta campanha.</p><Link href={`/buscar?data=${encodeURIComponent(featuredThemeSearchTerm)}&preco=gratis`} className="text-sm font-black text-emerald-800 underline">Ver gratuitos</Link></div>}</div>
        </div>
      </section>}

      <MonthlyCampaignCarousel tags={monthlyTags} />

      <Shelf title="Materiais em destaque" description="Uma seleção dos materiais publicados no catálogo." href="/buscar?sort=popular" products={featured} />

      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8" aria-labelledby="home-calendario">
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

            <div className="mt-6 flex snap-x gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]" aria-label="Temas do calendário do mês">
              {monthlyTags.map((tag, index) => <Link key={tag} href={`/buscar?data=${encodeURIComponent(tag)}`} className="group inline-flex min-h-12 shrink-0 snap-start items-center rounded-2xl border border-white/20 bg-white/10 px-3.5 text-sm font-bold text-white shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                <span aria-hidden="true" className={`mr-2 inline-flex h-7 w-7 items-center justify-center rounded-xl bg-white/15 text-base transition-transform group-hover:scale-110 ${index % 2 === 0 ? 'home-calendar-chip-icon' : ''}`}>{calendarThemeIcons[tag] || '✨'}</span>{tag}
              </Link>)}
            </div>
          </div>
        </div>
      </section>

      {offers.length > 0 && <Shelf title="Ofertas cadastradas" description="Materiais com preço promocional informado pelos criadores." href="/ofertas" products={offers} accent="orange" />}
      {freeProducts.length > 0 && <Shelf title="Materiais gratuitos" description="Recursos disponíveis para você conhecer a plataforma." href="/materiais-gratis" products={freeProducts} accent="emerald" />}
      {plrProducts.length > 0 && <Shelf title="Licenças de revenda" description="Materiais com modalidade PLR e entrega configurada." href="/buscar?filter=plr" products={plrProducts} accent="violet" purchaseMode="plr" />}

      <RecentlyViewed />

      <section className="border-y border-slate-200 bg-white" aria-labelledby="home-lojas"><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.14em] text-violet-700">Vitrines criadoras</p><h2 id="home-lojas" className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">Conheça as lojas da plataforma</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Explore os materiais publicados pelas lojas disponíveis.</p></div><Link href="/lojas" className="inline-flex min-h-11 items-center text-sm font-black text-violet-700 hover:text-violet-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700">Ver lojas <ChevronRight className="h-4 w-4" /></Link></div>{stores.length ? <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{stores.slice(0, 4).map((store) => <Link href={`/loja/${store.slug}`} key={store.id} className="flex min-h-24 items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-violet-300 hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700">{store.logo_url ? <img src={store.logo_url} alt="" className="h-12 w-12 rounded-full object-cover" /> : <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-lg font-black text-violet-700">{store.nome_loja?.charAt(0).toUpperCase() || 'L'}</span>}<span className="min-w-0"><span className="block truncate text-sm font-black text-slate-900">{store.nome_loja}</span><span className="mt-1 flex items-center text-xs font-semibold text-slate-500"><Store className="mr-1 h-3.5 w-3.5" />Visitar vitrine</span></span></Link>)}</div> : <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">As vitrines disponíveis aparecerão aqui. <Link href="/lojas" className="font-black text-violet-700">Ver página de lojas</Link></div>}</div></section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl sm:p-10"><div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="text-xs font-black uppercase tracking-[.14em] text-lime-300">Para quem cria</p><h2 className="mt-2 text-2xl font-black sm:text-4xl">Publique seus materiais em uma vitrine própria.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Crie uma loja, organize seus conteúdos e disponibilize materiais para educadores pela plataforma.</p></div><Link href="/vender" className="inline-flex min-h-12 items-center justify-center rounded-full bg-lime-300 px-6 text-sm font-black text-slate-950 hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Quero vender <ChevronRight className="ml-1 h-4 w-4" /></Link></div></div></section>
    </main>
  );
}

function Shelf({ title, description, href, products, accent = 'violet', purchaseMode }: { title: string; description: string; href: string; products: MarketplaceProduct[]; accent?: 'violet' | 'orange' | 'emerald'; purchaseMode?: 'plr' }) {
  if (!products.length) return null;
  const accentClass = accent === 'orange' ? 'text-orange-700' : accent === 'emerald' ? 'text-emerald-700' : 'text-violet-700';
  return <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8"><div className="mb-5 flex items-end justify-between gap-4"><div><p className={`text-xs font-black uppercase tracking-[.14em] ${accentClass}`}>Catálogo Educalizando</p><h2 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">{title}</h2><p className="mt-1 text-sm text-slate-600">{description}</p></div><Link href={href} className={`shrink-0 text-sm font-black ${accentClass} hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700`}>Ver todos</Link></div><div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-5 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} purchaseMode={purchaseMode} />)}</div></section>;
}
