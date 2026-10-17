import { catalogMetadata, kitStructuredData } from '@/lib/catalog-seo';
import { serializeJsonLd } from '@/lib/seo';
import KitDetailClientView from '@/app/loja/[slug]/kit/[id]/KitDetailClientView';
import Footer from '@/components/Footer';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import { getPublicMarketplaceKitById } from '@/lib/marketplace-kit-service';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const kit = await getPublicMarketplaceKitById(id);
  if (!kit?.store) return { title: 'Combo não encontrado | Educalizando', robots: { index: false, follow: false } };
  return catalogMetadata(kit.titulo, kit.descricao, '/kit/' + encodeURIComponent(id), kit.capa_url);
}

export default async function MarketplaceKitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kit = await getPublicMarketplaceKitById(id);
  if (!kit?.store) notFound();
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(kitStructuredData(kit, kit.store, "/kit/" + encodeURIComponent(id))) }} /><MarketplaceHeader /><KitDetailClientView store={kit.store} kit={kit} marketplaceView /><Footer /></>;
}
