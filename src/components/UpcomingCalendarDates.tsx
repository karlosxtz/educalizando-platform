'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import CalendarEventIcon from '@/components/CalendarEventIcon';
import CampaignTrackedLink from '@/components/CampaignTrackedLink';
import { getUpcomingSchoolEvents, getSchoolCalendarArtworkForTag, SCHOOL_CALENDAR_EVENTS } from '@/lib/school-calendar';

type UpcomingCalendarDatesProps = {
  products: ReadonlyArray<{ seasonal_tags?: string[] | null }>;
  orderClass?: string;
};

const monthFormatter = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' });

export default function UpcomingCalendarDates({ products, orderClass = '' }: UpcomingCalendarDatesProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const events = getUpcomingSchoolEvents(new Date(), 4).map((item) => {
    const event = SCHOOL_CALENDAR_EVENTS.find((candidate) => candidate.searchTerm === item.tag);
    const materials = products.filter((product) => product.seasonal_tags?.includes(item.tag)).length;
    return { ...item, event, materials };
  });

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(motion.matches);
    sync();
    motion.addEventListener('change', sync);
    return () => motion.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (reducedMotion || events.length < 2) return;
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % events.length), 6500);
    return () => window.clearInterval(timer);
  }, [events.length, reducedMotion]);

  if (!events.length) return null;

  return (
    <section className={`${orderClass} mx-auto w-full max-w-[1440px] px-3 py-7 sm:px-6 sm:py-12 lg:px-10`} aria-labelledby="proximas-datas">
      <div className="rounded-[1.5rem] border border-indigo-200 bg-gradient-to-br from-indigo-100 via-white to-amber-50 p-4 shadow-lg shadow-indigo-950/5 sm:rounded-[2rem] sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-indigo-700"><CalendarDays className="h-4 w-4" /> Planejamento em dia</p>
            <h2 id="proximas-datas" className="mt-2 text-xl font-black leading-tight text-slate-950 sm:text-3xl">Próximas datas: inspire sua próxima aula</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:mt-3">Antecipe o planejamento com temas que estão chegando. Escolha uma data para explorar atividades e projetos.</p>
          </div>
          <Link href="/calendario" className="inline-flex min-h-11 items-center gap-1 text-sm font-black text-indigo-700 hover:text-indigo-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700">Ver calendário completo <ArrowUpRight className="h-4 w-4" /></Link>
        </div>

        <div className="mt-5 grid gap-4 sm:mt-7 sm:grid-cols-2 lg:grid-cols-4" role="region" aria-roledescription="carrossel" aria-label="Próximas datas escolares" aria-live="polite" onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => {
          if (touchStartX.current === null) return;
          const delta = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
          if (Math.abs(delta) > 45) setActiveIndex((current) => (current + (delta < 0 ? 1 : -1) + events.length) % events.length);
          touchStartX.current = null;
        }}>
          {events.map((item, index) => {
            const href = '/buscar?data=' + encodeURIComponent(item.tag);
            const artwork = getSchoolCalendarArtworkForTag(item.tag);
            return <CampaignTrackedLink key={item.tag} href={href} tag={item.tag} surface="homepage_upcoming" className={`${index === activeIndex ? 'flex' : 'hidden'} group min-w-0 flex-col overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm transition-shadow hover:border-indigo-400 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-700 sm:flex`}>
              <span className="relative block aspect-[16/9] bg-indigo-50 sm:aspect-[4/3]">
                <Image src={artwork.src} alt={artwork.alt} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-2 text-xs font-black text-indigo-900 shadow-sm">{item.daysUntil === 0 ? 'É hoje!' : item.daysUntil === 1 ? 'É amanhã!' : 'Faltam ' + item.daysUntil + ' dias'}</span>
                {index === 0 && <span className="absolute bottom-3 left-3 rounded-full bg-lime-300 px-3 py-1.5 text-xs font-black text-indigo-950">A próxima no calendário</span>}
              </span>
              <span className="flex flex-1 flex-col p-4 sm:p-5">
                <span className="flex items-center gap-2 text-indigo-700"><span aria-hidden="true">{item.event ? <CalendarEventIcon icon={item.event.icon} /> : <CalendarDays className="h-5 w-5" />}</span><time dateTime={item.date.toISOString().slice(0, 10)} className="text-xs font-bold">{monthFormatter.format(item.date)}</time></span>
                <span className="mt-3 block text-lg font-black leading-snug text-slate-950">{item.tag}</span>
                <span className="mt-2 text-sm leading-6 text-slate-600 sm:mt-3">{item.materials > 0 ? (item.materials === 1 ? '1 material relacionado para explorar.' : item.materials + ' materiais relacionados para explorar.') : 'Busque inspirações para trabalhar este tema.'}</span>
                <span className="mt-auto pt-4 sm:pt-5"><span className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-3 py-2 text-sm font-bold text-white group-hover:bg-blue-800">Explorar este tema <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" /></span></span>
              </span>
            </CampaignTrackedLink>;
          })}
        </div>
        {events.length > 1 && <div className="mt-4 flex items-center justify-between sm:hidden">
          <button type="button" onClick={() => setActiveIndex((current) => (current - 1 + events.length) % events.length)} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-700" aria-label="Ver data anterior"><ChevronLeft className="h-5 w-5" /></button>
          <div className="flex gap-1.5" aria-label={`${activeIndex + 1} de ${events.length}`}>{events.map((item, index) => <button key={item.tag} type="button" onClick={() => setActiveIndex(index)} aria-label={`Ver ${item.tag}`} aria-current={index === activeIndex ? 'true' : undefined} className={`h-2.5 rounded-full transition-all ${index === activeIndex ? 'w-7 bg-blue-700' : 'w-2.5 bg-blue-200'}`} />)}</div>
          <button type="button" onClick={() => setActiveIndex((current) => (current + 1) % events.length)} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-700" aria-label="Ver próxima data"><ChevronRight className="h-5 w-5" /></button>
        </div>}
      </div>
    </section>
  );
}
