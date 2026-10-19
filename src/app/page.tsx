export const revalidate = 3600;

import Footer from '@/components/Footer';
import { HomeFaq } from '@/components/HomeBrandContent';
import { HOME_FAQ } from '@/lib/home-content';
import HomeCatalogSkeleton from '@/components/HomeCatalogSkeleton';
import { Suspense } from 'react';
import HomepageMarketplace from '@/components/HomepageMarketplace';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import { getActiveBanners } from '@/lib/banners-service';
import { getPublicMarketplaceKits } from '@/lib/marketplace-kit-service';
import { getSchoolCalendarTagsForMonth } from '@/lib/school-calendar';
import { absoluteUrl,serializeJsonLd,SITE_URL } from '@/lib/seo';
import { getAllPublicMarketplaceProducts,getAllPublicStores } from '@/lib/store-service';
import { pageMetadata } from '@/lib/page-seo';
import { homepageKit, homepageProduct, homepageStore } from '@/lib/homepage-presentation';

async function loadPublicSection<T>(name: string, loader: () => Promise<T[]>): Promise<T[]> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      loader(),
      new Promise<T[]>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Tempo de carregamento excedido: ${name}`)), 15_000);
      }),
    ]);
  } catch (error) {
    console.error(`[homepage] Não foi possível carregar ${name}:`, error);
    return [];
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function generateMetadata() { return pageMetadata('/'); }

async function HomeCatalog() {
  const [products, banners, stores, kits] = await Promise.all([
    loadPublicSection('produtos', () => getAllPublicMarketplaceProducts(100, 'cards')),
    loadPublicSection('banners', getActiveBanners),
    loadPublicSection('lojas', getAllPublicStores),
    loadPublicSection('kits', () => getPublicMarketplaceKits(8)),
  ]);

  return <HomepageMarketplace banners={banners} products={products.map(homepageProduct)} stores={stores.map(homepageStore)} kits={kits.map(homepageKit)} monthlyTags={getSchoolCalendarTagsForMonth()} />;
}

export default function Home() {

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
    '@id': SITE_URL + '/#organization',
    name: 'Educalizando',
    url: SITE_URL,
    logo: absoluteUrl('/branding/logo-educalizando-icon-512.png'),
    description: 'Marketplace brasileiro de materiais didáticos digitais para educadores.',
    sameAs: [
      'https://www.instagram.com/educalizando_brasil/',
      'https://www.youtube.com/@educalizandobrasil',
      'https://www.tiktok.com/@educalizando_',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      telephone: '+55-21-96500-8441',
      availableLanguage: 'Portuguese',
    },
  };

  return (
    <div className="flex min-h-screen flex-col home-public bg-[#fcfcf9] font-sans text-slate-900 selection:bg-violet-700 selection:text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: HOME_FAQ.map(item => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })),
      }) }} />
      <MarketplaceHeader />

      <Suspense fallback={<HomeCatalogSkeleton />}><HomeCatalog /></Suspense>
      <HomeFaq />
      <Footer />
    </div>
  );
}
