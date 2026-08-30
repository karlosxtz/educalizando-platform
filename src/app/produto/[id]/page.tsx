import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductById, getStoreById, getPublicProductsByStoreId } from '@/lib/store-service';
import { getCategories, getEducationLevels } from '@/lib/category-service';
import ProductDetailClientView from '../../loja/[slug]/produto/[id]/ProductDetailClientView';

interface GlobalProductDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}
import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';

export async function generateMetadata({ params }: GlobalProductDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  
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
  const { id } = await params;

  let product = await getProductById(id);
  if (!product) {
    notFound();
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

  const jsonLd = {
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
      url: `https://educalizando.com.br/produto/${product.id}`,
    },
    ...(product.average_rating && product.review_count ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.average_rating,
        reviewCount: product.review_count,
      }
    } : {})
  };

  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketplaceHeader />
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
