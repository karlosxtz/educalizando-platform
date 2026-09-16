import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getEducationLevels } from '@/lib/category-service';
import { searchProducts } from '@/lib/search-service';
import ProductCard from '@/components/ProductCard';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

interface EducationLevelPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EducationLevelPageProps): Promise<Metadata> {
  const { slug } = await params;
  const level = (await getEducationLevels()).find((item) => item.slug === slug);

  if (!level) return { title: 'Nível de ensino não encontrado | Educalizando' };

  const title = `Atividades para ${level.nome} para Imprimir | Educalizando`;
  const description = `Encontre os melhores materiais didáticos, apostilas e atividades prontas para ${level.nome}. Alinhados à BNCC e desenvolvidos por especialistas para potencializar suas aulas.`;
  const url = `https://www.educalizando.com.br/atividades-por-ano/${level.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, type: 'website', url },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function EducationLevelLandingPage({ params }: EducationLevelPageProps) {
  const { slug } = await params;
  const level = (await getEducationLevels()).find((item) => item.slug === slug);
  if (!level) notFound();

  const result = await searchProducts({ ano_escolar: level.slug, page: 1, sort: 'recentes' });
  const pageUrl = `https://www.educalizando.com.br/atividades-por-ano/${level.slug}`;
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `Atividades para ${level.nome}`,
      description: `Atividades, apostilas e recursos pedagógicos para ${level.nome}.`,
      url: pageUrl,
      isPartOf: { '@type': 'WebSite', name: 'Educalizando', url: 'https://www.educalizando.com.br' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://www.educalizando.com.br/' },
        { '@type': 'ListItem', position: 2, name: 'Níveis de ensino', item: 'https://www.educalizando.com.br/buscar' },
        { '@type': 'ListItem', position: 3, name: level.nome, item: pageUrl },
      ],
    },
    ...(result.data.length ? [{
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Materiais para ${level.nome}`,
      itemListElement: result.data.slice(0, 24).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: product.titulo,
        url: `https://www.educalizando.com.br/produto/${product.slug || product.id}`,
      })),
    }] : []),
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa] selection:bg-blue-600 selection:text-white">
      {structuredData.map((data, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      ))}
      <MarketplaceHeader />
      <main className="flex-1">
        <section className="bg-white border-b py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-[1200px] text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-bold mb-6">
              <CheckCircle2 className="w-4 h-4" /> Alinhado à BNCC
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-[#093b6c] mb-6 tracking-tight leading-tight">Materiais e Atividades para <br className="hidden md:block"/> {level.nome}</h1>
            <p className="text-gray-600 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
              Explore nossa seleção de apostilas, e-books e recursos pedagógicos desenvolvidos especificamente para {level.nome}.
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-[1200px]">
            {result.data.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {result.data.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100 max-w-2xl mx-auto">
                <div className="bg-[#f0f7ff] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-[#093b6c] text-2xl font-semibold">{level.nome.charAt(0)}</span></div>
                <h3 className="text-xl font-bold text-[#093b6c] mb-2">Nenhum material encontrado</h3>
                <p className="text-gray-600 mb-6 font-medium">Ainda não temos atividades cadastradas especificamente para <strong>{level.nome}</strong>. Que tal explorar outros recursos no acervo principal?</p>
                <Link href="/buscar" className="inline-flex items-center justify-center px-6 py-3 bg-[#093b6c] text-white font-bold rounded-xl hover:bg-[#06284a] transition-colors shadow-sm">
                  Explorar Todo o Acervo
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
