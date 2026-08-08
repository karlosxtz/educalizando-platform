'use client';

import { motion } from 'framer-motion';
import { Zap, BookOpen, ShieldCheck, Headphones, Sparkles } from 'lucide-react';

const TRUST_CARDS = [
  {
    icon: Zap,
    title: 'Checkout PIX Instantâneo',
    description: 'Pagamentos direto na sua conta com confirmação automática no checkout.',
    color: 'text-[#10b981]',
    bg: 'bg-[#10b981]/10',
    border: 'border-[#10b981]/20'
  },
  {
    icon: BookOpen,
    title: 'Área de Membros Inclusa',
    description: 'Entrega segura de PDFs e videoaulas no leitor digital sem custo adicional.',
    color: 'text-[#6366f1]',
    bg: 'bg-[#6366f1]/10',
    border: 'border-[#6366f1]/20'
  },
  {
    icon: ShieldCheck,
    title: 'Risco Zero (Sem Mensalidade)',
    description: 'Você não paga nada para se cadastrar. Apenas uma taxa sobre as vendas efetuadas.',
    color: 'text-[#ff5722]',
    bg: 'bg-[#ff5722]/10',
    border: 'border-[#ff5722]/20'
  },
  {
    icon: Headphones,
    title: 'Suporte Direto com o Fundador',
    description: 'Atendimento próximo e acompanhamento ativo na criação da sua primeira loja.',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20'
  }
];

export default function SocialProof() {
  return (
    <section className="py-12 relative z-10 border-y border-white/10 bg-slate-900/40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Early Stage Badge */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/20 px-4 py-1.5 rounded-full">
            <Sparkles className="w-4 h-4" /> Plataforma Nova — Seja um dos Primeiros Criadores
          </span>
        </div>

        {/* Trust Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {TRUST_CARDS.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`p-6 rounded-2xl glass-panel glass-panel-hover border ${card.border} flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight mb-1">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
