import Link from 'next/link';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';
import { getAllPublicStores } from '@/lib/store-service';
import { Store } from '@/lib/types';
import { Store as StoreIcon, ChevronRight } from 'lucide-react';

export const revalidate = 0; // Ensures it shuffles on every request, no caching

export default async function LojasPage() {
  const stores = await getAllPublicStores();
  const shuffledStores = [...stores].sort(() => Math.random() - 0.5);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <MarketplaceHeader />

      <main className="flex-1 pt-8">
        {/* Cabeçalho da Página */}
        <section className="bg-slate-50 py-12 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
              Nossos Produtores Parceiros
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Conheça os educadores que criam os melhores materiais da plataforma.
            </p>
          </div>
        </section>

        {/* Grid de Lojas */}
        <section className="py-12 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shuffledStores.map((store: Store) => (
                <div key={store.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_10px_40px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col group hover:-translate-y-1">
                  
                  {/* Banner */}
                  <div className="h-32 w-full bg-gradient-to-r from-slate-100 to-slate-200 relative">
                    {store.banner_url && (
                      <img src={store.banner_url} alt={`Banner de ${store.nome_loja}`} className="w-full h-full object-cover" />
                    )}
                  </div>

                  {/* Corpo do Card e Logo */}
                  <div className="p-6 pt-0 flex flex-col flex-1 relative">
                    {/* Logo Sobreposta */}
                    <div className="w-16 h-16 rounded-full bg-white border-4 border-white shadow-sm overflow-hidden flex items-center justify-center -mt-8 mb-4 relative z-10">
                      {store.logo_url ? (
                        <img src={store.logo_url} alt={`Logo de ${store.nome_loja}`} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-black text-slate-400">
                          {store.nome_loja.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-1">
                      {store.nome_loja}
                    </h2>
                    
                    <p className="text-sm text-slate-500 line-clamp-3 mb-6 flex-1">
                      {store.descricao || 'Conheça os materiais exclusivos deste produtor.'}
                    </p>

                    <div className="mt-auto">
                      <Link 
                        href={`/loja/${store.slug}`}
                        className="inline-flex w-full justify-center items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-sm font-bold transition-colors"
                      >
                        <StoreIcon className="w-4 h-4" /> Visitar Loja <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {shuffledStores.length === 0 && (
              <div className="text-center py-20">
                <StoreIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-900">Nenhuma loja encontrada</h3>
                <p className="text-slate-500 mt-2">Ainda não temos produtores parceiros cadastrados.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
