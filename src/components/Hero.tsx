'use client';

import { motion } from 'framer-motion';
import { 
  Zap, ShieldCheck, ArrowRight, Store, FileText, 
  BookOpen, Video, Award, Sparkles, CheckCircle2 
} from 'lucide-react';
import MockupPreview from './MockupPreview';

export default function Hero() {
  const scrollToCadastro = () => {
    const element = document.getElementById('cadastro');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-slate-50">
      {/* Subtle Light Radial Glow Background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-8 text-center lg:text-left"
          >
            {/* Target Audience Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-brand-navy font-bold text-xs shadow-xs">
              <Sparkles className="w-4 h-4 text-brand-teal animate-pulse" />
              <span>PLATAFORMA EXCLUSIVA PARA PROFESSORES & CRIADORES</span>
            </div>

            {/* Main Headline with High Contrast Slate-900 and Brand Navy Highlight */}
            <h1 className="text-3xl min-[400px]:text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] break-words hyphens-auto">
              Crie sua loja de <br className="hidden sm:block" />
              <span className="text-brand-navy bg-gradient-to-r from-brand-navy via-brand-teal to-brand-navy bg-clip-text text-transparent break-all sm:break-normal">
                infoprodutos digitais
              </span> <br />
              e receba no PIX na hora.
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Venda apostilas em PDF, e-books esquematizados, simulados e videoaulas. 
              Sua própria vitrine com área de membros, entrega automática de conteúdo e zero mensalidade.
            </p>

            {/* Main CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={scrollToCadastro}
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-extrabold text-base bg-brand-navy hover:bg-brand-navy-hover text-white shadow-lg shadow-brand-navy/25 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 group"
              >
                <Store className="w-5 h-5" />
                <span>Criar minha loja grátis</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => {
                  const element = document.getElementById('como-funciona');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-6 py-4 rounded-xl font-bold text-sm bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <span>Ver como funciona</span>
              </button>
            </div>

            {/* Key Trust Signals */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-600">
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <Zap className="w-4 h-4 text-brand-amber flex-shrink-0" />
                <span>PIX Instantâneo</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-green flex-shrink-0" />
                <span>Sem Mensalidade</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-2 col-span-2 sm:col-span-1">
                <Award className="w-4 h-4 text-brand-teal flex-shrink-0" />
                <span>Área de Membros</span>
              </div>
            </div>

          </motion.div>

          {/* Right Interactive Mockup Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            <MockupPreview />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
