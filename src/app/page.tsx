export const revalidate = 60;

import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import HomepageMarketplace from '@/components/HomepageMarketplace';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import { getActiveBanners } from '@/lib/banners-service';
import { getSchoolCalendarTagsForMonth } from '@/lib/school-calendar';
import { getAllPublicMarketplaceProducts, getTopMarketplaceStores } from '@/lib/store-service';
import { getPublicMarketplaceKits } from '@/lib/marketplace-kit-service';

export const metadata: Metadata = {
  title: 'Materiais Didáticos Digitais para Professores | Educalizando',
  description: 'Encontre materiais didáticos digitais, atividades pedagógicas, apostilas, planos de aula e jogos educativos criados por professores.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Materiais Didáticos Digitais para Professores | Educalizando',
    description: 'Atividades pedagógicas, apostilas, planos de aula e jogos educativos para o seu planejamento.',
    url: '/',
  },
};

export default async function Home() {
  const [products, banners, stores, kits] = await Promise.all([
    getAllPublicMarketplaceProducts(100),
    getActiveBanners(),
    getTopMarketplaceStores(12),
    getPublicMarketplaceKits(8),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 selection:bg-violet-700 selection:text-white">
      <MarketplaceHeader />
      <HomepageMarketplace banners={banners} products={products} stores={stores} kits={kits} monthlyTags={getSchoolCalendarTagsForMonth()} />
      <Footer />
    </div>
  );
}
