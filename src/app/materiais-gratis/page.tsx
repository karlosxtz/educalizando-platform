import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Download, Gift, Sparkles } from 'lucide-react';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { getAllFreeProducts } from '@/lib/store-service';

const pageUrl = 'https://www.educalizando.com.br/materiais-gratis';

export const metadata: Metadata = {
  title: 'Materiais Pedagógicos Gratuitos para Baixar | Educalizando',
  description: 'Encontre atividades, jogos e recursos pedagógicos gratuitos para usar em sala de aula. Crie sua conta de Cliente e resgate seus materiais na Educalizando.',
  alternates: { canonical: pageUrl },
  openGraph: {
    title: 'Materiais Pedagógicos Gratuitos | Educalizando',
    description: 'Atividades e recursos pedagógicos gratuitos para professores, famílias e educadores.',
    url: pageUrl,
    type: 'website',
  },
};

export default async function MateriaisGratisPage() {
  const products = await getAllFreeProducts();
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Materiais Pedagógicos Gratuitos',
      description: 'Atividades e recursos pedagógicos gratuitos disponíveis na Educalizando.',
      url: pageUrl,
      isPartOf: { '@type': 'WebSite', name: 'Educalizando', url: 'https://www.educalizando.com.br' },
    },
    ...(products.length ? [{
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Materiais pedagógicos gratuitos',
      itemListElement: products.slice(0, 50).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: product.titulo,
        url: `https://www.educalizando.com.br/produto/${product.slug || product.id}`,
      })),
    }] : []),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {structuredData.map((data, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      ))}
      <MarketplaceHeader />

      <main className="flex-1">
        <section className="border-b border-emerald-100 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-4 py-12 text-white sm:py-16">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em]">
              <Gift className="h-4 w-4" /> Recursos para a sua aula
            </span>
            <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">Materiais pedagógicos gratuitos</h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-emerald-50 sm:text-lg">
              Resgate atividades, jogos e recursos prontos para usar. É grátis: crie sua conta de Cliente e mantenha todos os seus materiais organizados em um só lugar.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <a href="#materiais" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-emerald-700 shadow-lg transition-transform hover:-translate-y-0.5">
                <Download className="h-4 w-4" /> Ver materiais grátis
              </a>
              <Link href="/aluno/cadastro?returnTo=/materiais-gratis" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-5 text-sm font-bold text-white hover:bg-white/20">
                Criar conta de Cliente <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section id="materiais" className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Acervo gratuito</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">Escolha o seu próximo material</h2>
            </div>
            <p className="inline-flex items-center gap-2 text-sm font-bold text-slate-600"><Sparkles className="h-4 w-4 text-amber-500" /> {products.length} material{products.length === 1 ? '' : 'is'} disponível{products.length === 1 ? '' : 'is'}</p>
          </div>

          {products.length ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Gift className="h-7 w-7" /></div>
              <h2 className="mt-5 text-xl font-black text-slate-900">Novos materiais gratuitos em breve</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600">Estamos preparando novos recursos para apoiar suas aulas. Cadastre seu e-mail para receber as próximas novidades.</p>
              <Link href="/blog" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700">Explorar guias pedagógicos <ArrowRight className="h-4 w-4" /></Link>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
