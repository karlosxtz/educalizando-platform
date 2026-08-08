'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { 
  Sparkles, Mail, Lock, Eye, EyeOff, LogIn, 
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

  // Form de Login
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

  // Form de Esqueci Senha
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
      // Redirecionamento Automático pós-login para a loja no dashboard
      router.push('/dashboard/loja');
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
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col justify-between font-sans selection:bg-[#ff5722] selection:text-white relative overflow-hidden">
      {/* Background Radial Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#ff5722]/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Top Header */}
      <header className="p-6 max-w-7xl w-full mx-auto flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ff5722] to-[#6366f1] flex items-center justify-center shadow-lg shadow-[#ff5722]/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            Educa<span className="text-[#ff5722]">lizando</span>
          </span>
        </Link>

        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold transition-colors"
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
          className="w-full max-w-md glass-panel border-[#ff5722]/30 p-8 shadow-2xl relative overflow-hidden space-y-6"
        >
          {activeTab === 'login' ? (
            /* Login Form Tab */
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#ff5722]/10 text-[#ff5722] border border-[#ff5722]/20 flex items-center justify-center mx-auto">
                  <LogIn className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-black text-white">Acesse o seu Painel</h1>
                <p className="text-xs text-slate-400">
                  Gerencie sua loja didática, acompanhe vendas e cadastre produtos.
                </p>
              </div>

              {serverError && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-xl text-xs flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
                  <span>{serverError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="space-y-4">
                {/* E-mail Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    E-mail Cadastrado *
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      {...registerLogin('email')}
                      className={`w-full pl-11 pr-4 py-3 bg-[#0b0f19]/70 border ${
                        loginErrors.email ? 'border-rose-500 focus:ring-rose-500' : 'border-white/10 focus:border-[#ff5722]'
                      } rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-1 transition-all`}
                    />
                  </div>
                  {loginErrors.email && (
                    <p className="text-xs text-rose-400 mt-1 font-medium">{loginErrors.email.message}</p>
                  )}
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Sua Senha *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setServerError(null);
                        setResetSuccess(false);
                        setActiveTab('forgot');
                      }}
                      className="text-xs text-[#ff5722] hover:underline font-semibold"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...registerLogin('password')}
                      className={`w-full pl-11 pr-11 py-3 bg-[#0b0f19]/70 border ${
                        loginErrors.password ? 'border-rose-500 focus:ring-rose-500' : 'border-white/10 focus:border-[#ff5722]'
                      } rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-1 transition-all`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="text-xs text-rose-400 mt-1 font-medium">{loginErrors.password.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoginSubmitting}
                  className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-[#ff5722] via-[#ea580c] to-[#f59e0b] text-white shadow-xl shadow-[#ff5722]/25 hover:shadow-[#ff5722]/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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

              {/* Sign Up Redirect */}
              <div className="text-center pt-4 border-t border-white/10 text-xs text-slate-400">
                Ainda não possui uma loja?{' '}
                <Link href="/#cadastro" className="text-[#ff5722] font-bold hover:underline">
                  Cadastre-se gratuitamente
                </Link>
              </div>
            </div>
          ) : (
            /* Forgot Password Tab */
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-white">Recuperar Senha</h2>
                <p className="text-xs text-slate-400">
                  Informe o seu e-mail cadastrado para receber o link de redefinição.
                </p>
              </div>

              {resetSuccess ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl text-xs text-center space-y-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <div>
                    <strong className="block text-sm font-bold text-white mb-1">E-mail de recuperação enviado!</strong>
                    <span>Verifique sua caixa de entrada e spam para redefinir sua senha.</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('login')}
                    className="mt-2 text-[#ff5722] font-bold text-xs underline block mx-auto"
                  >
                    Voltar para o Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitReset(onResetSubmit)} className="space-y-4">
                  {serverError && (
                    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-xl text-xs flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
                      <span>{serverError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Seu E-mail Cadastrado *
                    </label>
                    <div className="relative">
                      <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        placeholder="seuemail@exemplo.com"
                        {...registerReset('email')}
                        className={`w-full pl-11 pr-4 py-3 bg-[#0b0f19]/70 border ${
                          resetErrors.email ? 'border-rose-500 focus:ring-rose-500' : 'border-white/10 focus:border-[#ff5722]'
                        } rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-1 transition-all`}
                      />
                    </div>
                    {resetErrors.email && (
                      <p className="text-xs text-rose-400 mt-1 font-medium">{resetErrors.email.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isResetSubmitting}
                    className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-amber-500 to-[#ff5722] text-white shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
                    className="w-full text-center text-xs text-slate-400 hover:text-white font-semibold py-1"
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
        <div className="flex items-center justify-center gap-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Educalizando Plataforma Digital — Autenticação Segura</span>
        </div>
      </footer>
    </div>
  );
}
