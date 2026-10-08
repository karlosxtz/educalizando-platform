import StoreAnalytics from '@/components/store/StoreAnalytics';
import { getPublicCreatorClubsByStoreId } from '@/lib/creator-club-service';
import { DEFAULT_SOCIAL_IMAGE,serializeJsonLd,SITE_URL } from '@/lib/seo';
import { getCategories } from '@/lib/category-service';
import { shortSeoTitle, storeSeoDescription } from '@/lib/page-seo';
import {
getPublicProductsByStoreId,
getStoreBySlug
} from '@/lib/store-service';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
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

  const [allProducts, categories] = await Promise.all([getPublicProductsByStoreId(store.id), getCategories(store.id)]);
  const products = allProducts.filter(product => (!product.is_free && Number(product.preco || 0) > 0)
    || (product.is_plr === true && Number(product.preco_plr || 0) > 0 && product.has_plr_delivery === true));
  const counts = new Map<string, number>();
  for (const product of products) if (product.category_id) counts.set(product.category_id, (counts.get(product.category_id) || 0) + 1);
  const categoryId = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
  const category = categories.find(item => item.id === categoryId)?.nome || 'educação';
  const title = shortSeoTitle(store.nome_loja, ' | Materiais Didáticos | Educalizando');
  const description = storeSeoDescription(store.nome_loja, products.length, category);
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    keywords: [store.nome_loja, category, 'materiais didáticos', 'recursos para professores'],
    robots: { index: true, follow: true },
    alternates: {
      canonical: `https://www.educalizando.com.br/loja/${store.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.educalizando.com.br/loja/${store.slug}`,
      siteName: 'Educalizando',
      locale: 'pt_BR',
      type: 'website',
      images: [store.banner_url || store.logo_url || DEFAULT_SOCIAL_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [store.banner_url || store.logo_url || DEFAULT_SOCIAL_IMAGE],
    },
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
  const products = allProducts.filter((product) => {
    const hasStandardOffer = !product.is_free && Number(product.preco || 0) > 0;
    const hasPlrOffer = product.is_plr === true && Number(product.preco_plr || 0) > 0 && product.has_plr_delivery === true;
    return hasStandardOffer || hasPlrOffer;
  });
  const clubs = await getPublicCreatorClubsByStoreId(store.id);

  console.log(`[PublicStorePage] Produtos pagos encontrados: ${products.length} (total: ${allProducts.length}) para store.id="${store.id}"`);

  const pageUrl = `${SITE_URL}/loja/${store.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: store.nome_loja,
        url: pageUrl,
        description: store.descricao || `Confira os materiais didáticos digitais de ${store.nome_loja} na Educalizando.`,
        ...(store.logo_url ? { logo: store.logo_url } : {}),
        ...(store.banner_url ? { image: store.banner_url } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Lojas', item: `${SITE_URL}/lojas` },
          { '@type': 'ListItem', position: 3, name: store.nome_loja, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <PublicStoreClientView store={store} initialProducts={products} initialClubs={clubs} />
      <StoreAnalytics storeId={store.id} metaPixelId={store.meta_pixel_id} googleAnalyticsId={store.google_analytics_id} />
    </>
  );
}
