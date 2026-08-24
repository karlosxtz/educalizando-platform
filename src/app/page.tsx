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
  { name: 'Educação Infantil', emoji: '🎨', bgColor: 'bg-slate-100', href: '?categoria=infantil' },
  { name: 'Ensino Fundamental', emoji: '🎒', bgColor: 'bg-slate-100', href: '?categoria=fundamental' },
  { name: 'Alfabetização', emoji: '📚', bgColor: 'bg-slate-100', href: '?categoria=alfabetizacao' },
  { name: 'Matemática', emoji: '🧮', bgColor: 'bg-slate-100', href: '?categoria=matematica' },
  { name: 'Ciências', emoji: '🔬', bgColor: 'bg-slate-100', href: '?categoria=ciencias' },
  { name: 'Inglês', emoji: '🌎', bgColor: 'bg-slate-100', href: '?categoria=ingles' },
  { name: 'Datas Comemorativas', emoji: '🎉', bgColor: 'bg-slate-100', href: '?categoria=datas-comemorativas' },
  { name: 'Inclusão', emoji: '🧩', bgColor: 'bg-slate-100', href: '?categoria=inclusao' },
  { name: 'Jogos Lúdicos', emoji: '🎲', bgColor: 'bg-slate-100', href: '?categoria=jogos' },
  { name: 'Coordenação Motora', emoji: '🏃', bgColor: 'bg-slate-100', href: '?categoria=coordenacao' },
  { name: 'Berçário', emoji: '🍼', bgColor: 'bg-slate-100', href: '?categoria=bercario' },
  { name: 'Artes', emoji: '🖍️', bgColor: 'bg-slate-100', href: '?categoria=artes' },
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
      
      {/* 1. Cabeçalho de Marketplace (Header Premium B2C) */}
      <header className="w-full sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100 transition-all py-4">
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
                  className="block w-full pl-11 pr-6 py-3 sm:py-3.5 bg-slate-100/50 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-full leading-5 text-slate-900 placeholder-slate-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium shadow-inner"
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
                className="text-sm font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-4 py-2.5 rounded-full transition-all border border-transparent hover:border-blue-100"
              >
                Criar Loja
              </Link>
              <Link 
                href="/login" 
                className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-6 py-2.5 rounded-full transition-all shadow-md shadow-blue-500/20"
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

        {/* 2. Navegação Secundária (Fiel ao Concorrente) */}
        <div className="border-t border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-4">
              
              {/* Esquerda: Links Simples */}
              <div className="flex items-center gap-6 overflow-x-auto hide-scroll-bar">
                <Link href="/" className="whitespace-nowrap text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors">
                  Início
                </Link>
                <Link href="/buscar" className="whitespace-nowrap text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
                  Todas as categorias
                </Link>
                <Link href="/buscar?filter=stores" className="whitespace-nowrap text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
                  Lojas
                </Link>
              </div>

              {/* Direita: Pills Elegantes */}
              <div className="flex items-center gap-2 overflow-x-auto hide-scroll-bar">
                <Link href="/buscar?filter=mais-vendidos" className="whitespace-nowrap bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-blue-100 transition-colors">
                  🔥 Mais Vendidos
                </Link>
                <Link href="/buscar?cat=fundamental" className="whitespace-nowrap bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-blue-100 transition-colors">
                  🎒 Ensino Fundamental
                </Link>
                <Link href="/buscar?cat=recursos-ludicos" className="whitespace-nowrap bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-blue-100 transition-colors">
                  🧩 Recursos Lúdicos
                </Link>
                <Link href="/buscar?filter=revenda" className="whitespace-nowrap bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-blue-100 transition-colors">
                  💼 Revenda Autorizada
                </Link>
              </div>
              
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
        
        {/* Categorias Visuais Premium */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex gap-6 overflow-x-auto hide-scroll-bar px-4 pb-2">
            {VISUAL_CATEGORIES.map((cat, index) => {
              return (
                <Link href={cat.href} key={index} className="flex flex-col items-center min-w-max cursor-pointer group">
                  <div className={`w-16 h-16 rounded-full ${cat.bgColor} flex items-center justify-center border border-slate-200/50 shadow-[0_2px_8px_rgb(0,0,0,0.04)] group-hover:shadow-[0_8px_16px_rgb(0,0,0,0.08)] group-hover:-translate-y-1 transition-all duration-300`}>
                    <span className="text-3xl sm:text-4xl">{cat.emoji}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 mt-3 text-center group-hover:text-blue-600 transition-colors">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 3. Hero Section (Carrossel) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
          <div className="flex overflow-x-auto snap-x snap-mandatory hide-scroll-bar rounded-3xl shadow-sm gap-4">
            
            {/* Banner 1 */}
            <div className="min-w-full snap-center h-[400px] sm:h-[450px] bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl flex flex-col items-center justify-center text-center px-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
              <div className="relative z-10 space-y-4">
                <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-xs sm:text-sm font-bold uppercase tracking-wider">
                  Banner 1
                </span>
                <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
                  Especial Volta às Aulas
                </h1>
                <p className="text-blue-100 text-lg font-medium max-w-lg mx-auto">
                  Materiais exclusivos para iniciar o ano letivo com excelência.
                </p>
                <div className="pt-4">
                  <button className="px-8 py-3.5 bg-white text-blue-600 font-bold rounded-full shadow-lg hover:scale-105 transition-transform">
                    Ver Materiais
                  </button>
                </div>
              </div>
            </div>

            {/* Banner 2 */}
            <div className="min-w-full snap-center h-[400px] sm:h-[450px] bg-gradient-to-r from-orange-400 to-pink-500 rounded-3xl flex flex-col items-center justify-center text-center px-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
              <div className="relative z-10 space-y-4">
                <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-xs sm:text-sm font-bold uppercase tracking-wider">
                  Banner 2
                </span>
                <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
                  Matemática Descomplicada
                </h1>
                <p className="text-orange-50 text-lg font-medium max-w-lg mx-auto">
                  Jogos e apostilas para ensinar matemática de forma lúdica.
                </p>
                <div className="pt-4">
                  <button className="px-8 py-3.5 bg-white text-pink-600 font-bold rounded-full shadow-lg hover:scale-105 transition-transform">
                    Conferir
                  </button>
                </div>
              </div>
            </div>

            {/* Banner 3 */}
            <div className="min-w-full snap-center h-[400px] sm:h-[450px] bg-gradient-to-r from-emerald-400 to-teal-500 rounded-3xl flex flex-col items-center justify-center text-center px-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
              <div className="relative z-10 space-y-4">
                <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-xs sm:text-sm font-bold uppercase tracking-wider">
                  Banner 3
                </span>
                <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
                  Educação Infantil
                </h1>
                <p className="text-emerald-50 text-lg font-medium max-w-lg mx-auto">
                  Recursos coloridos e interativos para os pequenos.
                </p>
                <div className="pt-4">
                  <button className="px-8 py-3.5 bg-white text-teal-600 font-bold rounded-full shadow-lg hover:scale-105 transition-transform">
                    Explorar
                  </button>
                </div>
              </div>
            </div>

            {/* Banner 4 */}
            <div className="min-w-full snap-center h-[400px] sm:h-[450px] bg-gradient-to-r from-purple-500 to-fuchsia-600 rounded-3xl flex flex-col items-center justify-center text-center px-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
              <div className="relative z-10 space-y-4">
                <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-xs sm:text-sm font-bold uppercase tracking-wider">
                  Banner 4
                </span>
                <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
                  Revenda Autorizada (PLR)
                </h1>
                <p className="text-purple-100 text-lg font-medium max-w-lg mx-auto">
                  Compre com direito de revenda e crie seu próprio negócio.
                </p>
                <div className="pt-4">
                  <button className="px-8 py-3.5 bg-white text-purple-600 font-bold rounded-full shadow-lg hover:scale-105 transition-transform">
                    Ver Oportunidades
                  </button>
                </div>
              </div>
            </div>
            
            {/* Banner 5 */}
            <div className="min-w-full snap-center h-[400px] sm:h-[450px] bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl flex flex-col items-center justify-center text-center px-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
              <div className="relative z-10 space-y-4">
                <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-xs sm:text-sm font-bold uppercase tracking-wider">
                  Banner 5
                </span>
                <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
                  Materiais Gratuitos
                </h1>
                <p className="text-amber-50 text-lg font-medium max-w-lg mx-auto">
                  Baixe conteúdos exclusivos sem custo nenhum.
                </p>
                <div className="pt-4">
                  <button className="px-8 py-3.5 bg-white text-orange-600 font-bold rounded-full shadow-lg hover:scale-105 transition-transform">
                    Baixar Agora
                  </button>
                </div>
              </div>
            </div>

          </div>
          
          {/* Dica de arrastar (Mobile) */}
          <div className="flex justify-center mt-3 sm:hidden">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              Deslize para ver mais 👉
            </span>
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
            <div className="flex overflow-x-auto snap-x gap-6 pb-6 hide-scroll-bar">
              {topStores.map(store => (
                <div key={store.id} className="min-w-[280px] sm:min-w-[320px] max-w-[280px] sm:max-w-[320px] snap-start flex">
                  <StoreCard store={store} />
                </div>
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
