import { notFound } from 'next/navigation';
import { getStoreBySlug } from '@/lib/store-service';
import OrderSuccessClientView from './OrderSuccessClientView';

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
    <OrderSuccessClientView
      store={store}
      orderId={orderId}
    />
  );
}
