import { notFound } from 'next/navigation';
import { getStoreBySlug, getProductById } from '@/lib/store-service';
import { getCategories, getEducationLevels } from '@/lib/category-service';
import ProductDetailClientView from './ProductDetailClientView';

interface ProductDetailPageProps {
  params: Promise<{
    slug: string;
    id: string;
  }>;
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

  const [categories, educationLevels] = await Promise.all([
    getCategories(store.id),
    getEducationLevels()
  ]);

  const category = categories.find(c => c.id === product.category_id) || null;
  const educationLevel = educationLevels.find(e => e.id === product.education_level_id) || null;

  return (
    <ProductDetailClientView
      store={store}
      product={product}
      category={category}
      educationLevel={educationLevel}
    />
  );
}
