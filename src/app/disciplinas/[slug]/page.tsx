import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { getDisciplines } from '@/lib/discipline-service';
import { searchProducts } from '@/lib/search-service';

interface DisciplinePageProps {
  params: Promise<{ slug: string }>;
}

function copyFor(name: string) {
  return {
    title: `Atividades de ${name} para Imprimir | Educalizando`,
    description: `Encontre atividades e materiais pedagógicos de ${name}, prontos para usar em sala de aula, reforço e planejamento.`,
  };
}

export async function generateMetadata({ params }: DisciplinePageProps): Promise<Metadata> {
  const { slug } = await params;
  const discipline = (await getDisciplines()).find((item) => item.slug === slug);
  if (!discipline) return { title: 'Disciplina não encontrada | Educalizando' };

  const copy = copyFor(discipline.name);
  const url = `https://www.educalizando.com.br/disciplinas/${discipline.slug}`;
  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: url },
    openGraph: { title: copy.title, description: copy.description, type: 'website', url },
    twitter: { card: 'summary_large_image', title: copy.title, description: copy.description },
  };
}

export default async function DisciplinePage({ params }: DisciplinePageProps) {
  const { slug } = await params;
  const discipline = (await getDisciplines()).find((item) => item.slug === slug);
  if (!discipline) notFound();

  const result = await searchProducts({ disciplina: discipline.name, page: 1, sort: 'recentes' });
  const pageUrl = `https://www.educalizando.com.br/disciplinas/${discipline.slug}`;
  const copy = copyFor(discipline.name);
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `Materiais de ${discipline.name}`,
      description: copy.description,
      url: pageUrl,
      isPartOf: { '@type': 'WebSite', name: 'Educalizando', url: 'https://www.educalizando.com.br' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://www.educalizando.com.br/' },
        { '@type': 'ListItem', position: 2, name: 'Disciplinas', item: 'https://www.educalizando.com.br/buscar' },
        { '@type': 'ListItem', position: 3, name: discipline.name, item: pageUrl },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9fa]">
      {structuredData.map((data, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />)}
      <MarketplaceHeader />
      <main className="flex-1">
        <section className="border-b bg-white py-10 sm:py-12">
          <div className="container mx-auto max-w-[1200px] px-4 text-center">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-blue-600">Por disciplina</p>
            <h1 className="mb-4 text-3xl font-black text-[#093b6c] sm:text-4xl">Atividades de {discipline.name}</h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">{copy.description}</p>
          </div>
        </section>
        <section className="py-8 sm:py-12">
          <div className="container mx-auto max-w-[1200px] px-4">
            {result.data.length ? (
              <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-6 lg:grid-cols-4">
                {result.data.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            ) : (
              <div className="mx-auto max-w-2xl rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm sm:p-12">
                <h2 className="mb-2 text-xl font-black text-[#093b6c]">Novos materiais a caminho</h2>
                <p className="mb-6 text-slate-600">Ainda não há materiais de {discipline.name} com habilidades BNCC vinculadas.</p>
                <Link href="/buscar" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#093b6c] px-6 py-3 font-bold text-white hover:bg-[#06284a]">Ver todos os materiais</Link>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
