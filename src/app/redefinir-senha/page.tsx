'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Lock, Eye, EyeOff, Loader2,
  ArrowLeft, ShieldCheck, CheckCircle2, AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function RedefinirSenhaPage() {
  const router = useRouter();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (password.length < 6) {
      setServerError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setServerError('As senhas não coincidem.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw new Error(error.message);
      }

      setIsSuccess(true);
      
      // Delay curto para o usuário ler a mensagem de sucesso
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);

    } catch (err: any) {
      setServerError(err.message || 'Erro ao redefinir a senha. Tente solicitar um novo link de recuperação.');
    } finally {
      setIsSubmitting(false);
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
          href="/login"
          className="text-xs text-slate-600 hover:text-brand-navy flex items-center gap-1 font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Login</span>
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
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-navy/10 text-brand-navy flex items-center justify-center mx-auto mb-2">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-slate-900">Crie sua nova senha</h1>
              <p className="text-xs text-slate-600">
                Digite uma senha forte e confirme para voltar a acessar a plataforma.
              </p>
            </div>

            {isSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-brand-green mx-auto" />
                <div>
                  <strong className="block text-sm font-bold text-slate-900 mb-1">Senha alterada com sucesso!</strong>
                  <span>Redirecionando você para o login em instantes...</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {serverError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center gap-3 font-medium">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
                    <span>{serverError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Nova Senha *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Confirmar Nova Senha *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 mt-2 rounded-xl font-extrabold text-sm bg-brand-navy hover:bg-brand-navy-hover text-white shadow-lg shadow-brand-navy/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Atualizando Senha...</span>
                    </>
                  ) : (
                    <span>Redefinir Senha</span>
                  )}
                </button>
              </form>
            )}
          </div>
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
