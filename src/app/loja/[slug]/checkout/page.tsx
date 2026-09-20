import { notFound } from 'next/navigation';
import { getStoreBySlug, getProductById } from '@/lib/store-service';
import { getKitById } from '@/lib/kit-service';
import CheckoutClientView from './CheckoutClientView';
import StoreAnalytics from '@/components/store/StoreAnalytics';

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
  let kit = null;
  if (produtoId) {
    product = await getProductById(produtoId);
    if (product?.order_bump_id) {
      const orderBump = await getProductById(product.order_bump_id);
      if (orderBump && orderBump.store_id === store.id && orderBump.status === 'publicado' && !orderBump.excluido_em) {
        product.order_bump_product = orderBump;
      }
    }
  }

  if (kitId) {
    kit = await getKitById(kitId);
    if (!kit || kit.store_id !== store.id || kit.status !== 'publicado' || kit.excluido_em) {
      notFound();
    }
  }

  // Se não tem produto (checkout via carrinho), não tem problema, passamos null
  // Só joga 404 se a loja não existir (já validado acima)

  return (
    <>
      <CheckoutClientView
        store={store}
        product={product}
        kit={kit}
        initialCouponCode={cupom}
      />
      <StoreAnalytics storeId={store.id} metaPixelId={store.meta_pixel_id} googleAnalyticsId={store.google_analytics_id} />
    </>
  );
}
