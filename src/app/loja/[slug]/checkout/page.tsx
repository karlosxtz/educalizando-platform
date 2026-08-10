import { notFound } from 'next/navigation';
import { getStoreBySlug, getProductById } from '@/lib/store-service';
import CheckoutClientView from './CheckoutClientView';

interface CheckoutPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ produtoId?: string; kitId?: string; cupom?: string }>;
}

export default async function StoreCheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const { slug } = await params;
  const { produtoId, kitId, cupom } = await searchParams;

  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }

  let product = null;
  if (produtoId) {
    product = await getProductById(produtoId);
  }

  // Se nenhum produto foi selecionado especificamente, usa o primeiro produto publicado da loja para teste
  if (!product) {
    const { getProductsByStoreId } = await import('@/lib/store-service');
    const prods = await getProductsByStoreId(store.id);
    product = prods[0] || null;
  }

  if (!product) {
    notFound();
  }

  return (
    <CheckoutClientView
      store={store}
      product={product}
      initialCouponCode={cupom}
    />
  );
}
