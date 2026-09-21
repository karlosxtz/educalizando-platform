import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';
import SearchSidebar from '@/components/SearchSidebar';
import ProductCard from '@/components/ProductCard';
import StoreCard from '@/components/StoreCard';
import { searchProducts } from '@/lib/search-service';
import { getTopMarketplaceStores } from '@/lib/store-service';
import { INITIAL_GLOBAL_CATEGORIES, INITIAL_EDUCATION_LEVELS } from '@/lib/category-service';
import { Frown, Sparkles } from 'lucide-react';
import { getDisciplines } from '@/lib/discipline-service';
import { searchHref, searchPage } from '@/lib/search-navigation';
import SearchSort from '@/components/SearchSort';
import SearchQuery from './SearchQuery';
import Link from 'next/link';
import { SCHOOL_CALENDAR_TAGS } from '@/lib/school-calendar';

export const revalidate = 0;

export default async function BuscarPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ q?: string, categoria?: string, preco?: string, ano_escolar?: string, disciplina?: string, formato?: string, sort?: string, filter?: string, data?: string, page?: string }>
}) {
  const resolvedParams = await searchParams;
  const { q, categoria, preco, ano_escolar, disciplina, formato, sort, filter, data } = resolvedParams;
  const isPlrMarketplace = filter === 'plr';
  const page = searchPage(resolvedParams.page);
  const query = new URLSearchParams(Object.entries(resolvedParams).filter((entry): entry is [string, string] => typeof entry[1] === 'string')).toString();
  const disciplines = await getDisciplines();
  const activeFilters = [
    { key: 'q', value: q, label: `Busca: ${q}` },
    { key: 'categoria', value: categoria, label: INITIAL_GLOBAL_CATEGORIES.find(c => c.slug === categoria)?.nome || categoria },
    { key: 'ano_escolar', value: ano_escolar, label: INITIAL_EDUCATION_LEVELS.find(e => e.slug === ano_escolar)?.nome || ano_escolar },
    { key: 'disciplina', value: disciplina, label: disciplina },
    { key: 'formato', value: formato, label: formato?.toUpperCase() },
    { key: 'preco', value: preco, label: preco === 'gratis' ? 'Produto final grátis' : 'Produto final pago' },
    { key: 'filter', value: filter, label: filter === 'plr' ? 'Licença PLR' : filter },
    { key: 'data', value: data, label: data },
  ].filter(item => item.value);

  // Realiza a busca no service
  const { data: products, count, totalPages } = await searchProducts({
    q, categoria, preco, ano_escolar, disciplina, formato, sort, filter, data, page
  });

  // Resolve título dinâmico da página
  let pageTitle = "Todos os Materiais";
  let pageSubtitle = "Encontre materiais por categoria, etapa escolar, disciplina e formato.";

  if (isPlrMarketplace) {
    pageTitle = 'Licenças PLR (Direitos de Revenda)';
    pageSubtitle = 'Compare o valor do produto final e o valor da licença para revenda.';
  } else if (preco === 'gratis') {
    pageTitle = 'Materiais Gratuitos';
    pageSubtitle = 'Resgate materiais digitais gratuitos e acesse-os pela sua área de cliente.';
  } else if (q) {
    pageTitle = `Resultados para: "${q}"`;
    pageSubtitle = `Encontramos ${count} material(is) relacionado(s) à sua busca.`;
  } else if (categoria) {
    const catName = INITIAL_GLOBAL_CATEGORIES.find(c => c.slug === categoria)?.nome || categoria;
    pageTitle = `Explorando: ${catName}`;
    pageSubtitle = `Encontramos ${count} material(is) nesta categoria.`;
  }
  if (sort === 'popular' && !q && !categoria && !isPlrMarketplace) {
    pageTitle = 'Materiais mais acessados';
    pageSubtitle = 'Uma seleção dos materiais que mais despertam interesse na plataforma.';
  }
  if (data && SCHOOL_CALENDAR_TAGS.includes(data as typeof SCHOOL_CALENDAR_TAGS[number])) {
    pageTitle = `Materiais para: ${data}`;
    pageSubtitle = `Encontre materiais preparados para esta data ou projeto escolar.`;
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
            <h1 className="break-words [overflow-wrap:anywhere] text-2xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">
              {pageTitle}
            </h1>
            <p className="text-slate-500 font-medium text-sm md:text-base">
              {pageSubtitle}
            </p>
            <SearchQuery />
          </div>
        </div>

        {/* Layout com Sidebar e Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <details className="mb-6 rounded-xl border border-slate-200 bg-white p-3"><summary className="min-h-11 cursor-pointer py-3 text-sm font-bold text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-600">Explorar datas e campanhas</summary><div className="flex flex-wrap gap-2 pt-2">
            {SCHOOL_CALENDAR_TAGS.map((tag) => <Link key={tag} href={searchHref(query, { data: data === tag ? null : tag })} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${data === tag ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'}`}>{tag}</Link>)}
          </div></details>
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Sidebar Esquerda (Filtros) */}
            <div className="w-full min-w-0 lg:w-64 lg:shrink-0">
              <SearchSidebar disciplines={disciplines} />
            </div>

            {/* Conteúdo Principal (Resultados) */}
            <div className="min-w-0 flex-1 w-full">
              {activeFilters.length > 0 && <nav aria-label="Filtros ativos" className="mb-5 flex flex-wrap items-center gap-2">
                {activeFilters.map(item => <Link key={item.key} href={searchHref(query, { [item.key]: null })} aria-label={`Remover filtro: ${item.label}`} className="inline-flex max-w-full min-h-11 items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 focus-visible:outline-2 focus-visible:outline-blue-600"><span className="min-w-0 [overflow-wrap:anywhere]">{item.label}</span><span aria-hidden="true">×</span></Link>)}
                <Link href="/buscar" className="inline-flex min-h-11 items-center px-2 text-sm font-bold text-blue-700 underline">Limpar tudo</Link>
              </nav>}
              
              {/* Barra de Ordenação */}
              {(
                <div className="flex flex-wrap items-center justify-between bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm gap-4">
                  <span className="text-sm font-bold text-slate-600">
                    {count} {count === 1 ? 'resultado' : 'resultados'}
                  </span>
                  
                  <SearchSort />
                </div>
              )}

              {/* Grid de Produtos */}
              {count > 0 ? (
                <>
                  <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-6 xl:grid-cols-3">
                    {products.map(product => (
                      <ProductCard key={product.id} product={product} purchaseMode={isPlrMarketplace ? 'plr' : 'standard'} />
                    ))}
                  </div>

                  {/* Paginação */}
                  {totalPages > 1 && (
                    <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
                      {page > 1 && <Link href={searchHref(query, { page: String(page - 1) })} className="px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-600 font-bold">Anterior</Link>}
                      <span className="px-4 py-2 text-sm font-bold text-slate-900">
                        Página {page} de {totalPages}
                      </span>
                      {page < totalPages && <Link href={searchHref(query, { page: String(page + 1) })} className="px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-600 font-bold">Próxima</Link>}
                    </div>
                  )}
                </>
              ) : (
                /* Empty State Premium */
                <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-3xl p-5 sm:p-12 text-center shadow-sm">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <Frown className="w-10 h-10 text-slate-300" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Poxa, não encontramos materiais exatos.</h2>
                  <p className="text-slate-500 max-w-md mx-auto mb-8">
                    Tente remover alguns filtros ou pesquisar por termos mais amplos, como alfabetização ou jogos.
                  </p>
                  <Link href={q ? searchHref('', { q }) : '/buscar'} className="inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-5 py-3 font-bold text-white">{q ? 'Buscar este termo sem filtros' : 'Ver todos os materiais'}</Link>
                  <p className="mt-6 mb-3 text-sm text-slate-500">Ou explore outro tema:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['Alfabetização', 'Matemática', 'Jogos'].map(term => <Link key={term} href={searchHref('', { q: term, filter: isPlrMarketplace ? 'plr' : null })} className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-semibold text-blue-700">{term}</Link>)}
                  </div>
                  
                  {/* Recuperação de Vendas: Produtores Top */}
                  {topStores.length > 0 && (
                    <div className="w-full mt-8 pt-8 border-t border-slate-100 text-left">
                      <div className="flex items-center gap-2 mb-6 justify-center text-center">
                        <Sparkles className="w-6 h-6 text-amber-500" />
                        <h3 className="text-xl font-bold text-slate-900">Que tal explorar materiais destes criadores?</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
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
