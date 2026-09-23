import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, ChevronRight, Search } from 'lucide-react';
import { notFound } from 'next/navigation';
import Footer from '@/components/Footer';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import { getSchoolCalendarEvent } from '@/lib/school-calendar';

type CalendarDetailProps = { params: Promise<{ slug: string }> };
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export async function generateMetadata({ params }: CalendarDetailProps): Promise<Metadata> {
  const event = getSchoolCalendarEvent((await params).slug);
  if (!event) return {};
  const title = `${event.name} | Calendário escolar Educalizando`;
  return { title, description: event.description, alternates: { canonical: `/calendario/${event.slug}` }, openGraph: { title, description: event.description, url: `/calendario/${event.slug}` }, twitter: { card: 'summary', title, description: event.description } };
}

export default async function CalendarDetailPage({ params }: CalendarDetailProps) {
  const event = getSchoolCalendarEvent((await params).slug);
  if (!event) notFound();
  const dateLabel = `${event.day} de ${MONTHS[event.month - 1]}`;
  const searchHref = `/buscar?data=${encodeURIComponent(event.searchTerm)}`;
  return <div className="flex min-h-screen flex-col bg-slate-50"><MarketplaceHeader /><main className="flex-1"><article className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10"><nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm font-semibold text-slate-600"><Link href="/" className="rounded hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Início</Link><ChevronRight className="h-4 w-4" aria-hidden="true" /><Link href="/calendario" className="rounded hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Calendário</Link><ChevronRight className="h-4 w-4" aria-hidden="true" /><span aria-current="page" className="text-slate-900">{event.name}</span></nav><Link href="/calendario" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-bold text-blue-700 hover:bg-blue-50 hover:px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><ArrowLeft className="h-4 w-4" />Voltar ao calendário</Link><header className="mt-5 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-9"><p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-blue-700"><CalendarDays className="h-4 w-4" />{event.kind}</p><h1 className="mt-4 text-3xl font-black leading-tight text-slate-950 sm:text-5xl">{event.name}</h1><p className="mt-3 text-lg font-bold text-blue-700">{dateLabel}</p><p className="mt-5 max-w-2xl leading-7 text-slate-600">{event.description}</p></header><section className="mt-7 rounded-3xl border border-indigo-100 bg-indigo-50 p-6 sm:p-8"><h2 className="text-xl font-black text-slate-950">Materiais relacionados</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">A Educalizando usa a busca do catálogo para este tema. Os resultados, quando existirem, mantêm preço, modalidade e informações originais de cada material.</p><Link href={searchHref} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-700 px-5 text-sm font-black text-white hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700"><Search className="h-4 w-4" />Buscar materiais para {event.name}</Link></section></article></main><Footer /></div>;
}
