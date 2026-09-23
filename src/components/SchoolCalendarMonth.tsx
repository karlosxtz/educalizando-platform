import Link from 'next/link';
import { CalendarDays, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { calendarKindStyles } from '@/components/CalendarEventIcon';
import type { SchoolCalendarEvent } from '@/lib/school-calendar';

const MONTH_NAMES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function calendarHref(month: number, year: number, type?: string) {
  const query = new URLSearchParams({ mes: String(month), ano: String(year) });
  if (type) query.set('tipo', type);
  return `/calendario?${query.toString()}`;
}

export default function SchoolCalendarMonth({ month, year, events, materialCounts, activeType }: { month: number; year: number; events: SchoolCalendarEvent[]; materialCounts: ReadonlyMap<string, number>; activeType?: string }) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const previous = month === 0 ? { month: 11, year: year - 1 } : { month: month - 1, year };
  const next = month === 11 ? { month: 0, year: year + 1 } : { month: month + 1, year };
  const eventsByDay = new Map(events.map((event) => [event.day, event]));
  const calendarCells = Array.from({ length: firstWeekday + daysInMonth }, (_, index) => index < firstWeekday ? null : index - firstWeekday + 1);

  return <section aria-labelledby="calendario-mensal" className="rounded-[2rem] border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
    <div className="flex items-center justify-between gap-3"><Link href={calendarHref(previous.month, previous.year, activeType)} aria-label={`Ver ${MONTH_NAMES[previous.month]} de ${previous.year}`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><ChevronLeft className="h-5 w-5" /></Link><div className="min-w-0 text-center"><p className="text-xs font-black uppercase tracking-[.14em] text-blue-600">Calendário mensal</p><h2 id="calendario-mensal" className="mt-1 text-xl font-black capitalize text-slate-950 sm:text-2xl">{MONTH_NAMES[month]} de {year}</h2></div><Link href={calendarHref(next.month, next.year, activeType)} aria-label={`Ver ${MONTH_NAMES[next.month]} de ${next.year}`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><ChevronRight className="h-5 w-5" /></Link></div>
    <div className="mt-5 grid grid-cols-7 gap-1 text-center" role="grid" aria-label={`Calendário de ${MONTH_NAMES[month]} de ${year}`}>{WEEKDAYS.map((weekday) => <div key={weekday} role="columnheader" className="py-2 text-[10px] font-black uppercase tracking-wide text-slate-500 sm:text-xs">{weekday}</div>)}{calendarCells.map((day, index) => {
      if (!day) return <div key={`empty-${index}`} aria-hidden="true" className="min-h-12 rounded-xl" />;
      const event = eventsByDay.get(day); const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day; const materialCount = event ? materialCounts.get(event.slug) || 0 : 0; const label = event ? `${day} de ${MONTH_NAMES[month]}: ${event.name}${materialCount ? ', possui materiais associados' : ''}` : `${day} de ${MONTH_NAMES[month]}`; const base = `relative flex min-h-12 w-full items-center justify-center rounded-xl border text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${isToday ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`;
      if (!event) return <div key={day} role="gridcell" aria-label={label}><span className={`${base} border-transparent text-slate-700`}>{day}</span></div>;
      const style = calendarKindStyles[event.kind]; return <div key={day} role="gridcell" aria-label={label}><Link href={`/calendario/${event.slug}`} className={`${base} border-blue-100 bg-blue-50 text-blue-900 hover:bg-blue-100`}><span>{day}</span><span className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />{materialCount > 0 && <span className="absolute right-1 top-1 rounded-full bg-emerald-600 px-1 text-[9px] font-black leading-4 text-white" aria-hidden="true">✓</span>}<span className="sr-only">: {event.name}</span></Link></div>;
    })}</div>
    <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600"><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-600" aria-hidden="true" />Data temática</span><span className="inline-flex items-center gap-1.5"><span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] text-white" aria-hidden="true">✓</span>Com materiais marcados</span></div>
    <p className="mt-4 flex items-center gap-2 text-xs leading-5 text-slate-500"><CalendarDays className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" /> Dias destacados possuem uma data temática. A lista abaixo traz o nome completo, o tipo e o acesso aos materiais.</p><div className="mt-4 flex justify-center"><Link href="/calendario" aria-current={month === new Date().getMonth() && year === new Date().getFullYear() ? 'page' : undefined} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><Search className="h-4 w-4" />Ver mês atual</Link></div>
  </section>;
}
