'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles, Store, Zap } from 'lucide-react';

export default function Pricing() {
  const scrollToRegister = () => {
    const el = document.getElementById('cadastro');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="precos" className="py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#ff5722] bg-[#ff5722]/10 border border-[#ff5722]/20 px-3.5 py-1.5 rounded-full inline-block">
            TRANSPARÊNCIA TOTAL
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Você só paga quando <span className="gradient-text-coral">vender</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-300">
            Sem mensalidades fixas, sem custos escondidos e sem taxa de adesão. Risco zero para começar.
          </p>
        </div>

        {/* Pricing Card Container */}
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative glass-panel border-[#ff5722]/30 p-8 sm:p-12 overflow-hidden shadow-2xl"
          >
            {/* Top Ribbon Badge */}
            <div className="absolute top-0 right-0 bg-gradient-to-l from-[#ff5722] to-amber-500 text-white text-xs font-extrabold px-6 py-1.5 rounded-bl-xl shadow-md uppercase tracking-wider">
              CADASTRO GRÁTIS
            </div>

            <div className="text-center mb-8 border-b border-white/10 pb-8">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Plano Criador Educalizando</span>
              
              <div className="mt-4 flex items-baseline justify-center gap-2">
                <span className="text-5xl sm:text-6xl font-black text-white">R$ 0</span>
                <span className="text-slate-400 font-semibold">/mês para sempre</span>
              </div>

              <p className="mt-3 text-sm text-[#10b981] font-bold flex items-center justify-center gap-1.5">
                <Zap className="w-4 h-4 fill-[#10b981]" /> Apenas uma pequena taxa de 9,9% + R$ 1,00 por venda efetuada
              </p>
            </div>

            {/* Feature Checklist */}
            <div className="space-y-4 mb-8 text-sm text-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#10b981]/20 text-[#10b981] flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Sua loja própria com slug exclusivo na plataforma</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#10b981]/20 text-[#10b981] flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Cadastro ilimitado de e-books em PDF, apostilas e videoaulas</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#10b981]/20 text-[#10b981] flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Checkout com recebimento instantâneo via PIX</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#10b981]/20 text-[#10b981] flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Área de membros segura para entrega automática de materiais</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#10b981]/20 text-[#10b981] flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Emissão automática de certificados digitais para seus alunos</span>
              </div>
            </div>

            {/* Pricing CTA */}
            <button
              onClick={scrollToRegister}
              className="w-full py-4 rounded-xl font-extrabold text-base bg-gradient-to-r from-[#ff5722] via-[#ea580c] to-[#f59e0b] text-white shadow-xl shadow-[#ff5722]/30 hover:shadow-[#ff5722]/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <Store className="w-5 h-5" />
              <span>Criar Minha Conta Grátis Agora</span>
            </button>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
