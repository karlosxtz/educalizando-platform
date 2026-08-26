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

  return (
    <div className="flex flex-col min-h-screen">
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
