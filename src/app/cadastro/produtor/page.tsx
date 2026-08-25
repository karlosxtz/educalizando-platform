import Link from 'next/link';
import { ArrowLeft, Store } from 'lucide-react';
import SignupForm from '@/components/SignupForm';

export default function ProducerSignupPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 space-y-4 text-center mb-6">
        <Link href="/" className="inline-flex items-center justify-center group mb-2">
          <img
            src="/branding/logo-educalizando.png"
            alt="Educalizando"
            className="h-12 sm:h-14 w-auto object-contain mx-auto"
            style={{ width: 'auto', height: '56px' }}
          />
        </Link>

        <div className="bg-blue-50 px-4 py-1.5 rounded-full inline-flex items-center gap-2 border border-blue-100 text-blue-700 text-xs font-bold mx-auto">
          <Store className="w-4 h-4 text-blue-600" />
          <span>Cadastro de Loja Didática</span>
        </div>

        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Crie sua loja e comece a vender
        </h2>
        <p className="text-xs text-slate-600 font-medium max-w-xs mx-auto">
          Junte-se a milhares de educadores e monetize seus materiais didáticos.
        </p>
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto">
         <SignupForm />
      </div>

      <div className="mt-8 text-center relative z-10 flex flex-col items-center gap-4">
        <p className="text-sm text-slate-600 font-medium">
          Já tem uma loja?{' '}
          <Link href="/login" className="text-blue-600 font-bold hover:text-blue-700 hover:underline transition-all">
            Faça Login no Painel
          </Link>
        </p>

        <Link href="/cadastro" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors bg-white px-6 py-3 rounded-full border border-slate-200 shadow-sm hover:bg-slate-50">
          <ArrowLeft className="w-4 h-4" /> Voltar para Opções de Cadastro
        </Link>
      </div>
    </div>
  );
}
