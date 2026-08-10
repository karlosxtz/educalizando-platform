'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { GraduationCap, Lock, Mail, ArrowRight, Loader2, AlertCircle, Store } from 'lucide-react';
import { signInStudent } from '@/lib/student-service';

function StudentLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromSlug = searchParams.get('from');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Por favor, informe e-mail e senha.');
      return;
    }

    setLoading(true);
    try {
      await signInStudent({ email, password });
      router.push('/aluno/dashboard');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao realizar login de aluno. Verifique os dados fornecidos.');
      setLoading(false);
    }
  };

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 shadow-2xl space-y-6 border border-slate-100 font-sans"
      >
        {fromSlug && (
          <div className="bg-slate-100 border border-slate-200 text-brand-navy px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Store className="w-4 h-4 text-brand-teal" />
              <span>Entrando para acessar a loja <strong>/{fromSlug}</strong></span>
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
              E-mail de Aluno
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 text-sm font-medium focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
              Sua Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 text-sm font-medium focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-brand-navy hover:bg-brand-navy-hover text-white shadow-lg shadow-brand-navy/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Entrar na Área do Aluno</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center space-y-3">
          <p className="text-xs text-slate-500 font-medium">
            Primeiro acesso após a compra?{' '}
            <Link 
              href={fromSlug ? `/aluno/cadastro?from=${fromSlug}` : '/aluno/cadastro'} 
              className="text-brand-navy font-extrabold hover:underline"
            >
              Cadastrar senha
            </Link>
          </p>

          <div className="pt-2">
            <Link href="/login" className="text-[11px] text-slate-400 font-bold hover:text-slate-700 transition-colors">
              É criador de conteúdo? Acesse o Painel do Criador
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function StudentLoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Glow Overlay */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-navy/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 space-y-4 text-center mb-8">
        {/* Brand Header */}
        <Link href="/" className="inline-flex items-center justify-center group mb-2">
          <img
            src="/branding/logo-educalizando.png"
            alt="Educalizando"
            className="h-12 sm:h-14 w-auto object-contain mx-auto"
            style={{ width: 'auto', height: '56px' }}
          />
        </Link>

        <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full inline-flex items-center gap-2 border border-white/15 text-brand-teal text-xs font-bold">
          <GraduationCap className="w-4 h-4 text-brand-teal" />
          <span>Área de Membros do Aluno</span>
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight">
          Acesse seus materiais didáticos
        </h2>
        <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
          Entre com sua conta de aluno para ler apostilas, e-books e assistir videoaulas.
        </p>
      </div>

      <Suspense fallback={
        <div className="text-center text-white text-xs">Carregando formulário...</div>
      }>
        <StudentLoginForm />
      </Suspense>
    </div>
  );
}
