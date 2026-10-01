'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, CalendarDays, ChevronLeft, ChevronRight, Compass, Gift, Pause, Play, Sparkles } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import type { Product, Store } from '@/lib/types';
import { getSchoolCalendarTagsForMonth, getSchoolCalendarArtworkForTag, SCHOOL_CALENDAR_EVENTS, type SchoolCalendarTag } from '@/lib/school-calendar';

function normalizeTheme(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('pt-BR');
}

export default function FeaturedMonthlyCampaign({ products, initialTags }: {
  products: (Product & { store?: Store })[];
  initialTags: readonly string[];
}) {
  const [monthlyTags, setMonthlyTags] = useState(initialTags);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const elapsed = useRef(0);
  const [progress, setProgress] = useState(0);
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
    if (paused || focused || reducedMotion || monthlyTags.length < 2) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      elapsed.current += 100;
      if (elapsed.current >= 8000) {
        elapsed.current = 0;
        setIndex((value) => (value + 1) % monthlyTags.length);
      }
      setProgress(elapsed.current / 8000);
    }, 100);
    return () => window.clearInterval(timer);
  }, [paused, focused, reducedMotion, monthlyTags]);

  const activeIndex = index % (monthlyTags.length || 1);
  const featuredThemeSearchTerm = monthlyTags[activeIndex];
  const featuredCalendarEvent = SCHOOL_CALENDAR_EVENTS.find((event) => event.searchTerm === featuredThemeSearchTerm);
  const featuredThemeName = featuredCalendarEvent?.name || featuredThemeSearchTerm;
  const featuredThemeProducts = featuredThemeSearchTerm
    ? products.filter((product) => product.seasonal_tags?.some((tag) => normalizeTheme(tag) === normalizeTheme(featuredThemeSearchTerm))).slice(0, 4)
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
  const select = (value: number) => {
    elapsed.current = 0;
    setProgress(0);
    setIndex((value + monthlyTags.length) % monthlyTags.length);
  };
  const buttonClass = 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-sky-200 bg-white px-3 text-[#0b3a70] shadow-sm transition hover:border-sky-400 hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b63ce]';

  return (
    <section className="order-2 mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10" aria-labelledby="tema-em-destaque"
      onFocusCapture={(event) => setFocused(event.target.matches(':focus-visible'))} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <div className="homepage-featured-campaign overflow-hidden rounded-[2rem] border border-sky-100 bg-white shadow-[0_22px_65px_rgba(14,116,144,.13)]">
        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_8%_15%,#fff8cc_0,transparent_25%),radial-gradient(circle_at_88%_12%,#bcecff_0,transparent_29%),linear-gradient(135deg,#e9f8ff_0%,#f8fcff_53%,#eff4ff_100%)]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(#0ea5e91a_1px,transparent_1px),linear-gradient(90deg,#0ea5e91a_1px,transparent_1px)] [background-size:32px_32px]" />
          <span aria-hidden="true" className="absolute left-[7%] top-10 text-5xl text-amber-300/70 motion-safe:animate-[campaign-float_5s_ease-in-out_infinite]">✦</span>
          <span aria-hidden="true" className="absolute bottom-10 left-[47%] text-4xl text-sky-300/80 motion-safe:animate-[campaign-float_6s_ease-in-out_infinite]">✎</span>
          <div className="relative grid gap-7 p-5 sm:p-8 lg:grid-cols-[1.08fr_.92fr] lg:gap-10 lg:p-11">
            <div className="flex flex-col justify-center py-2 lg:py-5">
              <p className="inline-flex w-fit items-center gap-2 rounded-full bg-[#0b63ce] px-3 py-1.5 text-xs font-black uppercase tracking-[.14em] text-white shadow-lg shadow-blue-700/20"><Sparkles className="h-3.5 w-3.5 text-amber-200" />Trilha Educalizando</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#ffcf37] px-3 py-2 text-[#083b73]"><CalendarDays className="h-4 w-4" />{dateLabel}</span>
                <span className="rounded-full border border-sky-200 bg-white/75 px-3 py-2 text-[#31577e]">{featuredCalendarEvent?.kind || 'Planejamento escolar'}</span>
              </div>
              <h2 id="tema-em-destaque" className="mt-5 max-w-xl break-words text-3xl font-black leading-[1.02] tracking-tight text-[#083b73] sm:text-5xl lg:text-6xl">{featuredThemeName}</h2>
              <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-[#436486]">{featuredCalendarEvent?.description || 'Explore este tema com atividades, leituras e projetos para o planejamento das suas aulas.'}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href={featuredThemeProductHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0b63ce] px-5 text-sm font-black text-white shadow-lg shadow-blue-700/25 transition hover:-translate-y-0.5 hover:bg-[#084d9f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b63ce]">{featuredThemeActionLabel}<ChevronRight className="h-4 w-4" /></Link>
                <Link href={featuredCalendarEvent ? '/calendario/' + featuredCalendarEvent.slug : '/calendario'} className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-sky-200 bg-white px-5 text-sm font-black text-[#0b579d] transition hover:border-sky-400 hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b63ce]"><Compass className="h-4 w-4" />Planejar no calendário</Link>
              </div>
            </div>
            <div className="relative isolate min-h-72 overflow-hidden rounded-[2.25rem] border-[6px] border-white bg-sky-100 shadow-[0_18px_35px_rgba(8,59,115,.18)] sm:min-h-[25rem]">
              <Image key={artwork.src} src={artwork.src} alt={artwork.alt} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover object-center motion-safe:animate-[campaign-reveal_.6s_ease-out]" priority />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#083b73]/90 via-[#083b73]/20 to-transparent p-5 pt-16 text-white"><span className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-xs font-black backdrop-blur-sm"><BookOpen className="h-4 w-4 text-amber-200" />Ideias prontas para a sua aula</span></div>
            </div>
          </div>
          <div className="relative flex flex-col gap-4 border-t border-sky-100 bg-white/85 px-5 py-4 backdrop-blur-sm sm:px-8 lg:flex-row lg:items-center lg:px-11">
            <div className="flex gap-2">
              <button type="button" className={buttonClass} onClick={() => select(activeIndex - 1)} aria-label="Campanha anterior"><ChevronLeft className="h-5 w-5" /></button>
              <button type="button" className={buttonClass} onClick={() => select(activeIndex + 1)} aria-label="Próxima campanha"><ChevronRight className="h-5 w-5" /></button>
              {!reducedMotion && <button type="button" className={buttonClass} onClick={() => setPaused(!paused)} aria-label={paused ? 'Retomar campanhas' : 'Pausar campanhas'}>{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}</button>}
            </div>
            <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1" aria-label="Selecionar tema do mês">
              {monthlyTags.map((tag, itemIndex) => <button key={tag} type="button" onClick={() => select(itemIndex)} aria-pressed={activeIndex === itemIndex} className={`relative min-h-11 shrink-0 overflow-hidden rounded-xl border px-3 py-2 text-left text-xs font-black transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b63ce] ${activeIndex === itemIndex ? 'border-[#0b63ce] bg-[#e5f4ff] text-[#083b73]' : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50'}`}><span className="relative z-10">{tag}</span>{activeIndex === itemIndex && !reducedMotion && <span aria-hidden="true" data-campaign-progress className="pointer-events-none absolute inset-x-0 bottom-0 h-1 origin-left bg-[#ffcf37]" style={{ transform: `scaleX(${progress})` }} />}</button>)}
            </div>
            <span className="shrink-0 text-xs font-black text-slate-500" aria-live={paused ? 'polite' : 'off'}>{activeIndex + 1} de {monthlyTags.length}</span>
          </div>
        </div>
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="text-xs font-black uppercase tracking-[.14em] text-[#0b63ce]">Materiais vinculados ao tema</p><h3 className="mt-1 text-xl font-black text-slate-950">{featuredThemeProducts.length ? 'Escolhas para começar agora' : 'A campanha está pronta para receber materiais'}</h3><p className="mt-2 text-sm text-slate-600">{featuredThemeProducts.length ? `${featuredThemeProducts.length} ${featuredThemeProducts.length === 1 ? 'material encontrado' : 'materiais encontrados'} para ${featuredThemeName}.` : 'Os materiais aparecerão aqui assim que forem marcados com este tema.'}</p></div>
              <Link href={`/buscar?data=${encodeURIComponent(featuredThemeSearchTerm)}`} className="text-sm font-black text-[#0b63ce] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b63ce]">Ver todos →</Link>
            </div>
            {featuredThemeProducts.length ? <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(250px,.55fr)]"><div className="grid grid-cols-2 gap-2.5 sm:gap-5">{featuredThemeProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div><aside className="flex flex-col justify-between rounded-2xl border border-sky-100 bg-sky-50/70 p-5"><div><p className="text-xs font-black uppercase tracking-[.14em] text-[#0b63ce]">Por que este material?</p><h4 className="mt-2 text-lg font-black text-slate-950">Planeje com mais segurança</h4><p className="mt-3 text-sm leading-6 text-slate-700">Este material foi marcado pelo criador com <strong>{featuredThemeName}</strong>. Veja o formato, a loja, o preço e as condições diretamente no card.</p><dl className="mt-5 space-y-3 text-sm"><div className="flex items-center justify-between gap-3 border-b border-sky-100 pb-2"><dt className="text-slate-600">Data temática</dt><dd className="font-bold text-[#083b73]">{dateLabel}</dd></div><div className="flex items-center justify-between gap-3 border-b border-sky-100 pb-2"><dt className="text-slate-600">Categoria</dt><dd className="font-bold text-[#083b73]">{featuredCalendarEvent?.kind || 'Escolar'}</dd></div><div className="flex items-center justify-between gap-3"><dt className="text-slate-600">Gratuitos</dt><dd className="font-bold text-blue-700">{featuredThemeFreeProducts.length}</dd></div></dl></div><Link href={`/buscar?data=${encodeURIComponent(featuredThemeSearchTerm)}`} className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0b63ce] px-4 text-sm font-black text-white hover:bg-[#084d9f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b63ce]">Explorar todos deste tema <ChevronRight className="h-4 w-4" /></Link></aside></div> : <p className="mt-5 rounded-2xl border border-dashed border-sky-200 bg-sky-50 p-5 text-sm leading-6 text-slate-600">Quando um criador marcar um material com este tema, ele aparecerá aqui automaticamente. Enquanto isso, você pode explorar a busca temática para encontrar conteúdos próximos.</p>}
            {featuredThemeFreeProducts.length > 0 && <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-emerald-50 p-4"><Gift className="h-5 w-5 text-emerald-700" /><p className="text-sm font-bold text-emerald-900">Também há {featuredThemeFreeProducts.length === 1 ? 'material gratuito' : `${featuredThemeFreeProducts.length} materiais gratuitos`} relacionado(s) a esta campanha.</p><Link href={`/buscar?data=${encodeURIComponent(featuredThemeSearchTerm)}&preco=gratis`} className="text-sm font-black text-emerald-800 underline">Ver gratuitos</Link></div>}
          </div>
      </div>
    </section>
  );
}
