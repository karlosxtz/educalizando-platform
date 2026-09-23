import Link from 'next/link';
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import CalendarEventIcon from '@/components/CalendarEventIcon';
import CampaignTrackedLink from '@/components/CampaignTrackedLink';
import { getUpcomingSchoolEvents, SCHOOL_CALENDAR_EVENTS } from '@/lib/school-calendar';

type UpcomingCalendarDatesProps = {
  products: ReadonlyArray<{ seasonal_tags?: string[] | null }>;
};

const monthFormatter = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' });

export default function UpcomingCalendarDates({ products }: UpcomingCalendarDatesProps) {
  const events = getUpcomingSchoolEvents(new Date(), 4).map((item) => {
    const event = SCHOOL_CALENDAR_EVENTS.find((candidate) => candidate.searchTerm === item.tag);
    const materials = products.filter((product) => product.seasonal_tags?.includes(item.tag)).length;
    return { ...item, event, materials };
  });

  if (!events.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8" aria-labelledby="proximas-datas">
      <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-indigo-50/70 to-violet-50 p-5 shadow-lg shadow-indigo-950/5 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-indigo-700"><CalendarDays className="h-4 w-4" /> Planejamento em dia</p>
            <h2 id="proximas-datas" className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">Próximas datas</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Campanhas que chegam a seguir, já conectadas à busca do catálogo.</p>
          </div>
          <Link href="/calendario" className="inline-flex min-h-11 items-center gap-1 text-sm font-black text-indigo-700 hover:text-indigo-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700">Ver calendário completo <ArrowUpRight className="h-4 w-4" /></Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {events.map((item) => {
            const href = '/buscar?data=' + encodeURIComponent(item.tag);
            return <CampaignTrackedLink key={item.tag} href={href} tag={item.tag} surface="homepage_upcoming" className="group flex min-h-40 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700">
              <span className="flex items-start justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-100 text-indigo-700">{item.event ? <CalendarEventIcon icon={item.event.icon} /> : <CalendarDays className="h-5 w-5" />}</span><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-700">{item.daysUntil === 0 ? 'Hoje' : item.daysUntil === 1 ? 'Amanhã' : 'Em ' + item.daysUntil + ' dias'}</span></span>
              <span className="mt-4"><time dateTime={item.date.toISOString().slice(0, 10)} className="block text-xs font-bold text-slate-500">{monthFormatter.format(item.date)}</time><span className="mt-1 block text-base font-black leading-tight text-slate-950">{item.tag}</span></span>
              <span className="mt-auto pt-4 text-xs font-bold text-indigo-700">{item.materials === 1 ? '1 material relacionado' : item.materials + ' materiais relacionados'} <ArrowUpRight className="inline h-3.5 w-3.5" /></span>
            </CampaignTrackedLink>;
          })}
        </div>
      </div>
    </section>
  );
}
