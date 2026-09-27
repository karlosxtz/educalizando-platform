import { notFound } from 'next/navigation';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';
import KitDetailClientView from '@/app/loja/[slug]/kit/[id]/KitDetailClientView';
import { getPublicMarketplaceKitById } from '@/lib/marketplace-kit-service';

export const revalidate = 0;

export default async function MarketplaceKitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kit = await getPublicMarketplaceKitById(id);
  if (!kit?.store) notFound();
  return <><MarketplaceHeader /><KitDetailClientView store={kit.store} kit={kit} marketplaceView /><Footer /></>;
}
