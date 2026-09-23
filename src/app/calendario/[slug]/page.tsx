import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, ChevronRight, ExternalLink, Lightbulb, Search, Sparkles } from 'lucide-react';
import { notFound } from 'next/navigation';
import Footer from '@/components/Footer';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import CalendarEventIcon, { calendarKindStyles } from '@/components/CalendarEventIcon';
import ProductCard from '@/components/ProductCard';
import StoreCard from '@/components/StoreCard';
import { getSchoolCalendarEvent, SCHOOL_CALENDAR_ARTWORK, type SchoolCalendarEvent } from '@/lib/school-calendar';
import { getAllPublicMarketplaceProducts } from '@/lib/store-service';

type CalendarDetailProps = { params: Promise<{ slug: string }> };
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function planningIdeas(event: SchoolCalendarEvent) {
  const ideas: Partial<Record<SchoolCalendarEvent['kind'], string[]>> = {
    ambiental: ['Comece com uma pergunta sobre cuidado com o ambiente.', 'Combine leitura, observação e uma produção coletiva da turma.'],
    literatura: ['Escolha uma obra, autor ou gênero como ponto de partida.', 'Finalize com uma produção criativa ou uma roda de conversa.'],
    cultural: ['Contextualize a tradição antes de propor a atividade.', 'Relacione o tema à comunidade e às experiências da turma.'],
    cidadania: ['Apresente o contexto histórico em linguagem adequada à turma.', 'Proponha pesquisa, debate e registro das descobertas.'],
    'saúde e bem-estar': ['Conduza a conversa com acolhimento e linguagem apropriada.', 'Incentive escuta, cuidado e respeito entre os estudantes.'],
    segurança: ['Parta de situações do cotidiano das crianças.', 'Finalize com combinados práticos que a turma possa aplicar.'],
  };
  return ideas[event.kind] || ['Conecte o tema ao planejamento e aos objetivos de aprendizagem.', 'Escolha materiais adequados à faixa etária e reserve um momento para registro.'];
}

export async function generateMetadata({ params }: CalendarDetailProps): Promise<Metadata> {
  const event = getSchoolCalendarEvent((await params).slug);
  if (!event) return {};
  const title = event.name + ' | Calendário escolar Educalizando';
  return { title, description: event.description, alternates: { canonical: '/calendario/' + event.slug }, openGraph: { title, description: event.description, url: '/calendario/' + event.slug }, twitter: { card: 'summary', title, description: event.description } };
}

