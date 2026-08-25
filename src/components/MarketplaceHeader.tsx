import Link from 'next/link';
import { ShoppingCart, Search } from 'lucide-react';
import CategoryDropdown from './CategoryDropdown';

export default function MarketplaceHeader() {
  return (
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
              href="/cadastro" 
              className="text-sm font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-4 py-2.5 rounded-full transition-all border border-transparent hover:border-blue-100"
            >
              Criar Conta
            </Link>
            <Link 
              href="/entrar" 
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
            <div className="flex items-center gap-6">
              <Link href="/" className="whitespace-nowrap text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors">
                Início
              </Link>
              <CategoryDropdown />
              <Link href="/lojas" className="whitespace-nowrap text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
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
  );
}
