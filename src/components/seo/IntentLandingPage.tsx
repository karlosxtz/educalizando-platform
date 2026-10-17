import Footer from '@/components/Footer';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import ProductCard from '@/components/ProductCard';
import { INTENT_EDITORIAL } from '@/lib/intent-editorial';
import { readIntentProducts } from '@/lib/intent-catalog';
import { serializeJsonLd, SITE_URL } from '@/lib/seo';
import { ArrowRight, CheckCircle2, FileText, Lightbulb, Search } from 'lucide-react';
import Link from 'next/link';

export type IntentLanding = {
  slug: string; title: string; description: string; query: string; eyebrow: string;
  benefits: string[]; tips: string[]; faq: { question: string; answer: string }[];
};

export default async function IntentLandingPage({ landing }: { landing: IntentLanding }) {
  const products = await readIntentProducts(landing.slug);
  const editorial = INTENT_EDITORIAL[landing.slug];
  const url = `${SITE_URL}/${landing.slug}`;
  const searchUrl = `/buscar?q=${encodeURIComponent(landing.query)}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', name: landing.title, description: landing.description, url },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: landing.title, item: url },
      ] },
      { '@type': 'FAQPage', mainEntity: landing.faq.map(item => ({
        '@type': 'Question', name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })) },
      ...(products.length ? [{
        '@type': 'ItemList', name: `Materiais: ${landing.title}`, numberOfItems: products.length,
        itemListElement: products.map((product, index) => ({
          '@type': 'ListItem', position: index + 1, name: product.titulo,
          url: `${SITE_URL}/produto/${product.slug || product.id}`,
        })),
      }] : []),
    ],
  };
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <MarketplaceHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-br from-[#082b63] via-[#0b4e9e] to-[#0a9ea5] py-12 text-white sm:py-20">
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <nav aria-label="Caminho da página" className="mb-6 text-sm text-blue-100">
              <Link prefetch={false} href="/" className="underline underline-offset-4">Início</Link>
              <span aria-hidden="true"> / </span><span aria-current="page">{landing.eyebrow}</span>
            </nav>
            <p className="text-xs font-black uppercase tracking-[.18em] text-teal-200">{landing.eyebrow}</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight sm:text-5xl">{landing.title}</h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-blue-100 sm:text-lg">{landing.description}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link prefetch={false} href={searchUrl} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 text-sm font-black text-[#082b63] hover:bg-amber-200">
                <Search aria-hidden="true" className="h-4 w-4" />Explorar materiais
              </Link>
              <Link prefetch={false} href="/lojas" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 px-5 text-sm font-black hover:bg-white/10">Conhecer lojas criadoras</Link>
            </div>
          </div>
        </section>
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <ul className="grid gap-4 sm:grid-cols-3">
            {landing.benefits.map(benefit => <li key={benefit} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
              <CheckCircle2 aria-hidden="true" className="h-6 w-6 text-teal-500" />
              <p className="mt-3 font-black text-slate-900">{benefit}</p>
            </li>)}
          </ul>
          <section className="mt-12" aria-labelledby="materiais-selecionados">
            <div className="flex items-center justify-between gap-4">
              <div><p className="text-xs font-black uppercase tracking-[.16em] text-blue-600">Catálogo Educalizando</p>
                <h2 id="materiais-selecionados" className="mt-1 text-2xl font-black text-slate-900">Materiais para começar agora</h2>
              </div>
              <Link prefetch={false} href={searchUrl} className="hidden items-center gap-1 text-sm font-bold text-blue-700 sm:flex">Explorar busca <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
            </div>
            {products.length ? <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {products.map(product => <ProductCard key={product.id} product={product} />)}
            </div> : <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="font-bold text-slate-700">Nenhum material correspondente nesta seleção no momento.</p>
              <Link prefetch={false} href="/buscar" className="mt-3 inline-flex text-sm font-bold text-blue-700">Explorar catálogo completo</Link>
            </div>}
          </section>
          {editorial && <div className="mt-14 grid gap-8 sm:grid-cols-2">
            {editorial.sections.map(section => <section key={section.title} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="text-xl font-black text-slate-900">{section.title}</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">{section.text}</p>
            </section>)}
          </div>}
          <section className="mt-14 grid gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 sm:p-9">
            <div>
              <div className="flex items-center gap-2 text-blue-700"><Lightbulb aria-hidden="true" className="h-5 w-5" /><h2 className="text-xl font-black">Como escolher um bom material</h2></div>
              <ul className="mt-5 space-y-4">{landing.tips.map(tip => <li key={tip} className="flex gap-3 text-sm leading-relaxed text-slate-600"><span aria-hidden="true" className="text-teal-500">●</span>{tip}</li>)}</ul>
            </div>
            <div>
              <div className="flex items-center gap-2 text-blue-700"><FileText aria-hidden="true" className="h-5 w-5" /><h2 className="text-xl font-black">Dúvidas frequentes</h2></div>
              <div className="mt-4 space-y-3">{landing.faq.map(item => <details key={item.question} className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-black text-slate-900">{item.question}</summary><p className="mt-2 text-sm leading-relaxed text-slate-600">{item.answer}</p></details>)}</div>
            </div>
          </section>
          {editorial && <nav aria-label="Conteúdos relacionados" className="mt-12">
            <h2 className="text-xl font-black text-slate-900">Continue seu planejamento</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-3">{editorial.related.map(link => <li key={link.href}>
              <Link prefetch={false} href={link.href} className="flex h-full min-h-12 items-center justify-between gap-3 rounded-xl border border-blue-100 bg-white p-4 text-sm font-bold text-blue-700 hover:bg-blue-50">
                {link.label}<ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
              </Link>
            </li>)}</ul>
          </nav>}
        </div>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }} />
      <Footer />
    </div>
  );
}
