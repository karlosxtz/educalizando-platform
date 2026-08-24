import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';
import SearchSidebar from '@/components/SearchSidebar';
import ProductCard from '@/components/ProductCard';
import StoreCard from '@/components/StoreCard';
import { searchProducts } from '@/lib/search-service';
import { getTopMarketplaceStores } from '@/lib/store-service';
import { INITIAL_GLOBAL_CATEGORIES } from '@/lib/category-service';
import { Store as StoreIcon, Frown, Sparkles } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

export default async function BuscarPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ q?: string, categoria?: string, preco?: string, ano_escolar?: string, formato?: string, sort?: string, page?: string }> 
}) {
  const resolvedParams = await searchParams;
  const { q, categoria, preco, ano_escolar, formato, sort } = resolvedParams;
  const page = resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1;

  // Realiza a busca no service
  const { data: products, count, totalPages } = await searchProducts({
    q, categoria, preco, ano_escolar, formato, sort, page
  });

  // Resolve título dinâmico da página
  let pageTitle = "Todos os Materiais";
  let pageSubtitle = "Explore o maior catálogo de materiais didáticos do Brasil.";

  if (q) {
    pageTitle = `Resultados para: "${q}"`;
    pageSubtitle = `Encontramos ${count} material(is) relacionado(s) à sua busca.`;
  } else if (categoria) {
    const catName = INITIAL_GLOBAL_CATEGORIES.find(c => c.slug === categoria)?.nome || categoria;
    pageTitle = `Explorando: ${catName}`;
    pageSubtitle = `Encontramos ${count} material(is) nesta categoria.`;
  }

  // Se não encontrou produtos, busca top stores para recuperação de UX
  const topStores = count === 0 ? await getTopMarketplaceStores(4) : [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <MarketplaceHeader />

      <main className="flex-1">
        {/* Cabeçalho de Resultados */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">
              {pageTitle}
            </h1>
            <p className="text-slate-500 font-medium text-sm md:text-base">
              {pageSubtitle}
            </p>
          </div>
        </div>

        {/* Layout com Sidebar e Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Sidebar Esquerda (Filtros) */}
            <div className="w-full lg:w-auto">
              <SearchSidebar />
            </div>

            {/* Conteúdo Principal (Resultados) */}
            <div className="flex-1 w-full">
              
              {/* Barra de Ordenação */}
              {count > 0 && (
                <div className="flex flex-wrap items-center justify-between bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm gap-4">
                  <span className="text-sm font-bold text-slate-600">
                    {count} {count === 1 ? 'resultado' : 'resultados'}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-500">Ordenar por:</span>
                    <select className="text-sm border-none bg-slate-50 font-bold text-slate-900 rounded-lg focus:ring-0 cursor-pointer py-1.5 px-3">
                      <option value="relevancia">Relevância</option>
                      <option value="menor-preco">Menor Preço</option>
                      <option value="maior-preco">Maior Preço</option>
                      <option value="recentes">Mais Recentes</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Grid de Produtos */}
              {count > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {products.map(product => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {/* Paginação */}
                  {totalPages > 1 && (
                    <div className="mt-12 flex items-center justify-center gap-2">
                      <button disabled={page === 1} className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-50">Anterior</button>
                      <span className="px-4 py-2 text-sm font-bold text-slate-900">
                        Página {page} de {totalPages}
                      </span>
                      <button disabled={page === totalPages} className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-50">Próxima</button>
                    </div>
                  )}
                </>
              ) : (
                /* Empty State Premium */
                <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <Frown className="w-10 h-10 text-slate-300" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Poxa, não encontramos materiais exatos.</h2>
                  <p className="text-slate-500 max-w-md mx-auto mb-8">
                    Tente remover alguns filtros ou pesquisar por termos mais amplos (ex: "Alfabetização" em vez de "Alfabetização sílabas complexas pdf").
                  </p>
                  
                  {/* Recuperação de Vendas: Produtores Top */}
                  {topStores.length > 0 && (
                    <div className="w-full mt-8 pt-8 border-t border-slate-100 text-left">
                      <div className="flex items-center gap-2 mb-6 justify-center text-center">
                        <Sparkles className="w-6 h-6 text-amber-500" />
                        <h3 className="text-xl font-bold text-slate-900">Que tal explorar materiais destes criadores?</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {topStores.slice(0, 2).map(store => (
                          <StoreCard key={store.id} store={store} />
                        ))}
                      </div>
                      <div className="text-center mt-6">
                        <Link href="/lojas" className="text-blue-600 font-bold hover:underline">Ver todos os produtores parceiros →</Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
