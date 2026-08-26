import Link from 'next/link';
import { Search, ShoppingCart, TrendingUp, BookOpen, Baby, Gift, Rocket, ChevronRight, Store as StoreIcon, Boxes, Star, Calendar, Calculator, Puzzle, HeartHandshake, Microscope, Palette, CheckCircle2, Download, Lock, Headset, ShieldCheck, Users, Banknote, BadgePercent } from 'lucide-react';
import { getAllPublicMarketplaceProducts, getTopMarketplaceStores } from '@/lib/store-service';
import { Product, Store } from '@/lib/types';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import MarketplaceHeader from '@/components/MarketplaceHeader';

// 1. Nova Identidade Visual (Navegação Rápida)
const QUICK_CATEGORIES = [
  { name: 'Top Materiais', href: '/buscar?sort=popular' },
  { name: 'Kits Escolares', href: '/buscar?q=kit' },
  { name: 'Jogos e Dinâmicas', href: '/buscar?categoria=jogos' },
  { name: 'Licenças PLR', href: '/buscar?filter=plr' },
  { name: 'Educação Básica', href: '/buscar?categoria=fundamental' },
  { name: 'Educação Infantil', href: '/buscar?categoria=infantil' },
  { name: 'Alfabetização', href: '/buscar?categoria=alfabetizacao' },
  { name: 'Matemática', href: '/buscar?categoria=matematica' },
];

