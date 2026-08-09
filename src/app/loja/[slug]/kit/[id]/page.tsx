import { notFound } from 'next/navigation';
import { getStoreBySlug } from '@/lib/store-service';
import { getKitById } from '@/lib/kit-service';
import KitDetailClientView from './KitDetailClientView';

interface KitDetailPageProps {
  params: Promise<{
    slug: string;
    id: string;
  }>;
}

export default async function KitDetailPage({ params }: KitDetailPageProps) {
  const { slug, id } = await params;

  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }

  const kit = await getKitById(id);
  if (!kit) {
    notFound();
  }

  return (
    <KitDetailClientView
      store={store}
      kit={kit}
    />
  );
}
