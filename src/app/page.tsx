import Link from 'next/link';
import { Search, ShoppingCart, TrendingUp, BookOpen, Baby, Gift, Rocket, ChevronRight } from 'lucide-react';

export default function Home() {
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
              
              {/* Carrinho Mobile (Oculto no Desktop) */}
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

            {/* Direita: Ações do Usuário (Oculto no Mobile, exceto se repensado) */}
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

      {/* Estilo local para esconder a scrollbar nas pills (opcional) */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scroll-bar::-webkit-scrollbar { display: none; }
        .hide-scroll-bar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* Main Page Content */}
      <main className="flex-1">
        
        {/* 3. Hero Section (Banner Promocional) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
            
            {/* Background Gradiente Dinâmico */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-900 opacity-90"></div>
            
            {/* Pattern/Ruído Sutil no fundo */}
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

              {/* Decorativo Gráfico (Oculto no mobile, visível no desktop) */}
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

      </main>
    </div>
  );
}