export default async function Home() {
  // Buscar dados no lado do servidor
  const allProducts = await getAllPublicMarketplaceProducts(100);
  
  // 2. Busca aumentada de parceiros (Para preencher o carrossel de bolinhas)
  const topStores = await getTopMarketplaceStores(12);

  // Filtrar as prateleiras
  const produtosEmAlta = allProducts.slice(0, 8);
  const produtosGratuitos = allProducts.filter(p => p.is_free === true || p.preco === 0).slice(0, 4);
  const produtosPLR = allProducts.filter(p => p.is_plr === true).slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      <MarketplaceHeader />

      {/* Estilo local para esconder a scrollbar nas pills e carrosseis */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scroll-bar::-webkit-scrollbar { display: none; }
        .hide-scroll-bar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* Barra de Navegação Rápida (Pills/Badges) */}
      <nav className="bg-white border-b border-slate-200 sticky top-[72px] z-30 shadow-sm hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 overflow-x-auto hide-scroll-bar py-3">
            {QUICK_CATEGORIES.map((cat, index) => (
              <Link 
                key={index} 
                href={cat.href}
                className="whitespace-nowrap px-4 py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-600 hover:text-blue-700 text-sm font-bold rounded-full transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="flex-1 pb-20">
        
        {/* HERO BANNER FULL-WIDTH */}
        <section className="w-full bg-gradient-to-r from-blue-900 to-blue-700 pt-20 pb-24 overflow-hidden relative">
          <div className="absolute inset-0 bg-black/5"></div>
          
          {/* Decorações premium no fundo */}
          <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6 py-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight tracking-tight max-w-4xl mx-auto drop-shadow-sm">
              O Maior Acervo de Atividades para <span className="text-cyan-300">Transformar sua Aula</span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-50 font-medium max-w-2xl mx-auto drop-shadow-sm">
              Materiais didáticos criados por professores especialistas, prontos para imprimir e aplicar.
            </p>
            <div className="pt-6">
              <Link href="/buscar" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-900 hover:bg-slate-50 font-black rounded-full shadow-xl shadow-blue-900/20 transition-transform hover:-translate-y-1 text-lg">
                <Search className="w-5 h-5" /> Explorar Materiais
              </Link>
            </div>
          </div>
        </section>

        {/* CARROSSEL DE LOJAS EM MOVIMENTO (BOLINHAS) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 border-b border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <StoreIcon className="w-6 h-6 text-blue-600" />
              Nossas Lojas Parceiras
            </h2>
            <Link href="/buscar?filter=stores" className="hidden sm:flex text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors items-center gap-1">
              Ver Todas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {topStores.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 font-medium text-sm">Nenhuma loja ativa no momento.</p>
            </div>
          ) : (
            <div className="flex overflow-x-auto hide-scroll-bar gap-6 py-6 px-2 snap-x">
              {topStores.map((store) => {
                const initial = store.nome_loja ? store.nome_loja.charAt(0).toUpperCase() : 'L';
                return (
                  <Link href={`/loja/${store.slug}`} key={store.id} className="flex flex-col items-center gap-3 min-w-[6.5rem] snap-start group cursor-pointer">
                    <div className="w-24 h-24 rounded-full border-2 border-slate-200 bg-white p-1 shadow-sm group-hover:border-blue-500 group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1">
                      {store.logo_url ? (
                        <img src={store.logo_url} alt={store.nome_loja} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-3xl">
                          {initial}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 truncate w-full text-center px-1">
                      {store.nome_loja}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* 4. Prateleiras de Produtos (Grids) */}

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

        {/* Prateleira Temática (Especial do Mês) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-blue-50/50 border-y border-blue-100 mt-6 mb-12 rounded-[2.5rem]">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2 mb-2">
                <Calendar className="w-8 h-8 text-blue-600" />
                Especial do Mês
              </h2>
              <p className="text-slate-600 font-medium text-sm sm:text-base">
                Prepare suas aulas para as principais datas comemorativas
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {['Independência', 'Primavera', 'Trânsito'].map(tag => (
                <Link key={tag} href={`/buscar?q=${tag.toLowerCase()}`} className="px-4 py-1.5 bg-white border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white rounded-full text-xs font-bold transition-colors">
                  {tag}
                </Link>
              ))}
              <Link href="/buscar?filter=sazonal" className="ml-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">
                Ver Todos <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          
          {produtosEmAlta.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nenhum material sazonal no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {produtosEmAlta.slice(0, 4).map(produto => (
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
              Licenças PLR (Direitos de Revenda)
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

        {/* 5. Seção de Confiança & Recrutamento de Vendedores */}
        <section className="bg-white border-t border-slate-200/60 pt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Trust Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-slate-50 border border-slate-100">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                  <Download className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">Entrega Imediata</h3>
                <p className="text-xs text-slate-500">Acesso instantâneo após a compra</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-slate-50 border border-slate-100">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">Download Ilimitado</h3>
                <p className="text-xs text-slate-500">Baixe quantas vezes precisar</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-slate-50 border border-slate-100">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">Pagamento Seguro</h3>
                <p className="text-xs text-slate-500">Ambiente criptografado e seguro</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-slate-50 border border-slate-100">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
                  <Headset className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">Suporte Dedicado</h3>
                <p className="text-xs text-slate-500">Estamos aqui para ajudar você</p>
              </div>
            </div>

            {/* Banner B2B (Recrutamento) */}
            <div className="bg-blue-600 rounded-[2.5rem] p-8 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden mb-16">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3"></div>
              
              <div className="relative z-10 lg:w-1/2 space-y-6 text-center lg:text-left">
                <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                  Transforme seu conhecimento em <span className="text-yellow-300">renda extra</span>
                </h2>
                <p className="text-blue-100 text-lg md:text-xl font-medium">
                  Crie sua loja, publique seus materiais didáticos e venda para milhares de educadores todos os dias. Nós cuidamos da tecnologia.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link href="/vender" className="px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black rounded-full shadow-lg transition-transform hover:scale-105 w-full sm:w-auto text-center">
                    Criar Conta Grátis
                  </Link>
                </div>
              </div>

              <div className="relative z-10 grid grid-cols-2 gap-4 lg:w-5/12 w-full">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
                  <div className="text-3xl font-black text-white mb-1">+30</div>
                  <div className="text-sm font-medium text-blue-200">Lojas Parceiras</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
                  <div className="text-3xl font-black text-white mb-1">R$ 6 Mil+</div>
                  <div className="text-sm font-medium text-blue-200">Em comissões geradas</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center col-span-2">
                  <div className="text-3xl font-black text-white mb-1 flex justify-center items-center gap-2">
                    4.9 <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                  </div>
                  <div className="text-sm font-medium text-blue-200">Avaliação Média dos Compradores</div>
                </div>
              </div>
            </div>
            
          </div>
        </section>

        {/* 6. Seção Institucional ("O que é o Educalizando?") */}
        <section className="bg-slate-50 py-20 border-t border-slate-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">O que é o Educalizando?</h2>
            <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto mb-16">
              O maior ecossistema de recursos educacionais do Brasil. Conectamos criadores de conteúdos incríveis a educadores que buscam praticidade e qualidade.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                  <BookOpen className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Materiais para Todas as Disciplinas</h3>
                <p className="text-slate-600 font-medium">De atividades de alfabetização a desafios matemáticos complexos. Tudo em um só lugar.</p>
              </div>
              
              <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-6">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Recursos para Educadores</h3>
                <p className="text-slate-600 font-medium">Planejamentos, sequências didáticas e painéis prontos para otimizar a sua rotina escolar.</p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Qualidade Garantida</h3>
                <p className="text-slate-600 font-medium">Os materiais são criados por especialistas e avaliados rigorosamente pela comunidade.</p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <Banknote className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Compra Segura e Rápida</h3>
                <p className="text-slate-600 font-medium">Pagamento via Pix processado na hora com liberação imediata do seu conteúdo.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Programa de Afiliados */}
        <section className="bg-slate-50 text-slate-900 py-24 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">
              Tenha sua Própria Vitrine e Lucre como Afiliado
            </h2>
            <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto mb-16">
              Vá além dos links tradicionais. Crie a sua própria loja personalizada dentro do Educalizando e escolha os melhores materiais para indicar. As comissões são justas e definidas diretamente pelos autores.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
              <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <StoreIcon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Vitrine Personalizada</h3>
                <p className="text-slate-600 font-medium">
                  Organize e divulgue os materiais que você mais confia em uma página exclusiva com o seu nome.
                </p>
              </div>

              <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Comissões Atrativas</h3>
                <p className="text-slate-600 font-medium">
                  Selecione produtos com excelentes taxas de comissão no mercado, definidas diretamente por quem cria.
                </p>
              </div>

              <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                  <Banknote className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Gestão Descomplicada</h3>
                <p className="text-slate-600 font-medium">
                  Acompanhe seus cliques, conversões e solicite seus saques de forma transparente e rápida.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/cadastro" className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg transition-transform hover:scale-105 w-full sm:w-auto text-center">
                Criar Conta de Afiliado
              </Link>
              <Link href="/entrar" className="px-8 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-full transition-colors w-full sm:w-auto text-center">
                Já sou afiliado
              </Link>
            </div>
            
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
