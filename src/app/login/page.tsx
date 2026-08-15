'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import Image from 'next/image';

import { 
  Mail, Lock, Eye, EyeOff, LogIn, 
  AlertCircle, Loader2, ArrowLeft, KeyRound, CheckCircle2, ShieldCheck 
} from 'lucide-react';

import { 
  loginSchema, 
  resetPasswordSchema, 
  type LoginFormValues, 
  type ResetPasswordFormValues 
} from '@/lib/zod-schemas';
import { signInUser, resetPasswordForEmail } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: resetErrors, isSubmitting: isResetSubmitting }
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: ''
    }
  });

  const onLoginSubmit: SubmitHandler<LoginFormValues> = async (values) => {
    setServerError(null);
    try {
      await signInUser({ email: values.email, password: values.password });
      
      // Redirecionamento Automático
      const superAdminEmail = process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL || 'rafinhaagathathamy@gmail.com';
      if (values.email.toLowerCase() === superAdminEmail.toLowerCase()) {
        router.push('/admin');
      } else {
        router.push('/dashboard/loja');
      }
      
    } catch (err: any) {
      setServerError(err.message || 'Erro ao realizar o login. Verifique seu e-mail e senha.');
    }
  };

  const onResetSubmit: SubmitHandler<ResetPasswordFormValues> = async (values) => {
    setServerError(null);
    try {
      await resetPasswordForEmail(values.email);
      setResetSuccess(true);
    } catch (err: any) {
      setServerError(err.message || 'Erro ao enviar e-mail de recuperação.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-navy/5 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Top Header */}
      <header className="p-6 max-w-7xl w-full mx-auto flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center group">
          <img
            src="/branding/logo-educalizando.png"
            alt="Educalizando"
            className="h-10 w-auto object-contain"
            style={{ width: 'auto', height: '40px' }}
          />
        </Link>

        <Link
          href="/"
          className="text-xs text-slate-600 hover:text-brand-navy flex items-center gap-1 font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao início</span>
        </Link>
      </header>

      {/* Main Container Card */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10 my-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 shadow-xl relative overflow-hidden space-y-6"
        >
          {activeTab === 'login' ? (
            /* Login Form Tab */
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <img
                  src="/branding/logo-educalizando.png"
                  alt="Educalizando"
                  className="h-12 sm:h-14 w-auto object-contain mx-auto"
                  style={{ width: 'auto', height: '56px' }}
                />
                <h1 className="text-2xl font-black text-slate-900">Acesse o seu Painel</h1>
                <p className="text-xs text-slate-600">
                  Gerencie sua loja didática, acompanhe vendas e cadastre produtos.
                </p>
              </div>

              {serverError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center gap-3 font-medium">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
                  <span>{serverError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    E-mail Cadastrado *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      {...registerLogin('email')}
                      className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${
                        loginErrors.email ? 'border-rose-500' : 'border-slate-200 focus:border-brand-navy'
                      } rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none transition-all`}
                    />
                  </div>
                  {loginErrors.email && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">{loginErrors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Sua Senha *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setServerError(null);
                        setResetSuccess(false);
                        setActiveTab('forgot');
                      }}
                      className="text-xs text-brand-navy hover:underline font-bold"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...registerLogin('password')}
                      className={`w-full pl-10 pr-10 py-3 bg-slate-50 border ${
                        loginErrors.password ? 'border-rose-500' : 'border-slate-200 focus:border-brand-navy'
                      } rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none transition-all`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">{loginErrors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoginSubmitting}
                  className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-brand-navy hover:bg-brand-navy-hover text-white shadow-lg shadow-brand-navy/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoginSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verificando Acesso...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Entrar no Painel</span>
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-4 border-t border-slate-100 text-xs text-slate-600">
                Ainda não possui uma loja?{' '}
                <Link href="/#cadastro" className="text-brand-navy font-bold hover:underline">
                  Cadastre-se gratuitamente
                </Link>
              </div>
            </div>
          ) : (
            /* Forgot Password Tab */
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-brand-amber border border-amber-200 flex items-center justify-center mx-auto">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Recuperar Senha</h2>
                <p className="text-xs text-slate-600">
                  Informe o seu e-mail cadastrado para receber o link de redefinição.
                </p>
              </div>

              {resetSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs text-center space-y-3">
                  <CheckCircle2 className="w-8 h-8 text-brand-green mx-auto" />
                  <div>
                    <strong className="block text-sm font-bold text-slate-900 mb-1">E-mail de recuperação enviado!</strong>
                    <span>Verifique sua caixa de entrada e spam para redefinir sua senha.</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('login')}
                    className="mt-2 text-brand-navy font-bold text-xs underline block mx-auto"
                  >
                    Voltar para o Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitReset(onResetSubmit)} className="space-y-4">
                  {serverError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
                      <span>{serverError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Seu E-mail Cadastrado *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        placeholder="seuemail@exemplo.com"
                        {...registerReset('email')}
                        className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${
                          resetErrors.email ? 'border-rose-500' : 'border-slate-200 focus:border-brand-navy'
                        } rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none transition-all`}
                      />
                    </div>
                    {resetErrors.email && (
                      <p className="text-xs text-rose-500 mt-1 font-medium">{resetErrors.email.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isResetSubmitting}
                    className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-brand-navy hover:bg-brand-navy-hover text-white shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isResetSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Enviando link...</span>
                      </>
                    ) : (
                      <span>Enviar Link de Recuperação</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="w-full text-center text-xs text-slate-500 hover:text-slate-900 font-bold py-1"
                  >
                    Cancelar e Voltar ao Login
                  </button>
                </form>
              )}
            </div>
          )}
        </motion.div>
      </main>

      {/* Footer info */}
      <footer className="p-4 text-center text-xs text-slate-500 relative z-10">
        <div className="flex items-center justify-center gap-1 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Educalizando Plataforma Digital — Autenticação Segura</span>
        </div>
      </footer>
    </div>
  );
}
