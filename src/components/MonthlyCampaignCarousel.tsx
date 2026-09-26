'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, ChevronRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { getSchoolCalendarArtworkForTag, SCHOOL_CALENDAR_EVENTS, type SchoolCalendarTag } from '@/lib/school-calendar';
import CampaignTrackedLink from '@/components/CampaignTrackedLink';

export default function MonthlyCampaignCarousel({ tags, orderClass = '' }: { tags: readonly string[]; orderClass?: string }) {
  const [expanded, setExpanded] = useState(false);
  const campaigns = tags.map((tag) => ({
    tag,
    artwork: getSchoolCalendarArtworkForTag(tag as SchoolCalendarTag),
    event: SCHOOL_CALENDAR_EVENTS.find((event) => event.searchTerm === tag),
  }));
  if (!campaigns.length) return null;
  const visibleCampaigns = expanded ? campaigns : campaigns.slice(0, 3);

  return (
    <section className={`${orderClass} mx-auto w-full max-w-[1440px] px-4 py-9 sm:px-6 sm:py-12 lg:px-10`} aria-labelledby="campanhas-do-mes">
      <div className="rounded-[2rem] border border-indigo-100 bg-white p-5 shadow-lg shadow-indigo-950/5 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-indigo-700"><Sparkles aria-hidden="true" className="h-4 w-4" /> Ideias para suas aulas</p>
            <h2 id="campanhas-do-mes" className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">Escolha um tema para trabalhar este mês</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Clique em um tema para buscar atividades e materiais relacionados. Para consultar as datas e organizar seu planejamento, abra o calendário escolar.</p>
          </div>
          <Link href="/calendario" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-indigo-200 px-4 text-sm font-bold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700"><CalendarDays aria-hidden="true" className="h-5 w-5" />Ver calendário escolar</Link>
        </div>
        <div id="temas-mensais" className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCampaigns.map(({ tag, artwork, event }) => (
            <CampaignTrackedLink key={tag} href={'/buscar?data=' + encodeURIComponent(tag)} tag={tag} surface="homepage_monthly" className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-700">
              <span className="relative block aspect-[16/9] bg-indigo-50">
                <Image src={artwork.src} alt={artwork.alt} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover object-center" />
              </span>
              <span className="flex flex-1 flex-col p-5 sm:p-6">
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700"><CalendarDays aria-hidden="true" className="h-4 w-4" />{event ? event.day + ' de ' + new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(2026, event.month - 1, 1)) : 'Tema para o mês'}</span>
                <span className="mt-3 block text-xl font-black leading-snug text-slate-950">{tag}</span>
                <span className="mt-3 block text-sm leading-6 text-slate-600">{event?.description || 'Encontre ideias e recursos sobre ' + tag.toLocaleLowerCase('pt-BR') + ' para preparar suas aulas.'}</span>
                <span className="mt-auto pt-5"><span className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-3 py-2 text-sm font-bold text-white group-hover:bg-indigo-800">Buscar materiais deste tema <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0" /></span></span>
              </span>
            </CampaignTrackedLink>
          ))}
        </div>
        <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-600" aria-live="polite">Mostrando {visibleCampaigns.length} de {campaigns.length} temas do mês.</p>
          {campaigns.length > 3 && <button type="button" aria-expanded={expanded} aria-controls="temas-mensais" onClick={() => setExpanded(!expanded)} className="min-h-11 rounded-xl border border-indigo-200 px-5 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700">{expanded ? 'Mostrar menos temas' : 'Ver todos os ' + campaigns.length + ' temas'}</button>}
        </div>
      </div>
    </section>
  );
}
