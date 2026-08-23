import Link from 'next/link';
import { Search, ShoppingCart, TrendingUp, BookOpen, Baby, Gift, Rocket, ChevronRight, Store as StoreIcon, Boxes, Star } from 'lucide-react';
import { getAllPublicMarketplaceProducts, getTopMarketplaceStores } from '@/lib/store-service';
import { Product } from '@/lib/types';
import { Store } from '@/lib/types';

// Helper Component for the Product Card
function ProductCard({ product }: { product: Product & { store?: Store } }) {
  const itemTitle = product.titulo || 'Material Didático';
  const itemCover = product.capa_url || null;
  const storeName = product.store?.nome_loja || 'Loja Parceira';
  const isFree = product.is_free || product.preco === 0;
  
  // Format price
  let priceDisplay = 'Grátis';
  if (!isFree && product.preco) {
    priceDisplay = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco);
  }

  // Target link
  const storeSlug = product.store?.slug || product.store_id;
  const productLink = `/loja/${storeSlug}/produto/${product.id}`;

  return (
    <Link href={productLink} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full hover:-translate-y-1">
      {/* Imagem (Capa) */}
      <div className="aspect-[4/3] sm:aspect-square w-full bg-slate-100 relative overflow-hidden">
        {itemCover ? (
          <img src={itemCover} alt={itemTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
            <BookOpen className="w-12 h-12" />
          </div>
        )}
        {/* Badge PLR ou Grátis */}
        {product.is_plr && (
          <div className="absolute top-3 left-3 bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-md flex items-center gap-1">
            <Rocket className="w-3 h-3" /> Revenda
          </div>
        )}
        {!product.is_plr && isFree && (
          <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-md flex items-center gap-1">
            <Gift className="w-3 h-3" /> Grátis
          </div>
        )}
      </div>

      {/* Corpo do Card */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-slate-900 text-base line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors mb-1">
          {itemTitle}
        </h3>
        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1.5 mb-4">
          <StoreIcon className="w-3.5 h-3.5" />
          <span className="truncate">{storeName}</span>
        </p>

        {/* Preço e Botão */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <span className={`text-lg font-black ${isFree ? 'text-emerald-600' : 'text-slate-900'}`}>
            {priceDisplay}
          </span>
          <span className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm group-hover:bg-blue-700 transition-colors">
            Ver Material
          </span>
        </div>
      </div>
    </Link>
  );
}

function StoreCard({ store }: { store: Store }) {
  return (
    <Link href={`/loja/${store.slug}`} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col p-6 hover:-translate-y-1">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shadow-sm">
          {store.logo_url ? (
            <img src={store.logo_url} alt={store.nome_loja} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-black text-slate-400">{store.nome_loja.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 text-lg truncate group-hover:text-blue-600 transition-colors">
            {store.nome_loja}
          </h3>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-[11px] font-bold text-amber-500">5.0</span>
            <span className="text-[11px] text-slate-500 ml-1">Top Criador</span>
          </div>
        </div>
      </div>
      {store.descricao ? (
        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed flex-1 mb-6">
          {store.descricao}
        </p>
      ) : (
        <p className="text-sm text-slate-400 italic flex-1 mb-6">
          Materiais didáticos de excelência.
        </p>
      )}
      <div className="mt-auto">
        <span className="inline-flex w-full justify-center items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors">
          Visitar Loja <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}

export default async function Home() {
  // 1. Buscar dados no lado do servidor
  const allProducts = await getAllPublicMarketplaceProducts(100);
  const topStores = await getTopMarketplaceStores(4);

  // 2. Filtrar as prateleiras
  const produtosEmAlta = allProducts.slice(0, 8);
  const produtosGratuitos = allProducts.filter(p => p.is_free === true || p.preco === 0).slice(0, 4);
  const produtosPLR = allProducts.filter(p => p.is_plr === true).slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* 1. Cabeçalho de Marketplace (Header B2C) */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between h-auto md:h-20 py-4 md:py-0 gap-4">
            
            {/* Esquerda: Logo */}
            <div className="flex items-center justify-between w-full md:w-auto">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="bg-blue-600 text-white p-1.5 sm:p-2 rounded-xl group-hover:bg-blue-700 transition-colors">
                  <span className="font-black text-lg sm:text-xl leading-none block">E</span>
                </div>
                <span className="font-black text-xl sm:text-2xl tracking-tight text-slate-800">
                  Educalizando
                </span>
              </Link>
              
              {/* Carrinho Mobile */}
              <div className="flex md:hidden items-center">
                <Link href="/carrinho" className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-colors relative">
                  <ShoppingCart className="w-6 h-6" />
                  <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
                    0
                  </span>
                </Link>
              </div>
            </div>

            {/* Centro: Barra de Pesquisa Global */}
            <div className="flex-1 w-full max-w-2xl px-0 md:px-6">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-11 pr-4 py-3 sm:py-3.5 bg-slate-100/80 border border-slate-200 rounded-full leading-5 text-slate-900 placeholder-slate-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium shadow-inner"
                  placeholder="O que você procura hoje? (Atividades, apostilas, jogos...)"
                />
                <button className="absolute inset-y-1.5 right-1.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-full transition-colors hidden sm:block shadow-sm">
                  Buscar
                </button>
              </div>
            </div>

            {/* Direita: Ações do Usuário */}
            <div className="hidden md:flex items-center gap-3">
              <Link 
                href="/vender" 
                className="text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-4 py-2.5 rounded-full transition-all border border-transparent hover:border-blue-100"
              >
                Criar Loja
              </Link>
              <Link 
                href="/login" 
                className="text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-5 py-2.5 rounded-full transition-all border border-slate-200 shadow-xs"
              >
                Entrar
              </Link>
              
              <div className="w-px h-6 bg-slate-200 mx-1"></div>

              <Link href="/carrinho" className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors relative group">
                <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white shadow-sm">
                  0
                </span>
              </Link>
            </div>
            
          </div>
        </div>

        {/* 2. Navegação Secundária (Pills de Categoria) */}
        <div className="border-t border-slate-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 py-3 overflow-x-auto no-scrollbar pb-3 sm:pb-3 hide-scroll-bar">
              <button className="whitespace-nowrap px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold transition-all shadow-sm">
                Início
              </button>
              <button className="whitespace-nowrap px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200">
                <TrendingUp className="w-3.5 h-3.5 text-orange-500" /> 🔥 Em Alta
              </button>
              <button className="whitespace-nowrap px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" /> 📚 Alfabetização
              </button>
              <button className="whitespace-nowrap px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200">
                <Baby className="w-3.5 h-3.5 text-pink-500" /> 🎨 Educação Infantil
              </button>
              <button className="whitespace-nowrap px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200">
                <Gift className="w-3.5 h-3.5 text-emerald-500" /> 🎁 Gratuitos
              </button>
              <button className="whitespace-nowrap px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200">
                <Rocket className="w-3.5 h-3.5 text-purple-500" /> 🚀 PLR para Revenda
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Estilo local para esconder a scrollbar nas pills */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scroll-bar::-webkit-scrollbar { display: none; }
        .hide-scroll-bar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <main className="flex-1 pb-20">
        
        {/* 3. Hero Section (Banner Promocional) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-900 opacity-90"></div>
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent bg-[length:20px_20px]"></div>

            <div className="relative px-6 py-16 sm:px-12 sm:py-20 md:py-24 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="w-full max-w-2xl text-center md:text-left space-y-6 md:space-y-8 z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  Lançamento do Marketplace
                </div>
                
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-[1.1] tracking-tight">
                  Educação que transforma. <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-300">
                    Materiais criados por quem entende.
                  </span>
                </h1>
                
                <p className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed max-w-xl mx-auto md:mx-0">
                  Explore milhares de atividades lúdicas, apostilas completas e planos de aula prontos para usar. Adquira direto dos melhores produtores do Brasil.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 pt-2">
                  <button className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-blue-900 font-black rounded-xl transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                    Explorar Materiais
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <Link href="/vender" className="w-full sm:w-auto px-8 py-4 bg-slate-800/50 hover:bg-slate-700/50 text-white font-bold rounded-xl border border-slate-600 backdrop-blur-sm transition-all text-center">
                    Sou Produtor
                  </Link>
                </div>
              </div>

              {/* Decorativo Gráfico */}
              <div className="hidden md:flex relative w-full max-w-md items-center justify-center z-10">
                <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full"></div>
                <div className="relative bg-white/10 p-6 rounded-3xl border border-white/20 backdrop-blur-md shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="bg-slate-800 rounded-xl p-4 space-y-4 shadow-inner border border-slate-700">
                    <div className="h-4 w-24 bg-slate-700 rounded-full"></div>
                    <div className="flex gap-4">
                      <div className="w-20 h-24 bg-slate-700 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-full bg-slate-600 rounded-full"></div>
                        <div className="h-3 w-3/4 bg-slate-600 rounded-full"></div>
                        <div className="pt-2 flex justify-between">
                          <div className="h-4 w-12 bg-emerald-500/50 rounded-full"></div>
                          <div className="h-4 w-12 bg-blue-500/50 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </section>

        {/* 4. Prateleiras de Produtos (Grids) */}
        
        {/* Seção de Destaque: Lojas Parceiras */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-white shadow-sm border-b border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <StoreIcon className="w-8 h-8 text-blue-600" />
              Conheça as Lojas Parceiras
            </h2>
            <Link href="/buscar?filter=stores" className="hidden sm:flex text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors items-center gap-1">
              Ver Todas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {topStores.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-3xl border border-slate-200">
              <StoreIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nenhuma loja cadastrada no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {topStores.map(store => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          )}
        </section>

        {/* Seção 1: Em Alta */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-orange-500" />
              Em Alta na Plataforma
            </h2>
            <Link href="/buscar?sort=popular" className="hidden sm:flex text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors items-center gap-1">
              Ver Todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {produtosEmAlta.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
              <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nenhum material publicado ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {produtosEmAlta.map(produto => (
                <ProductCard key={produto.id} product={produto} />
              ))}
            </div>
          )}
        </section>

        {/* Seção 2: Gratuitos */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-white border-y border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Gift className="w-8 h-8 text-emerald-500" />
              Materiais Gratuitos
            </h2>
            <Link href="/buscar?filter=free" className="hidden sm:flex text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors items-center gap-1">
              Ver Todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {produtosGratuitos.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-3xl border border-slate-200">
              <Gift className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nenhum material gratuito no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {produtosGratuitos.map(produto => (
                <ProductCard key={produto.id} product={produto} />
              ))}
            </div>
          )}
        </section>

        {/* Seção 3: Direitos de Revenda (PLR) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Rocket className="w-8 h-8 text-purple-600" />
              Direitos de Revenda (PLR)
            </h2>
            <Link href="/buscar?filter=plr" className="hidden sm:flex text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors items-center gap-1">
              Ver Todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {produtosPLR.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
              <Rocket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nenhum material PLR publicado ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {produtosPLR.map(produto => (
                <ProductCard key={produto.id} product={produto} />
              ))}
            </div>
          )}
        </section>



      </main>
    </div>
  );
}
