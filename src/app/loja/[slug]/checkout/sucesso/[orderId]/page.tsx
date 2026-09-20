import { notFound } from 'next/navigation';
import { getStoreBySlug } from '@/lib/store-service';
import OrderSuccessClientView from './OrderSuccessClientView';
import StoreAnalytics from '@/components/store/StoreAnalytics';

interface OrderSuccessPageProps {
  params: Promise<{
    slug: string;
    orderId: string;
  }>;
}

export default async function OrderSuccessPage({ params }: OrderSuccessPageProps) {
  const { slug, orderId } = await params;

  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }

  return (
    <>
      <OrderSuccessClientView
        store={store}
        orderId={orderId}
      />
      <StoreAnalytics storeId={store.id} metaPixelId={store.meta_pixel_id} googleAnalyticsId={store.google_analytics_id} />
    </>
  );
}
