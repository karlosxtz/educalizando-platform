import Link from 'next/link';
import { ShoppingCart, Store, Megaphone, ArrowLeft } from 'lucide-react';

export default function RegisterTriagePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-emerald-600 selection:text-white">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
        
        {/* Header */}
        <div className="text-center mb-10 space-y-3">
          <div className="flex justify-center mb-4">
            <div className="bg-emerald-600 text-white p-3 rounded-2xl shadow-md">
              <span className="font-black text-3xl leading-none block">E</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Crie sua conta no Educalizando
          </h1>
          <p className="text-lg text-slate-600 font-medium">
            Escolha o perfil que melhor se adapta ao seu objetivo hoje.
          </p>
        </div>

        {/* Grid de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-8">
          
          {/* Card 1 - Aluno */}
          <Link href="/aluno/cadastro" className="bg-white rounded-3xl p-8 flex flex-col items-center text-center shadow-sm hover:shadow-xl border border-slate-200 hover:border-emerald-300 transition-all duration-300 hover:-translate-y-1 group">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Sou Aluno</h2>
            <p className="text-sm text-slate-500 font-medium">
              Quero criar uma conta grátis para comprar e baixar materiais.
            </p>
          </Link>

          {/* Card 2 - Produtor */}
          <Link href="/cadastro/produtor" className="bg-white rounded-3xl p-8 flex flex-col items-center text-center shadow-sm hover:shadow-xl border border-slate-200 hover:blue-300 transition-all duration-300 hover:-translate-y-1 group">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Store className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Quero Vender</h2>
            <p className="text-sm text-slate-500 font-medium">
              Sou professor/criador e quero abrir minha loja para vender materiais.
            </p>
          </Link>

          {/* Card 3 - Afiliado */}
          <Link href="/afiliados/cadastro" className="bg-white rounded-3xl p-8 flex flex-col items-center text-center shadow-sm hover:shadow-xl border border-slate-200 hover:purple-300 transition-all duration-300 hover:-translate-y-1 group">
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Megaphone className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Sou Afiliado</h2>
            <p className="text-sm text-slate-500 font-medium">
              Quero criar minha vitrine própria e lucrar indicando materiais.
            </p>
          </Link>

        </div>

        {/* Link de Login (Conversão Cruzada) */}
        <div className="mb-10 text-center">
          <p className="text-slate-600 font-medium">
            Já tem uma conta?{' '}
            <Link href="/entrar" className="text-emerald-600 font-bold hover:text-emerald-700 hover:underline transition-all">
              Faça Login aqui
            </Link>
          </p>
        </div>

        {/* Voltar para Home */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors bg-white px-6 py-3 rounded-full border border-slate-200 shadow-sm hover:bg-slate-50">
          <ArrowLeft className="w-4 h-4" /> Voltar para o Início
        </Link>
        
      </div>
    </div>
  );
}
