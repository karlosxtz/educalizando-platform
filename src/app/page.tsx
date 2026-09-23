export const revalidate = 60;

import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import HomepageMarketplace from '@/components/HomepageMarketplace';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import { getActiveBanners } from '@/lib/banners-service';
import { getSchoolCalendarTagsForMonth } from '@/lib/school-calendar';
import { getAllPublicMarketplaceProducts, getTopMarketplaceStores } from '@/lib/store-service';

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
  const [products, banners, stores] = await Promise.all([
    getAllPublicMarketplaceProducts(100),
    getActiveBanners(),
    getTopMarketplaceStores(12),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 selection:bg-violet-700 selection:text-white">
      <MarketplaceHeader />
      <HomepageMarketplace banners={banners} products={products} stores={stores} monthlyTags={getSchoolCalendarTagsForMonth()} />
      <Footer />
    </div>
  );
}
