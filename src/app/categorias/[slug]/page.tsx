import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategories } from '@/lib/category-service';
import { searchProducts } from '@/lib/search-service';
import ProductCard from '@/components/ProductCard';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';
import Link from 'next/link';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find(c => c.slug === slug);

  if (!category) {
    return { title: 'Categoria não encontrada | Educalizando' };
  }

  const title = `Atividades e Materiais de ${category.nome} para Imprimir | Educalizando`;
  const description = `Encontre os melhores materiais didáticos e atividades prontas de ${category.nome}. Acesse e baixe recursos pedagógicos desenvolvidos por especialistas para potencializar o aprendizado.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.educalizando.com.br/categorias/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://www.educalizando.com.br/categorias/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function CategoryLandingPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  // Validate category existence
  const categories = await getCategories();
  const category = categories.find(c => c.slug === slug);

  if (!category) {
    notFound();
  }

  // Fetch products for this category
  const result = await searchProducts({
    categoria: slug,
    page: 1,
    sort: 'recentes'
  });

  const products = result.data;
  const pageUrl = `https://www.educalizando.com.br/categorias/${slug}`;
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `Materiais de ${category.nome}`,
      description: `Atividades e materiais didáticos de ${category.nome} para imprimir.`,
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
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      ))}
      <MarketplaceHeader />
      
      <main className="flex-1">
        {/* SEO Optimized Header */}
        <section className="bg-white border-b py-12">
          <div className="container mx-auto px-4 max-w-[1200px] text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-[#093b6c] mb-4">
              Materiais de {category.nome}
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Explore nossa seleção cuidadosamente curada de atividades, e-books e recursos pedagógicos de {category.nome}. Perfeito para professores, pais e educadores.
            </p>
          </div>
        </section>

        {/* Product Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-[1200px]">
            {products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
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
