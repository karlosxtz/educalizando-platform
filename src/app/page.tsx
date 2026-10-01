export const revalidate = 60;

import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import HomepageMarketplace from '@/components/HomepageMarketplace';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import { getActiveBanners } from '@/lib/banners-service';
import { getSchoolCalendarTagsForMonth } from '@/lib/school-calendar';
import { getAllPublicMarketplaceProducts, getAllPublicStores } from '@/lib/store-service';
import { getPublicMarketplaceKits } from '@/lib/marketplace-kit-service';
import { absoluteUrl, DEFAULT_SOCIAL_IMAGE, serializeJsonLd, SITE_URL, socialMetadata } from '@/lib/seo';

const homeTitle = 'Materiais Didáticos Digitais para Professores | Educalizando';
const homeDescription = 'Encontre materiais didáticos digitais, atividades pedagógicas, apostilas, planos de aula e jogos educativos criados por professores.';

async function loadPublicSection<T>(name: string, loader: () => Promise<T[]>): Promise<T[]> {
  try {
    return await loader();
  } catch (error) {
    console.error(`[homepage] Não foi possível carregar ${name}:`, error);
    return [];
  }
}

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: { canonical: '/' },
  ...socialMetadata({ title: homeTitle, description: homeDescription, url: '/' }),
};

export default async function Home() {
  const [products, banners, stores, kits] = await Promise.all([
    loadPublicSection('produtos', () => getAllPublicMarketplaceProducts(100)),
    loadPublicSection('banners', getActiveBanners),
    loadPublicSection('lojas', getAllPublicStores),
    loadPublicSection('kits', () => getPublicMarketplaceKits(8)),
  ]);

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Educalizando',
    url: SITE_URL,
    inLanguage: 'pt-BR',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/buscar?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Educalizando',
    url: SITE_URL,
    logo: absoluteUrl(DEFAULT_SOCIAL_IMAGE),
    description: 'Marketplace brasileiro de materiais didáticos digitais para educadores.',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      telephone: '+55-21-96500-8441',
      availableLanguage: 'Portuguese',
    },
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 selection:bg-violet-700 selection:text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationJsonLd) }} />
      <MarketplaceHeader />
      <HomepageMarketplace banners={banners} products={products} stores={stores} kits={kits} monthlyTags={getSchoolCalendarTagsForMonth()} />
      <Footer />
    </div>
  );
}
