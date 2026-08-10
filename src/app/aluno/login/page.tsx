'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, Lock, Mail, ArrowRight, Loader2, AlertCircle, ShoppingBag, ShieldCheck, UserCheck, UserPlus } from 'lucide-react';
import { signInStudent, registerStudentInSupabase } from '@/lib/student-service';

function StudentLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const action = searchParams.get('action');
  const isBuyAction = action === 'buy' || Boolean(returnTo);

  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper para redirecionar com segurança após login/cadastro (Evita Open Redirect - Item 13)
  const getSafeReturnUrl = () => {
    if (returnTo && returnTo.startsWith('/')) {
      return returnTo;
    }
    return '/aluno/dashboard';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Por favor, informe seu e-mail e senha.');
      return;
    }

    setLoading(true);
    try {
      await signInStudent({ email, password });
      router.push(getSafeReturnUrl());
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao realizar login de aluno. Verifique seus dados.');
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName || !email || !password) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      await registerStudentInSupabase({
        email,
        password,
        fullName,
        cpf
      });
      // Após cadastro, confirma autenticação e redireciona automaticamente para a compra
      router.push(getSafeReturnUrl());
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao criar conta de aluno.');
      setLoading(false);
    }
  };

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-100"
      >
        {/* Banner Contextual da Compra (Item 5 da Especificação) */}
        {isBuyAction && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl text-xs font-bold space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-800 uppercase tracking-wider text-[10px] font-black">
              <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Entre para Continuar a Compra</span>
            </div>
            <p className="text-[11px] font-medium leading-normal text-emerald-700">
              Para finalizar a compra deste material didático, é necessário estar conectado em uma <strong>conta de Aluno</strong>.
            </p>
          </div>
        )}

        {/* Abas: Já tenho uma conta / Criar conta de aluno (Item 5 da Especificação) */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMsg(null); }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              tab === 'login' 
                ? 'bg-white text-brand-navy shadow-xs font-extrabold' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Já tenho conta</span>
          </button>

          <button
            type="button"
            onClick={() => { setTab('register'); setErrorMsg(null); }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              tab === 'register' 
                ? 'bg-white text-brand-navy shadow-xs font-extrabold' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Criar conta de aluno</span>
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form A: Login de Aluno */}
        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                E-mail do Aluno *
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
                Senha *
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
                  <span>{isBuyAction ? 'Entrar e Continuar Compra' : 'Entrar na Área do Aluno'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Form B: Cadastro de Aluno */
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: João da Silva"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 text-sm font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                E-mail *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 text-sm font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                CPF (Opcional)
              </label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 text-sm font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                Senha de Acesso *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="No mínimo 6 caracteres"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 text-sm font-medium focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all mt-2"
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
        )}

        <div className="pt-3 border-t border-slate-100 text-center">
          <Link href="/login" className="text-[11px] text-slate-400 font-bold hover:text-slate-700 transition-colors">
            É criador de conteúdo? Acesse o Painel do Criador
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function StudentLoginPage() {
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
          <span>Autenticação de Aluno Educalizando</span>
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight">
          Acesse ou Crie sua Conta de Aluno
        </h2>
        <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
          Faça login ou crie sua conta gratuitamente para comprar e baixar seus materiais didáticos.
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
