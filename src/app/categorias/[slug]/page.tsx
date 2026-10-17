export const revalidate = 3600;

import Footer from '@/components/Footer';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import ProductCard from '@/components/ProductCard';
import { readSeoPublicCatalog, readSeoCategoryProducts } from '@/lib/seo-public-catalog';
import { categoryIntroduction } from '@/lib/category-editorial';
import { serializeJsonLd,socialMetadata } from '@/lib/seo';
import { shortSeoTitle } from '@/lib/page-seo';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { categories, categoryRules } = await readSeoPublicCatalog();
  const category = categories.find(c => c.slug === slug);

  if (!category) {
    notFound();
  }

  const rule = categoryRules.get(slug)!;
  const title = shortSeoTitle(`Materiais de ${category.nome}`);
  const description = `${category.nome}: ${rule.combinedCount === 1 ? '1 material didático' : rule.combinedCount + ' materiais didáticos'}. Compare o conteúdo e o público indicado nos cadastros para planejar suas aulas.`;
  const canonicalPath = `/categorias/${rule.canonicalSlug}`;

  return {
    title,
    description,
    robots: { index: rule.indexable, follow: true, googleBot: { index: rule.indexable, follow: true } },
    alternates: {
      canonical: `https://www.educalizando.com.br${canonicalPath}`,
    },
    ...socialMetadata({ title, description, url: canonicalPath }),
  };
}

export default async function CategoryLandingPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  // Validate category existence
  const { categories, categoryRules } = await readSeoPublicCatalog();
  const category = categories.find(c => c.slug === slug);

  if (!category) {
    notFound();
  }

  const rule = categoryRules.get(slug)!;
  const products = await readSeoCategoryProducts(slug);
  const intro = categoryIntroduction(rule.canonicalSlug, category.nome);
  const pageUrl = 'https://www.educalizando.com.br/categorias/' + rule.canonicalSlug;
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `Materiais de ${category.nome}`,
      description: `Materiais classificados em ${category.nome} pelos criadores. Confira o conteúdo e o formato de cada cadastro.`,
      url: pageUrl,
      isPartOf: { '@type': 'WebSite', name: 'Educalizando', url: 'https://www.educalizando.com.br' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://www.educalizando.com.br/' },
        { '@type': 'ListItem', position: 2, name: 'Categorias', item: 'https://www.educalizando.com.br/buscar' },
        { '@type': 'ListItem', position: 3, name: category.nome, item: pageUrl },
      ],
    },
    ...(products.length ? [{
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Materiais de ${category.nome}`,
      itemListElement: products.slice(0, 24).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `https://www.educalizando.com.br/produto/${product.slug || product.id}`,
        name: product.titulo,
      })),
    }] : []),
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa]">
      {structuredData.map((data, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
      ))}
      <MarketplaceHeader />
      
      <main className="flex-1">
        {/* SEO Optimized Header */}
        <section className="bg-white border-b py-12">
          <div className="container mx-auto px-4 max-w-[1200px] text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-[#093b6c] mb-4">
              Materiais de {category.nome}
            </h1>
            <div className="text-gray-600 text-base leading-relaxed max-w-3xl mx-auto text-left space-y-4">
              {intro.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
            </div>
            <p className="mt-5 text-sm text-gray-600">
              {rule.combinedCount === 1 ? '1 material didático publicado' : rule.combinedCount + ' materiais didáticos publicados'} nesta seleção.
              {rule.combinedCount > products.length && <> Exibindo os {products.length} mais recentes. <Link href="/buscar" className="underline">Buscar no catálogo</Link>.</>}
            </p>
          </div>
        </section>

        {/* Product Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-[1200px]">
            {products.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-6 lg:grid-cols-4">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100 max-w-2xl mx-auto">
                <div className="bg-[#f0f7ff] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#093b6c] text-2xl font-semibold">{category.nome.charAt(0)}</span>
                </div>
                <h3 className="text-xl font-bold text-[#093b6c] mb-2">
                  Nenhum material encontrado
                </h3>
                <p className="text-gray-600 mb-6">
                  Ainda não temos materiais disponíveis para a categoria <strong>{category.nome}</strong>. Que tal explorar outros recursos?
                </p>
                <Link 
                  href="/buscar"
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#093b6c] text-white font-medium rounded-lg hover:bg-[#06284a] transition-colors"
                >
                  Ver Todos os Materiais
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
