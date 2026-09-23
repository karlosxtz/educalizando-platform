import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Compass, Search } from 'lucide-react';
import Footer from '@/components/Footer';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import SchoolCalendarMonth from '@/components/SchoolCalendarMonth';
import { getSchoolCalendarEventsForMonth } from '@/lib/school-calendar';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Calendário escolar e datas comemorativas | Educalizando',
  description: 'Consulte temas e datas comemorativas para apoiar o planejamento escolar e encontrar materiais no catálogo Educalizando.',
  alternates: { canonical: '/calendario' },
  openGraph: { title: 'Calendário escolar | Educalizando', description: 'Temas e datas para apoiar o planejamento escolar.', url: '/calendario' },
  twitter: { card: 'summary', title: 'Calendário escolar | Educalizando', description: 'Temas e datas para apoiar o planejamento escolar.' },
};

function calendarNumber(value: string | undefined, fallback: number, minimum: number, maximum: number) {
  const number = Number(value);
  return Number.isInteger(number) && number >= minimum && number <= maximum ? number : fallback;
}

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ mes?: string; ano?: string }> }) {
  const params = await searchParams;
  const now = new Date();
  const month = calendarNumber(params.mes, now.getMonth(), 0, 11);
  const year = calendarNumber(params.ano, now.getFullYear(), 2020, 2100);
  const events = getSchoolCalendarEventsForMonth(month);

  return <div className="flex min-h-screen flex-col bg-slate-50"><MarketplaceHeader /><main className="flex-1"><div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm font-semibold text-slate-600"><Link href="/" className="rounded hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Início</Link><ChevronRight className="h-4 w-4" aria-hidden="true" /><span aria-current="page" className="text-slate-900">Calendário</span></nav>
    <header className="mt-6 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-600 p-6 text-white shadow-sm sm:p-9"><p className="text-xs font-black uppercase tracking-[.16em] text-blue-100">Planejamento pedagógico</p><h1 className="mt-2 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">Calendário escolar e datas comemorativas</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-blue-50 sm:text-base">Uma seleção inicial de temas já usados no catálogo para ajudar a organizar o planejamento. Não é uma lista oficial de feriados.</p></header>
    <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,.85fr)]"><SchoolCalendarMonth month={month} year={year} events={events} /><section aria-labelledby="datas-do-mes" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><p className="text-xs font-black uppercase tracking-[.14em] text-blue-600">Planeje com antecedência</p><h2 id="datas-do-mes" className="mt-1 text-2xl font-black capitalize text-slate-950">Datas de {MONTHS[month]}</h2>{events.length ? <ul className="mt-5 space-y-3">{events.map((event) => <li key={event.slug}><Link href={`/calendario/${event.slug}`} className="group flex min-h-16 items-center gap-3 rounded-2xl border border-slate-200 p-3 hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-black text-blue-800">{event.day}</span><span className="min-w-0 flex-1"><span className="block font-black text-slate-900 group-hover:text-blue-800">{event.name}</span><span className="mt-0.5 block text-xs font-medium capitalize text-slate-500">{event.kind}</span></span><ChevronRight className="h-4 w-4 shrink-0 text-slate-400" /></Link></li>)}</ul> : <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center"><p className="font-bold text-slate-800">Ainda não há datas nesta seleção para este mês.</p><p className="mt-2 text-sm leading-6 text-slate-600">Você pode explorar os temas do catálogo ou voltar ao mês atual.</p><Link href="/buscar" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><Search className="h-4 w-4" />Explorar materiais</Link></div>}</section></div>
    <section className="mt-7 rounded-3xl border border-indigo-100 bg-indigo-50 p-5 sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-black text-slate-950">Encontre materiais pelo seu tema</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Os materiais relacionados são encontrados pela busca existente do catálogo. A associação automática por data ainda não está disponível.</p></div><Link href="/buscar" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 text-sm font-black text-white hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700"><Compass className="h-4 w-4" />Explorar catálogo</Link></div></section>
  </div></main><Footer /></div>;
}
