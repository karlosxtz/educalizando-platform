'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, User, Lock, Mail, ArrowRight, Loader2, AlertCircle, ShoppingBag } from 'lucide-react';
import { registerStudentInSupabase } from '@/lib/student-service';

function StudentSignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const action = searchParams.get('action');
  const isBuyAction = action === 'buy' || Boolean(returnTo);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getSafeReturnUrl = () => {
    if (returnTo && returnTo.startsWith('/')) {
      return returnTo;
    }
    return '/aluno/dashboard';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName || !email || !password) {
      setErrorMsg('Preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await registerStudentInSupabase({ fullName, email, password, cpf });
      router.push(getSafeReturnUrl());
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao realizar cadastro do aluno.');
      setLoading(false);
    }
  };

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 shadow-2xl space-y-6 border border-slate-100"
      >
        {isBuyAction && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl text-xs font-bold space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-800 uppercase tracking-wider text-[10px] font-black">
              <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Cadastro para Continuar a Compra</span>
            </div>
            <p className="text-[11px] font-medium leading-normal text-emerald-700">
              Crie sua conta de Aluno gratuitamente para finalizar sua compra e acessar o material.
            </p>
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
              Nome Completo *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Maria Fernandes"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 text-sm font-medium focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
              E-mail de Aluno *
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
              CPF (Opcional)
            </label>
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="000.000.000-00"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 text-sm font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
              Senha de Acesso *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 text-sm font-medium focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{isBuyAction ? 'Criar Conta e Ir para Checkout' : 'Criar Conta de Aluno'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center space-y-2">
          <p className="text-xs text-slate-500 font-medium">
            Já tem uma conta de aluno?{' '}
            <Link 
              href={returnTo ? `/aluno/login?returnTo=${encodeURIComponent(returnTo)}&action=buy` : '/aluno/login'} 
              className="text-brand-navy font-extrabold hover:underline"
            >
              Fazer login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function StudentSignupPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-navy/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 space-y-4 text-center mb-8">
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
          <span>Cadastro de Aluno Educalizando</span>
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight">
          Crie sua conta para acessar materiais
        </h2>
        <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
          Informe seu nome e e-mail para vincular suas compras e ter acesso aos materiais didáticos.
        </p>
      </div>

      <Suspense fallback={
        <div className="text-center text-white text-xs">Carregando formulário...</div>
      }>
        <StudentSignupForm />
      </Suspense>
    </div>
  );
}
