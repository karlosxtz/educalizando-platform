import CalendarEventIcon from '@/components/CalendarEventIcon';
import { getSchoolCalendarArtworkForTag,getUpcomingSchoolEvents,SCHOOL_CALENDAR_EVENTS } from '@/lib/school-calendar';
import { ArrowUpRight,CalendarDays } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type Props = {
  products: ReadonlyArray<{ id?: string; slug?: string | null; seasonal_tags?: string[] | null }>;
  orderClass?: string;
};
const formatter = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' });

export default function UpcomingCalendarDates({ products, orderClass = '' }: Props) {
  const events = getUpcomingSchoolEvents(new Date(), 4);
  return <section className={`${orderClass} mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10`} aria-labelledby="proximas-datas">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-700"><CalendarDays aria-hidden="true" className="h-4 w-4" />Planejamento em dia</p><h2 id="proximas-datas" className="mt-2 home-heading">Próximas datas para planejar</h2><p className="mt-2 text-sm leading-6 text-slate-600">Encontre ideias e materiais para as próximas datas do calendário escolar.</p></div>
      <Link href="/calendario" className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-bold text-indigo-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2">Ver calendário completo <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>
    </div>
    <div className="mt-6 grid grid-cols-1 gap-4 min-[600px]:grid-cols-2 xl:grid-cols-4">
      {events.map(item => {
        const event = SCHOOL_CALENDAR_EVENTS.find(candidate => candidate.searchTerm === item.tag);
        const related = products.filter(product => product.seasonal_tags?.includes(item.tag));
        const artwork = getSchoolCalendarArtworkForTag(item.tag);
        const calendarHref = event ? `/calendario/${event.slug}` : '/calendario';
        const href = related.length === 0 ? calendarHref : related.length === 1 && related[0].id ? `/produto/${related[0].slug || related[0].id}` : `/buscar?data=${encodeURIComponent(item.tag)}`;
        return <article key={item.tag} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
          <Link href={href} aria-label={`Explorar ${item.tag}`} className="relative block h-28 bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-700">
            <Image src={artwork.src} alt={artwork.alt} fill sizes="(min-width: 1280px) 25vw, (min-width: 600px) 50vw, 100vw" className="object-cover opacity-35" />
            <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-2 text-xs font-bold text-indigo-900 shadow-sm">{item.daysUntil === 0 ? 'É hoje!' : item.daysUntil === 1 ? 'É amanhã!' : `Faltam ${item.daysUntil} dias`}</span>
          </Link>
          <div className="flex flex-1 flex-col p-5">
            <p className="flex items-center gap-2 text-xs font-bold text-indigo-700">{event && <CalendarEventIcon icon={event.icon} className="h-4 w-4" />}<time dateTime={`${item.date.getFullYear()}-${String(item.date.getMonth()+1).padStart(2,'0')}-${String(item.date.getDate()).padStart(2,'0')}`}>{formatter.format(item.date)}</time></p>
            <h3 className="mt-3 text-base font-semibold leading-snug text-slate-950">{item.tag}</h3>
            {event && <p className="mt-1 text-xs font-semibold text-slate-500">{event.kind}</p>}
            <p className="mt-3 text-sm leading-6 text-slate-600">{related.length ? `${related.length} ${related.length === 1 ? 'material relacionado' : 'materiais relacionados'} no catálogo exibido.` : 'Ainda não há materiais para esta data no catálogo exibido.'}</p>
            <Link href={href} className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700">{related.length ? 'Ver materiais' : 'Ver no calendário'}<ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>
            {related.length > 0 && <Link href={calendarHref} className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-indigo-700 underline focus-visible:outline-2">Ver no calendário</Link>}
          </div>
        </article>;
      })}
    </div>
  </section>;
}
