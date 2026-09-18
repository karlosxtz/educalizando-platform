import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Download, Gift, Sparkles } from 'lucide-react';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';

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
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Materiais Pedagógicos Gratuitos',
      description: 'Atividades e recursos pedagógicos gratuitos disponíveis na Educalizando.',
      url: pageUrl,
      isPartOf: { '@type': 'WebSite', name: 'Educalizando', url: 'https://www.educalizando.com.br' },
    },
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
              Os brindes são um benefício de cada loja: após uma compra paga, você acessa os materiais gratuitos daquela mesma loja pela sua área de cliente.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <a href="#materiais" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-emerald-700 shadow-lg transition-transform hover:-translate-y-0.5">
                <Download className="h-4 w-4" /> Ver meus materiais grátis
              </a>
              <Link href="/aluno/cadastro?returnTo=/materiais-gratis" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-5 text-sm font-bold text-white hover:bg-white/20">
                Criar conta de Cliente <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section id="materiais" className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-100 bg-white p-7 text-center shadow-sm sm:p-10">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Benefício por loja</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">Seus brindes ficam na área de cliente</h2>
            </div>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600">Comprou na Loja A? Veja somente os brindes da Loja A. Ainda não comprou? Faça sua primeira compra para liberar esse benefício.</p>
            <Link href="/cliente/brindes" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700">Acessar meus brindes <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
