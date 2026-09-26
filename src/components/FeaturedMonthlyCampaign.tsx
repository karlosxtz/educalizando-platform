'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, ChevronLeft, ChevronRight, Gift, Pause, Play } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import type { Product, Store } from '@/lib/types';
import { getSchoolCalendarTagsForMonth, getSchoolCalendarArtworkForTag, SCHOOL_CALENDAR_EVENTS, type SchoolCalendarTag } from '@/lib/school-calendar';

export default function FeaturedMonthlyCampaign({ products, initialTags }: {
  products: (Product & { store?: Store })[];
  initialTags: readonly string[];
}) {
  const [monthlyTags, setMonthlyTags] = useState(initialTags);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReducedMotion(motion.matches);
    const syncMonth = () => {
      const month = Number(new Intl.DateTimeFormat('en-US', { month: 'numeric', timeZone: 'America/Sao_Paulo' }).format(new Date())) - 1;
      const tags = getSchoolCalendarTagsForMonth(month);
      setMonthlyTags((previous) => previous.join('|') === tags.join('|') ? previous : tags);
    };
    syncMotion();
    syncMonth();
    motion.addEventListener('change', syncMotion);
    document.addEventListener('visibilitychange', syncMonth);
    const timer = window.setInterval(syncMonth, 60000);
    return () => {
      window.clearInterval(timer);
      motion.removeEventListener('change', syncMotion);
      document.removeEventListener('visibilitychange', syncMonth);
    };
  }, []);

  useEffect(() => {
    if (paused || hovered || focused || reducedMotion || monthlyTags.length < 2) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((value) => (value + 1) % monthlyTags.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [paused, hovered, focused, reducedMotion, monthlyTags]);

  const activeIndex = index % (monthlyTags.length || 1);
  const featuredThemeSearchTerm = monthlyTags[activeIndex];
  const featuredCalendarEvent = SCHOOL_CALENDAR_EVENTS.find((event) => event.searchTerm === featuredThemeSearchTerm);
  const featuredThemeName = featuredCalendarEvent?.name || featuredThemeSearchTerm;
  const featuredThemeProducts = featuredThemeSearchTerm
    ? products.filter((product) => product.seasonal_tags?.includes(featuredThemeSearchTerm)).slice(0, 4)
    : [];
  const featuredThemeFreeProducts = featuredThemeProducts.filter((product) => product.is_free || Number(product.preco) === 0).slice(0, 2);
  const featuredThemeProductHref = featuredThemeProducts.length === 1
    ? `/produto/${featuredThemeProducts[0].slug || featuredThemeProducts[0].id}`
    : `/buscar?data=${encodeURIComponent(featuredThemeSearchTerm)}`;
  const featuredThemeActionLabel = featuredThemeProducts.length === 1 ? 'Ver material' : 'Explorar materiais';

  if (!featuredThemeName) return null;
  const artwork = getSchoolCalendarArtworkForTag(featuredThemeSearchTerm as SchoolCalendarTag);
  const dateLabel = featuredCalendarEvent
    ? featuredCalendarEvent.day + ' de ' + new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(2026, featuredCalendarEvent.month - 1, 1))
    : 'Tema do mês';
  const select = (value: number) => { setIndex((value + monthlyTags.length) % monthlyTags.length); setPaused(true); };
  const buttonClass = 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/30 px-3 text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

  return (
    <section className="order-2 mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10" aria-labelledby="tema-em-destaque"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <div className="homepage-featured-campaign overflow-hidden rounded-[2rem] border border-indigo-100 bg-white shadow-lg">
        <div className="relative bg-violet-950 text-white">
          <div className="grid md:grid-cols-2">
            <div className="relative z-10 flex flex-col justify-center p-6 sm:p-9 lg:p-12">
              <p className="text-xs font-black uppercase tracking-widest text-lime-200">Tema em destaque</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                <span className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-3 py-2 text-violet-950"><CalendarDays className="h-4 w-4" />{dateLabel}</span>
                <span className="rounded-full border border-white/30 px-3 py-2">{featuredCalendarEvent?.kind || 'Planejamento escolar'}</span>
              </div>
              <h2 id="tema-em-destaque" className="mt-5 break-words text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">{featuredThemeName}</h2>
              <p className="mt-5 text-base leading-relaxed text-violet-100">{featuredCalendarEvent?.description || 'Explore este tema com atividades, leituras e projetos para o planejamento das suas aulas.'}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={featuredThemeProductHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-lime-300 px-5 text-sm font-black text-violet-950 hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{featuredThemeActionLabel}<ChevronRight className="h-4 w-4" /></Link>
                <Link href={featuredCalendarEvent ? '/calendario/' + featuredCalendarEvent.slug : '/calendario'} className="inline-flex min-h-12 items-center rounded-full border border-white/30 px-5 text-sm font-bold focus-visible:outline-2 focus-visible:outline-white">Ver no calendário</Link>
              </div>
            </div>
            <div className="relative aspect-[4/3] min-w-0 md:aspect-auto md:min-h-[25rem]">
              <Image key={artwork.src} src={artwork.src} alt={artwork.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover object-center motion-safe:animate-[campaign-reveal_.6s_ease-out]" priority />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-white/15 bg-violet-900 p-4 sm:p-5">
            <div className="flex gap-2">
              <button type="button" className={buttonClass} onClick={() => select(activeIndex - 1)} aria-label="Campanha anterior"><ChevronLeft className="h-5 w-5" /></button>
              <button type="button" className={buttonClass} onClick={() => select(activeIndex + 1)} aria-label="Próxima campanha"><ChevronRight className="h-5 w-5" /></button>
              {!reducedMotion && <button type="button" className={buttonClass} onClick={() => setPaused(!paused)} aria-label={paused ? 'Retomar campanhas' : 'Pausar campanhas'}>{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}</button>}
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap gap-2" aria-label="Selecionar tema do mês">
              {monthlyTags.map((tag, itemIndex) => <button key={tag} type="button" onClick={() => select(itemIndex)} aria-pressed={activeIndex === itemIndex} className={`min-h-11 max-w-full rounded-2xl border px-3 py-2 text-left text-xs font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${activeIndex === itemIndex ? 'border-lime-300 bg-white/20 text-lime-100' : 'border-white/20 text-white hover:bg-white/10'}`}>{tag}</button>)}
            </div>
            <span className="text-xs text-violet-100" aria-live={paused ? 'polite' : 'off'}>{activeIndex + 1} / {monthlyTags.length}</span>
          </div>
        </div>
          <div className="p-6 sm:p-8"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.14em] text-indigo-700">Materiais vinculados ao tema</p><h3 className="mt-1 text-xl font-black text-slate-950">{featuredThemeProducts.length ? 'Escolhas para começar agora' : 'A campanha está pronta para receber materiais'}</h3></div><Link href={`/buscar?data=${encodeURIComponent(featuredThemeSearchTerm)}`} className="text-sm font-black text-indigo-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700">Ver todos →</Link></div>{featuredThemeProducts.length ? <div className="mt-6 grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-4">{featuredThemeProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <p className="mt-5 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 p-5 text-sm leading-6 text-slate-600">Quando um criador marcar um material com este tema, ele aparecerá aqui automaticamente.</p>}{featuredThemeFreeProducts.length > 0 && <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-emerald-50 p-4"><Gift className="h-5 w-5 text-emerald-700" /><p className="text-sm font-bold text-emerald-900">Também há {featuredThemeFreeProducts.length === 1 ? 'material gratuito' : `${featuredThemeFreeProducts.length} materiais gratuitos`} relacionado(s) a esta campanha.</p><Link href={`/buscar?data=${encodeURIComponent(featuredThemeSearchTerm)}&preco=gratis`} className="text-sm font-black text-emerald-800 underline">Ver gratuitos</Link></div>}</div>
      </div>
    </section>
  );
}