export default async function CalendarDetailPage({ params }: CalendarDetailProps) {
  const event = getSchoolCalendarEvent((await params).slug);
  if (!event) notFound();

  const allRelatedProducts = (await getAllPublicMarketplaceProducts(500)).filter((product) => product.seasonal_tags?.includes(event.searchTerm));
  const paidProducts = allRelatedProducts.filter((product) => !product.is_free && Number(product.preco) > 0);
  const freeProducts = allRelatedProducts.filter((product) => product.is_free || Number(product.preco) === 0);
  const featuredProducts = (paidProducts.length ? paidProducts : freeProducts).slice(0, 4);
  const featuredFreeProducts = paidProducts.length ? freeProducts.slice(0, 4) : [];
  const relatedStores = Array.from(new Map(allRelatedProducts.filter((product) => product.store?.id).map((product) => [product.store!.id, product.store!])).values()).slice(0, 3);
  const dateLabel = event.day + ' de ' + MONTHS[event.month - 1];
  const searchHref = '/buscar?data=' + encodeURIComponent(event.searchTerm);
  const style = calendarKindStyles[event.kind];
  const artwork = SCHOOL_CALENDAR_ARTWORK[event.slug];

  return <div className="flex min-h-screen flex-col bg-slate-50"><MarketplaceHeader /><main className="flex-1"><article className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm font-semibold text-slate-600"><Link href="/" className="rounded hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Início</Link><ChevronRight aria-hidden="true" className="h-4 w-4" /><Link href="/calendario" className="rounded hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Calendário</Link><ChevronRight aria-hidden="true" className="h-4 w-4" /><span aria-current="page" className="text-slate-900">{event.name}</span></nav>
    <Link href="/calendario" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Voltar ao calendário</Link>
    <header className="relative mt-4 overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-800 via-blue-700 to-cyan-600 p-6 text-white shadow-lg sm:p-10">{artwork && <Image src={artwork.src} alt="" fill priority sizes="(min-width: 1024px) 72rem, 100vw" className="object-cover object-right opacity-45" />}<div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-blue-950 via-blue-900/80 to-blue-700/15" /><div className="relative flex flex-col gap-5 sm:flex-row sm:items-center"><span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/30"><CalendarEventIcon icon={event.icon} className="h-8 w-8" /></span><div><p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-blue-100"><CalendarDays aria-hidden="true" className="h-4 w-4" /> {event.kind}</p><h1 className="mt-2 text-3xl font-black leading-tight sm:text-5xl">{event.name}</h1><p className="mt-3 text-lg font-bold text-cyan-100">{dateLabel}</p></div></div></header>
    <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]"><section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-xl font-black text-slate-950">Sobre esta data</h2><p className="mt-3 leading-7 text-slate-600">{event.description}</p><div className="mt-6 flex flex-wrap gap-2"><span className={'inline-flex rounded-full px-3 py-1.5 text-xs font-black ring-1 ' + style.chip}>{event.kind}</span><span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">Revisão editorial: {new Date(event.reviewedAt + 'T12:00:00').toLocaleDateString('pt-BR')}</span></div></section><aside className="rounded-3xl border border-indigo-100 bg-indigo-50 p-5"><h2 className="text-sm font-black text-slate-950">Referência editorial</h2><p className="mt-2 text-sm leading-6 text-slate-600">{event.sourceName}</p>{event.sourceUrl ? <a href={event.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-black text-indigo-800 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700">Consultar fonte <ExternalLink aria-hidden="true" className="h-4 w-4" /></a> : <p className="mt-4 text-xs leading-5 text-slate-500">Esta data está sinalizada para revisão editorial antes de receber uma fonte externa.</p>}</aside></div>
    <section className="mt-7 rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:p-6" aria-labelledby="ideias-para-aula"><p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-amber-800"><Lightbulb className="h-4 w-4" /> Sugestão de planejamento</p><h2 id="ideias-para-aula" className="mt-1 text-xl font-black text-slate-950">Como aproveitar este tema em aula</h2><ol className="mt-4 grid gap-3 sm:grid-cols-2">{planningIdeas(event).map((idea, index) => <li key={idea} className="flex gap-3 rounded-2xl bg-white/80 p-4 text-sm leading-6 text-slate-700"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-200 text-xs font-black text-amber-950">{index + 1}</span>{idea}</li>)}</ol></section>
    <section aria-labelledby="materiais-relacionados" className="mt-9"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.14em] text-blue-700">Catálogo Educalizando</p><h2 id="materiais-relacionados" className="mt-1 text-2xl font-black text-slate-950">Materiais para este tema</h2></div><Link href={searchHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 px-4 text-sm font-black text-blue-800 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Ver busca completa <Search aria-hidden="true" className="h-4 w-4" /></Link></div>{featuredProducts.length ? <><p className="mt-2 text-sm leading-6 text-slate-600">Estes materiais possuem exatamente a tag temática cadastrada pelo criador.</p><div className="mt-5 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-5 lg:grid-cols-4">{featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div></> : <div role="status" className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center"><h3 className="text-lg font-black text-slate-900">Ainda não há materiais marcados para este tema</h3><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">A busca temática continua disponível, sem criar uma associação automática ou falsa.</p><Link href={searchHref} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-black text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><Search aria-hidden="true" className="h-4 w-4" />Buscar materiais sobre este tema</Link></div>}</section>
    {featuredFreeProducts.length > 0 && <section className="mt-8 border-t border-slate-200 pt-8" aria-labelledby="materiais-gratuitos-relacionados"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.14em] text-emerald-700">Para conhecer sem custo</p><h2 id="materiais-gratuitos-relacionados" className="mt-1 text-2xl font-black text-slate-950">Materiais gratuitos relacionados</h2><p className="mt-2 text-sm leading-6 text-slate-600">Também marcados pelos criadores com esta mesma data temática.</p></div><Link href={searchHref + '&preco=gratis'} className="text-sm font-black text-emerald-700 hover:underline">Ver todos os gratuitos →</Link></div><div className="mt-5 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-5 lg:grid-cols-4">{featuredFreeProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div></section>}
    {relatedStores.length > 0 && <section className="mt-8 border-t border-slate-200 pt-8" aria-labelledby="criadores-relacionados"><div><p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-violet-700"><Sparkles className="h-4 w-4" /> Vitrines criadoras</p><h2 id="criadores-relacionados" className="mt-1 text-2xl font-black text-slate-950">Criadores que trabalham este tema</h2><p className="mt-2 text-sm leading-6 text-slate-600">Vitrines relacionadas porque possuem materiais marcados para esta data.</p></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{relatedStores.map((store) => <StoreCard key={store.id} store={store} />)}</div></section>}
  </article></main><Footer /></div>;
}
