import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { 
  getStoreBySlug, 
  getPublicProductsByStoreId 
} from '@/lib/store-service';
import PublicStoreClientView from './PublicStoreClientView';

// Forçar renderização dinâmica em tempo real no Next.js App Router
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  console.log(`[generateMetadata] Carregando metadados dinâmicos para a loja: "${slug}"`);
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
  console.log(`[PublicStorePage] Solicitando vitrine para a loja: "${slug}"`);
  
  const store = await getStoreBySlug(slug);

  if (!store) {
    console.warn(`[PublicStorePage] Loja "${slug}" não foi encontrada. Retornando 404.`);
    notFound();
  }

  console.log(`[PublicStorePage] Loja encontrada: id=${store.id}, nome="${store.nome_loja}"`);

  const allProducts = await getPublicProductsByStoreId(store.id);
  const products = allProducts.filter(p => !p.is_free && (p.preco || 0) > 0);

  console.log(`[PublicStorePage] Produtos pagos encontrados: ${products.length} (total: ${allProducts.length}) para store.id="${store.id}"`);

  return (
    <PublicStoreClientView store={store} initialProducts={products} />
  );
}
