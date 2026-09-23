'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getSchoolCalendarArtworkForTag, type SchoolCalendarTag } from '@/lib/school-calendar';

type MonthlyCampaignCarouselProps = {
  tags: readonly string[];
};

export default function MonthlyCampaignCarousel({ tags }: MonthlyCampaignCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const campaigns = tags.map((tag) => ({ tag, artwork: getSchoolCalendarArtworkForTag(tag as SchoolCalendarTag) }));

  useEffect(() => {
    if (paused || campaigns.length < 2) return;
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % campaigns.length), 6000);
    return () => window.clearInterval(timer);
  }, [campaigns.length, paused]);

  if (!campaigns.length) return null;

  const move = (direction: -1 | 1) => {
    setActiveIndex((current) => (current + direction + campaigns.length) % campaigns.length);
  };
  const visibleCampaigns = Array.from({ length: Math.min(3, campaigns.length) }, (_, offset) => campaigns[(activeIndex + offset) % campaigns.length]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8" aria-labelledby="campanhas-do-mes">
      <div className="rounded-[2rem] border border-indigo-100 bg-white p-5 shadow-lg shadow-indigo-950/5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-indigo-700"><Sparkles className="h-4 w-4" /> Datas e campanhas do mês</p>
            <h2 id="campanhas-do-mes" className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">Planeje com os temas em evidência</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Selecione uma campanha para localizar materiais relacionados. As campanhas avançam automaticamente e podem ser controladas pelos botões.</p>
          </div>
          <div className="flex gap-2" aria-label="Controles das campanhas do mês">
            <button type="button" onClick={() => move(-1)} className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700" aria-label="Ver campanha anterior"><ChevronLeft className="h-5 w-5" /></button>
            <button type="button" onClick={() => move(1)} className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700" aria-label="Ver próxima campanha"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
          {visibleCampaigns.map((campaign, index) => <Link key={campaign.tag + '-' + index} href={'/buscar?data=' + encodeURIComponent(campaign.tag)} className={'group relative min-h-48 overflow-hidden rounded-2xl border border-slate-200 bg-indigo-950 p-5 text-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 ' + (index > 0 ? 'hidden md:block' : '')}>
            <Image src={campaign.artwork.src} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover object-right opacity-70 transition duration-500 group-hover:scale-105" />
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-indigo-950 via-indigo-950/75 to-indigo-900/10" />
            <span className="relative flex h-full flex-col justify-between"><span className="inline-flex w-fit rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wide backdrop-blur-sm">Campanha {index + 1} de {campaigns.length}</span><span><span className="block text-xl font-black leading-tight">{campaign.tag}</span><span className="mt-2 inline-flex items-center gap-1 text-sm font-black text-indigo-100">Explorar materiais <ChevronRight className="h-4 w-4" /></span></span></span>
          </Link>)}
        </div>
        <div className="mt-5 flex justify-center gap-2" aria-label="Indicador das campanhas">
          {campaigns.map((campaign, index) => <button key={campaign.tag} type="button" onClick={() => setActiveIndex(index)} className={'h-2.5 rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 ' + (index === activeIndex ? 'w-7 bg-indigo-700' : 'w-2.5 bg-indigo-200 hover:bg-indigo-400')} aria-label={'Mostrar campanha: ' + campaign.tag} aria-current={index === activeIndex ? 'true' : undefined} />)}
        </div>
      </div>
    </section>
  );
}
