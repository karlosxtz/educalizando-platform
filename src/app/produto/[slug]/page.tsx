import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getProductById, getStoreById, getPublicProductsByStoreId } from '@/lib/store-service';
import { getCategories, getEducationLevels } from '@/lib/category-service';
import ProductDetailClientView from '../../loja/[slug]/produto/[produtoSlug]/ProductDetailClientView';

interface GlobalProductDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';

export async function generateMetadata({ params }: GlobalProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductById(slug);
  
  if (!product) {
    return { title: 'Produto não encontrado | Educalizando' };
  }

  const store = await getStoreById(product.store_id);
  const title = `${product.titulo} | ${store?.nome_loja || 'Educalizando'}`;
  const description = product.descricao ? (product.descricao.substring(0, 155) + (product.descricao.length > 155 ? '...' : '')) : 'Material didático digital de alta qualidade.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.capa_url ? [{ url: product.capa_url }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.capa_url ? [product.capa_url] : [],
    },
  };
}

export default async function GlobalProductDetailPage({ params }: GlobalProductDetailPageProps) {
  const { slug } = await params;

  let product = await getProductById(slug);
  if (!product) {
    notFound();
  }

  // Redirecionamento SEO (301) se a URL atual não for o slug oficial (acesso via UUID)
  if (product.slug && slug !== product.slug) {
    redirect(`/produto/${product.slug}`);
  }

  const store = await getStoreById(product.store_id);
  if (!store) {
    notFound();
  }

  if (product.order_bump_id) {
    const bump = await getProductById(product.order_bump_id);
    if (bump && !bump.excluido_em && bump.status === 'publicado') {
      product.order_bump_product = bump;
    }
  }

  const [categories, educationLevels] = await Promise.all([
    getCategories(store.id),
    getEducationLevels()
  ]);

  const category = categories.find(c => c.id === product?.category_id) || null;
  const educationLevel = educationLevels.find(e => e.id === product?.education_level_id) || null;

  const storeProducts = await getPublicProductsByStoreId(store.id);
  const relatedProducts = storeProducts
    .filter(p => p.id !== product.id)
    .slice(0, 4);

  // Breadcrumb structure
  const breadcrumbItems = [
    { label: 'Início', href: '/' }
  ];
  
  if (category) {
    breadcrumbItems.push({ label: category.nome, href: `/categorias/${category.slug || category.id}` });
  } else if (educationLevel) {
    breadcrumbItems.push({ label: educationLevel.nome, href: `/atividades-por-ano/${educationLevel.slug || educationLevel.id}` });
  } else {
    breadcrumbItems.push({ label: 'Produtos', href: '/buscar' });
  }
  
  breadcrumbItems.push({ label: product.titulo, href: `/produto/${product.slug || product.id}` });

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.titulo,
    description: product.descricao || 'Material didático digital.',
    image: product.capa_url ? [product.capa_url] : [],
    sku: product.id,
    offers: {
      '@type': 'Offer',
      price: product.preco,
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      url: `https://educalizando.com.br/produto/${product.slug || product.id}`,
    },
    ...(product.average_rating && product.review_count ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.average_rating,
        reviewCount: product.review_count,
      }
    } : {})
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: `https://educalizando.com.br${item.href}`
    }))
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <MarketplaceHeader />
      
      {/* Visual Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center text-sm text-slate-500 overflow-x-auto whitespace-nowrap hide-scrollbar">
            {breadcrumbItems.map((item, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <ChevronRight className="w-4 h-4 mx-2 text-slate-400 flex-shrink-0" />}
                {index === 0 ? (
                  <Link href={item.href} className="hover:text-blue-600 transition-colors flex items-center gap-1">
                    <Home className="w-4 h-4" />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                ) : index === breadcrumbItems.length - 1 ? (
                  <span className="font-medium text-slate-900 truncate max-w-[200px] sm:max-w-[400px]">
                    {item.label}
                  </span>
                ) : (
                  <Link href={item.href} className="hover:text-blue-600 transition-colors">
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex-1">
        <ProductDetailClientView
          store={store}
          product={product}
          category={category}
          educationLevel={educationLevel}
          context="marketplace"
          relatedProducts={relatedProducts}
        />
      </div>
      <Footer />
    </div>
  );
}
