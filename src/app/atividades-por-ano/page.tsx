import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';

export default function PlaceholderPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <MarketplaceHeader />
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <h1 className="text-3xl font-black text-slate-900 mb-4">Página em Construção</h1>
          <p className="text-slate-500">Estamos trabalhando para trazer novidades em breve.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
