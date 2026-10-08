import KitDetailClientView from '@/app/loja/[slug]/kit/[id]/KitDetailClientView';
import Footer from '@/components/Footer';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import { getPublicMarketplaceKitById } from '@/lib/marketplace-kit-service';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { alternates: { canonical: `/kit/${encodeURIComponent(id)}` } };
}

export default async function MarketplaceKitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kit = await getPublicMarketplaceKitById(id);
  if (!kit?.store) notFound();
  return <><MarketplaceHeader /><KitDetailClientView store={kit.store} kit={kit} marketplaceView /><Footer /></>;
}
