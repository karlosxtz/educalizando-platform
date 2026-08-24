import Link from 'next/link';
import { Search, ShoppingCart, TrendingUp, BookOpen, Baby, Gift, Rocket, ChevronRight, Store as StoreIcon, Boxes, Star, Calendar, Calculator, Puzzle, HeartHandshake, Microscope, Palette } from 'lucide-react';
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
    <Link href={productLink} className="group bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_10px_40px_rgb(0,0,0,0.06)] transition-all duration-300 flex flex-col h-full hover:-translate-y-1">
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
    <Link href={`/loja/${store.slug}`} className="group bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_10px_40px_rgb(0,0,0,0.06)] transition-all duration-300 flex flex-col p-6 hover:-translate-y-1">
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

const VISUAL_CATEGORIES = [
  { name: 'Alfabetização', icon: BookOpen, bgColor: 'bg-blue-100', textColor: 'text-blue-600', hoverColor: 'group-hover:bg-blue-200' },
  { name: 'Educação Infantil', icon: Baby, bgColor: 'bg-pink-100', textColor: 'text-pink-600', hoverColor: 'group-hover:bg-pink-200' },
  { name: 'Datas Comemorativas', icon: Calendar, bgColor: 'bg-orange-100', textColor: 'text-orange-600', hoverColor: 'group-hover:bg-orange-200' },
  { name: 'Matemática', icon: Calculator, bgColor: 'bg-emerald-100', textColor: 'text-emerald-600', hoverColor: 'group-hover:bg-emerald-200' },
  { name: 'Jogos Lúdicos', icon: Puzzle, bgColor: 'bg-purple-100', textColor: 'text-purple-600', hoverColor: 'group-hover:bg-purple-200' },
  { name: 'Inclusão', icon: HeartHandshake, bgColor: 'bg-amber-100', textColor: 'text-amber-600', hoverColor: 'group-hover:bg-amber-200' },
  { name: 'Ciências', icon: Microscope, bgColor: 'bg-cyan-100', textColor: 'text-cyan-600', hoverColor: 'group-hover:bg-cyan-200' },
  { name: 'Arte & Cores', icon: Palette, bgColor: 'bg-red-100', textColor: 'text-red-600', hoverColor: 'group-hover:bg-red-200' },
];

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
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Esquerda: Logo */}
            <div className="flex items-center justify-between w-full md:w-auto">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="bg-blue-600 text-white p-1.5 sm:p-2 rounded-xl group-hover:bg-blue-700 transition-colors">
                  <span className="font-black text-lg sm:text-xl leading-none block">E</span>
                </div>
                <span className="font-black text-xl sm:text-2xl tracking-tight text-slate-900">
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
        
        {/* 3. Hero Section (Banner Promocional Lúdico) */}
        <section className="w-full bg-blue-50 py-16 md:py-24 relative overflow-hidden flex flex-col items-center justify-center text-center">
          <div className="max-w-3xl mx-auto px-4 space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-blue-100 text-blue-600 text-xs font-extrabold uppercase tracking-widest shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              O Marketplace da Educação
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
              Educação que transforma. <br className="hidden md:block" />
              <span className="text-blue-600">
                Materiais de alto nível.
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-xl mx-auto">
              Explore milhares de atividades lúdicas, apostilas completas e planos de aula prontos para usar. Adquira direto dos melhores produtores do Brasil.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-[0_8px_30px_rgb(37,99,235,0.2)] hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                Explorar Materiais
                <ChevronRight className="w-5 h-5" />
              </button>
              <Link href="/vender" className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl border border-slate-200 shadow-sm transition-all text-center">
                Sou Produtor
              </Link>
            </div>
          </div>
        </section>

        {/* Seção de Categorias Visuais */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-8 pb-8 border-b border-slate-100">
          <div className="flex overflow-x-auto gap-6 pb-6 hide-scroll-bar snap-x snap-mandatory px-2">
            {VISUAL_CATEGORIES.map((cat, index) => {
              const Icon = cat.icon;
              return (
                <div key={index} className="flex flex-col items-center gap-3 min-w-[80px] sm:min-w-[96px] cursor-pointer group snap-start">
                  <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full ${cat.bgColor} border border-slate-100/50 flex items-center justify-center shadow-[0_4px_20px_rgb(0,0,0,0.03)] group-hover:-translate-y-1 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 ${cat.hoverColor}`}>
                    <Icon className={`w-8 h-8 sm:w-10 sm:h-10 ${cat.textColor} group-hover:scale-110 transition-transform`} strokeWidth={2.5} />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 text-center leading-tight">
                    {cat.name}
                  </span>
                </div>
              );
            })}
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
