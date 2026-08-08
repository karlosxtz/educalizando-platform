import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { 
  getStoreBySlug, 
  getPublicProductsByStoreId 
} from '@/lib/store-service';
import PublicStoreClientView from './PublicStoreClientView';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);

  if (!store) {
    return {
      title: 'Loja Não Encontrada — Educalizando',
      description: 'A loja solicitada não foi encontrada na plataforma Educalizando.'
    };
  }

  return {
    title: `${store.nome_loja} — Educalizando`,
    description: store.descricao || `Confira os materiais didáticos digitais de ${store.nome_loja} na Educalizando.`,
    openGraph: {
      title: `${store.nome_loja} — Materiais Didáticos Digitais`,
      description: store.descricao || `Confira os materiais didáticos de ${store.nome_loja} com PIX instantâneo.`,
      images: store.logo_url ? [{ url: store.logo_url }] : []
    }
  };
}

export default async function PublicStorePage({ params }: PageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);

  if (!store) {
    notFound();
  }

  const products = await getPublicProductsByStoreId(store.id);

  return (
    <PublicStoreClientView store={store} initialProducts={products} />
  );
}
