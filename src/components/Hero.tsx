'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, ShieldCheck, Award, Store, Users, CheckCircle2 } from 'lucide-react';
import MockupPreview from './MockupPreview';

export default function Hero() {
  const scrollToRegister = () => {
    const el = document.getElementById('cadastro');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Radial Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ff5722]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-[#10b981]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline & Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Top Target Audience Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ff5722]/10 border border-[#ff5722]/30 text-[#ff5722] text-xs font-bold uppercase tracking-wider"
            >
              <Sparkles className="w-4 h-4" />
              <span>A PLATAFORMA #1 PARA PROFESSORES E CRIADORES DIDÁTICOS</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.15] tracking-tight"
            >
              Venda seus <span className="gradient-text-coral">materiais didáticos</span> e lucre com o que você já produz
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed mx-auto lg:mx-0"
            >
              Transforme suas apostilas em PDF, e-books esquematizados, simulados e videoaulas em uma <strong className="text-white">fonte de renda recorrente</strong>. Tenha sua loja própria com <strong className="text-[#10b981]">PIX instantâneo</strong>, área de membros e certificados automáticos.
            </motion.p>

            {/* Key Differentiators Checklist */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="grid sm:grid-cols-2 gap-3 pt-2 max-w-xl mx-auto lg:mx-0 text-sm text-slate-300"
            >
              <div className="flex items-center gap-2 text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-[#10b981] flex-shrink-0" />
                <span>Receba direto na conta via PIX no checkout</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-[#10b981] flex-shrink-0" />
                <span>Área de membros com leitor digital de PDF</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-[#10b981] flex-shrink-0" />
                <span>Emissão automática de certificados</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-[#10b981] flex-shrink-0" />
                <span>Sem mensalidade (apenas pequena taxa/venda)</span>
              </div>
            </motion.div>

            {/* Call to Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4"
            >
              <button
                onClick={scrollToRegister}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-extrabold text-base bg-gradient-to-r from-[#ff5722] via-[#ea580c] to-[#f59e0b] text-white shadow-xl shadow-[#ff5722]/30 hover:shadow-[#ff5722]/50 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 group"
              >
                <Store className="w-5 h-5" />
                <span>Criar Minha Loja Grátis Agora</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#como-funciona"
                className="w-full sm:w-auto px-7 py-4 rounded-2xl font-bold text-base bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Ver como funciona</span>
              </a>
            </motion.div>

            {/* Social Proof Snippet */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex items-center justify-center lg:justify-start gap-3 pt-2 text-xs text-slate-400"
            >
              <div className="flex -space-x-2">
                <img className="w-7 h-7 rounded-full border-2 border-[#0b0f19]" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80" alt="Prof" />
                <img className="w-7 h-7 rounded-full border-2 border-[#0b0f19]" src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=80&q=80" alt="Prof" />
                <img className="w-7 h-7 rounded-full border-2 border-[#0b0f19]" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80" alt="Prof" />
              </div>
              <span>Junte-se a <strong className="text-slate-200">+15.000 professores</strong> vendendo diariamente</span>
            </motion.div>

          </div>

          {/* Right Column: Store Mockup Interactive Preview */}
          <div className="lg:col-span-5">
            <MockupPreview />
          </div>

        </div>
      </div>
    </section>
  );
}
