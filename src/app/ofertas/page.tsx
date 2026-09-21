import Link from 'next/link';
import { BadgePercent, ChevronLeft, Sparkles } from 'lucide-react';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import ProductCard from '@/components/ProductCard';
import Footer from '@/components/Footer';
import { getAllPublicMarketplaceProducts } from '@/lib/store-service';
import { getSchoolCalendarTagsForMonth } from '@/lib/school-calendar';

export const revalidate = 60;

export const metadata = {
  title: 'Oferta em Destaque | Educalizando',
  description: 'Materiais didáticos digitais com preço promocional cadastrados pelos criadores da Educalizando.'
};

export default async function OffersPage() {
  const monthlyTags = getSchoolCalendarTagsForMonth();
  const products = (await getAllPublicMarketplaceProducts(120))
    .filter((product) => !product.is_free && Number(product.preco_original || 0) > Number(product.preco || 0))
    .sort((a, b) => {
      const aSeasonal = a.seasonal_tags?.some((tag) => monthlyTags.includes(tag as typeof monthlyTags[number])) ? 1 : 0;
      const bSeasonal = b.seasonal_tags?.some((tag) => monthlyTags.includes(tag as typeof monthlyTags[number])) ? 1 : 0;
      return bSeasonal - aSeasonal;
    });

  return <div className="min-h-screen bg-slate-50 text-slate-900"><MarketplaceHeader />
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 sm:py-12">
      <Link href="/" className="mb-6 inline-flex items-center gap-1 text-sm font-bold text-slate-600 hover:text-blue-700"><ChevronLeft className="h-4 w-4" /> Voltar ao marketplace</Link>
      <section className="mb-8 rounded-[2rem] bg-gradient-to-br from-orange-500 via-rose-500 to-pink-600 p-6 text-white shadow-xl sm:p-10">
        <p className="mb-3 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase tracking-wider"><Sparkles className="h-3.5 w-3.5" /> Seleção rotativa</p>
        <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight sm:text-5xl"><BadgePercent className="h-9 w-9 sm:h-12 sm:w-12" /> Oferta em Destaque</h1>
        <p className="mt-3 max-w-2xl text-sm font-medium text-white/90 sm:text-base">Materiais com preço original e valor promocional definidos diretamente pelos criadores. A seleção prioriza temas relevantes do calendário escolar.</p>
      </section>
      {products.length ? <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-6 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center"><BadgePercent className="mx-auto mb-4 h-10 w-10 text-slate-300" /><h2 className="text-lg font-black">Ainda não há ofertas em destaque</h2><p className="mt-2 text-sm text-slate-500">Quando um criador cadastrar um preço original maior que o preço de venda, o material aparecerá aqui.</p></div>}
    </main><Footer />
  </div>;
}
