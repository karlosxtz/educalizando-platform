'use client';

import CampaignTrackedLink from '@/components/CampaignTrackedLink';
import { getSchoolCalendarArtworkForTag,SCHOOL_CALENDAR_EVENTS,type SchoolCalendarTag } from '@/lib/school-calendar';
import { CalendarDays,ChevronRight,Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function MonthlyCampaignCarousel({ tags, orderClass = '' }: { tags: readonly string[]; orderClass?: string }) {
  const campaigns = tags.map((tag) => ({
    tag,
    artwork: getSchoolCalendarArtworkForTag(tag as SchoolCalendarTag),
    event: SCHOOL_CALENDAR_EVENTS.find((event) => event.searchTerm === tag),
  }));
  if (!campaigns.length) return null;

  return (
    <section className={`${orderClass} mx-auto w-full max-w-[1440px] px-3 py-7 sm:px-6 sm:py-12 lg:px-10`} aria-labelledby="campanhas-do-mes">
      <div className="rounded-[1.5rem] border border-indigo-100 bg-white p-4 shadow-lg shadow-indigo-950/5 sm:rounded-[2rem] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-indigo-700"><Sparkles aria-hidden="true" className="h-4 w-4" /> Ideias para suas aulas</p>
            <h2 id="campanhas-do-mes" className="mt-2 text-xl font-black leading-tight text-slate-950 sm:text-3xl">Escolha um tema para trabalhar este mês</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Clique em um tema para buscar atividades e materiais relacionados. Para consultar as datas e organizar seu planejamento, abra o calendário escolar.</p>
          </div>
          <Link href="/calendario" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-indigo-200 px-4 text-sm font-bold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700"><CalendarDays aria-hidden="true" className="h-5 w-5" />Ver calendário escolar</Link>
        </div>
        <div id="temas-mensais" className="marketplace-horizontal-scroll mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:mt-7 sm:gap-5" role="region" aria-label="Temas escolares do mês">
          {campaigns.map(({ tag, artwork, event }) => (
            <CampaignTrackedLink key={tag} href={'/buscar?data=' + encodeURIComponent(tag)} tag={tag} surface="homepage_monthly" className="group flex w-[82vw] max-w-[300px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-700 sm:w-[calc(50%-10px)] sm:max-w-none lg:w-[calc(33.333%-14px)]">
              <span className="relative block aspect-[16/9] bg-indigo-50">
                <Image src={artwork.src} alt={artwork.alt} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover object-center" />
              </span>
              <span className="flex flex-1 flex-col p-4 sm:p-6">
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700"><CalendarDays aria-hidden="true" className="h-4 w-4" />{event ? event.day + ' de ' + new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(2026, event.month - 1, 1)) : 'Tema para o mês'}</span>
                <span className="mt-3 block text-xl font-black leading-snug text-slate-950">{tag}</span>
                <span className="mt-3 block text-sm leading-6 text-slate-600">{event?.description || 'Encontre ideias e recursos sobre ' + tag.toLocaleLowerCase('pt-BR') + ' para preparar suas aulas.'}</span>
                <span className="mt-auto pt-5"><span className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-3 py-2 text-sm font-bold text-white group-hover:bg-indigo-800">Buscar materiais deste tema <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0" /></span></span>
              </span>
            </CampaignTrackedLink>
          ))}
        </div>
        <p className="mt-2 text-xs font-semibold text-slate-500 sm:text-sm">Deslize para o lado para ver todos os {campaigns.length} temas.</p>
      </div>
    </section>
  );
}
