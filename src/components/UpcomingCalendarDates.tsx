import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import CalendarEventIcon from '@/components/CalendarEventIcon';
import CampaignTrackedLink from '@/components/CampaignTrackedLink';
import { getUpcomingSchoolEvents, getSchoolCalendarArtworkForTag, SCHOOL_CALENDAR_EVENTS } from '@/lib/school-calendar';

type UpcomingCalendarDatesProps = {
  products: ReadonlyArray<{ seasonal_tags?: string[] | null }>;
  orderClass?: string;
};

const monthFormatter = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' });

export default function UpcomingCalendarDates({ products, orderClass = '' }: UpcomingCalendarDatesProps) {
  const events = getUpcomingSchoolEvents(new Date(), 4).map((item) => {
    const event = SCHOOL_CALENDAR_EVENTS.find((candidate) => candidate.searchTerm === item.tag);
    const materials = products.filter((product) => product.seasonal_tags?.includes(item.tag)).length;
    return { ...item, event, materials };
  });

  if (!events.length) return null;

  return (
    <section className={`${orderClass} mx-auto w-full max-w-[1440px] px-4 py-9 sm:px-6 sm:py-12 lg:px-10`} aria-labelledby="proximas-datas">
      <div className="rounded-[2rem] border border-indigo-200 bg-gradient-to-br from-indigo-100 via-white to-amber-50 p-5 shadow-lg shadow-indigo-950/5 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-indigo-700"><CalendarDays className="h-4 w-4" /> Planejamento em dia</p>
            <h2 id="proximas-datas" className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">Próximas datas: inspire sua próxima aula</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Antecipe o planejamento com temas que estão chegando. Escolha uma data para explorar atividades, leituras e projetos para sua turma.</p>
          </div>
          <Link href="/calendario" className="inline-flex min-h-11 items-center gap-1 text-sm font-black text-indigo-700 hover:text-indigo-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700">Ver calendário completo <ArrowUpRight className="h-4 w-4" /></Link>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {events.map((item, index) => {
            const href = '/buscar?data=' + encodeURIComponent(item.tag);
            const artwork = getSchoolCalendarArtworkForTag(item.tag);
            return <CampaignTrackedLink key={item.tag} href={href} tag={item.tag} surface="homepage_upcoming" className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm transition-shadow hover:border-indigo-400 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-700">
              <span className="relative block aspect-[4/3] bg-indigo-50">
                <Image src={artwork.src} alt={artwork.alt} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-2 text-xs font-black text-indigo-900 shadow-sm">{item.daysUntil === 0 ? 'É hoje!' : item.daysUntil === 1 ? 'É amanhã!' : 'Faltam ' + item.daysUntil + ' dias'}</span>
                {index === 0 && <span className="absolute bottom-3 left-3 rounded-full bg-lime-300 px-3 py-1.5 text-xs font-black text-indigo-950">A próxima no calendário</span>}
              </span>
              <span className="flex flex-1 flex-col p-5">
                <span className="flex items-center gap-2 text-indigo-700"><span aria-hidden="true">{item.event ? <CalendarEventIcon icon={item.event.icon} /> : <CalendarDays className="h-5 w-5" />}</span><time dateTime={item.date.toISOString().slice(0, 10)} className="text-xs font-bold">{monthFormatter.format(item.date)}</time></span>
                <span className="mt-3 block text-lg font-black leading-snug text-slate-950">{item.tag}</span>
                <span className="mt-3 text-sm leading-6 text-slate-600">{item.materials > 0 ? (item.materials === 1 ? '1 material relacionado para explorar.' : item.materials + ' materiais relacionados para explorar.') : 'Busque inspirações para trabalhar este tema com sua turma.'}</span>
                <span className="mt-auto pt-5"><span className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-3 py-2 text-sm font-bold text-white group-hover:bg-indigo-800">Explorar este tema <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" /></span></span>
              </span>
            </CampaignTrackedLink>;
          })}
        </div>
      </div>
    </section>
  );
}
