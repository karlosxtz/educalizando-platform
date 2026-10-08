import { getKitById } from '@/lib/kit-service';
import { getStoreBySlug } from '@/lib/store-service';
import { getPublicMarketplaceKitById } from '@/lib/marketplace-kit-service';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import KitDetailClientView from './KitDetailClientView';

interface KitDetailPageProps {
  params: Promise<{
    slug: string;
    id: string;
  }>;
}

export async function generateMetadata({ params }: KitDetailPageProps): Promise<Metadata> {
  const { slug, id } = await params;
  const publicKit = await getPublicMarketplaceKitById(id);
  return {
    alternates: {
      canonical: publicKit?.store
        ? `/kit/${encodeURIComponent(id)}`
        : `/loja/${encodeURIComponent(slug)}/kit/${encodeURIComponent(id)}`,
    },
  };
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
