'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, GraduationCap, LogIn, UserPlus, ShieldCheck, BookOpen, ArrowRight, Loader2 } from 'lucide-react';
import { getCurrentStudentSession } from '@/lib/student-service';

export default function StudentPortalHomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkExistingSession() {
      try {
        const session = await getCurrentStudentSession();
        if (session) {
          router.push('/aluno/dashboard');
          return;
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    checkExistingSession();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden">
      
      {/* Background Radial Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            Educa<span className="text-blue-500">lizando</span>
          </span>
        </Link>

        <Link
          href="/login"
          className="text-xs font-bold text-slate-400 hover:text-white transition-colors border border-slate-800 bg-slate-900/60 px-4 py-2 rounded-xl"
        >
          Área do Criador
        </Link>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-xl w-full mx-auto px-4 py-12 text-center space-y-8 my-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 px-4 py-1.5 rounded-full text-xs font-extrabold shadow-inner">
            <GraduationCap className="w-4 h-4" />
            <span>Portal do Aluno Educalizando</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Acesse os materiais que você comprou na Educalizando
          </h1>

          <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-md mx-auto">
            Seus e-books, apostilas, simulados e cursos comprados em qualquer loja de nossos criadores organizados em um único lugar.
          </p>
        </motion.div>

        {/* Action Buttons Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-4"
        >
          <Link
            href="/aluno/login"
            className="w-full py-4 rounded-2xl font-extrabold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>Entrar na minha conta</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/aluno/cadastro"
            className="w-full py-4 rounded-2xl font-extrabold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-blue-400" />
            <span>Criar conta de aluno</span>
          </Link>

          <p className="text-[11px] text-slate-500 font-medium pt-2">
            Primeiro acesso? Crie sua senha informando o mesmo e-mail usado na compra.
          </p>
        </motion.div>

        {/* Security Trust Badge */}
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Download Direto & Acesso Protegido ao Material</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-slate-900 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Educalizando. Área de Membros Oficial do Aluno.</p>
      </footer>

    </div>
  );
}
