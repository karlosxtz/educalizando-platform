import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoreBySlug, getProductById, getPublicProductsByStoreId } from '@/lib/store-service';
import { getCategories, getEducationLevels } from '@/lib/category-service';
import ProductDetailClientView from './ProductDetailClientView';

interface ProductDetailPageProps {
  params: Promise<{
    slug: string;
    id: string;
  }>;
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { id, slug } = await params;
  
  let product = await getProductById(id);
  const store = await getStoreBySlug(slug);

  if (!product && store) {
    const { getPublicProductsByStoreId } = await import('@/lib/store-service');
    const storeProducts = await getPublicProductsByStoreId(store.id);
    const cleanId = id.replace(/^prod_/i, '');
    product = storeProducts.find(p => p.id === id || p.id === cleanId || p.id === `prod_${cleanId}`) || null;
  }
  
  if (!product) {
    return { title: 'Produto não encontrado | Educalizando' };
  }

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

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug, id } = await params;

  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }

  let product = await getProductById(id);
  if (!product) {
    const { getPublicProductsByStoreId } = await import('@/lib/store-service');
    const storeProducts = await getPublicProductsByStoreId(store.id);
    const cleanId = id.replace(/^prod_/i, '');
    product = storeProducts.find(p => p.id === id || p.id === cleanId || p.id === `prod_${cleanId}`) || null;
  }

  if (!product) {
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
      url: `https://educalizando.com.br/loja/${store.slug}/produto/${product.id}`,
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClientView 
        store={store} 
        product={product} 
        category={category} 
        educationLevel={educationLevel}
        context="store"
        relatedProducts={relatedProducts}
      />
    </>
  );
}
