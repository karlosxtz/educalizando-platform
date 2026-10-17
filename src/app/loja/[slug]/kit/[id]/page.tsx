import { catalogMetadata } from '@/lib/catalog-seo';
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
  if (!publicKit?.store || publicKit.store.slug !== slug) notFound();
  return catalogMetadata(publicKit.titulo + ' — ' + publicKit.store.nome_loja, publicKit.descricao, '/loja/' + encodeURIComponent(slug) + '/kit/' + encodeURIComponent(id), publicKit.capa_url);
}

export default async function KitDetailPage({ params }: KitDetailPageProps) {
  const { slug, id } = await params;

  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }

  const kit = await getKitById(id);
  if (!kit || kit.store_id !== store.id || kit.status !== 'publicado' || kit.excluido_em) {
    notFound();
  }

  return (
    <KitDetailClientView
      store={store}
      kit={kit}
    />
  );
}
