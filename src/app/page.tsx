export const revalidate = 60;

import Footer from '@/components/Footer';
import HomepageMarketplace from '@/components/HomepageMarketplace';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import { getActiveBanners } from '@/lib/banners-service';
import { getPublicMarketplaceKits } from '@/lib/marketplace-kit-service';
import { getSchoolCalendarTagsForMonth } from '@/lib/school-calendar';
import { absoluteUrl,DEFAULT_SOCIAL_IMAGE,serializeJsonLd,SITE_URL } from '@/lib/seo';
import { getAllPublicMarketplaceProducts,getAllPublicStores } from '@/lib/store-service';
import { pageMetadata } from '@/lib/page-seo';

async function loadPublicSection<T>(name: string, loader: () => Promise<T[]>): Promise<T[]> {
  try {
    return await loader();
  } catch (error) {
    console.error(`[homepage] Não foi possível carregar ${name}:`, error);
    return [];
  }
}

export function generateMetadata() { return pageMetadata('/'); }

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
    '@id': `${SITE_URL}/#website`,
    name: 'Educalizando',
    alternateName: ['Educalizando Plataforma Digital', 'Educalizando Digital'],
    url: `${SITE_URL}/`,
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
