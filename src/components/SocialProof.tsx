'use client';

import { motion } from 'framer-motion';
import { Users, DollarSign, BookOpen, Smile } from 'lucide-react';

const STATS = [
  {
    icon: Users,
    value: '+15.000',
    label: 'Professores & Criadores',
    subtext: 'Vendendo materiais didáticos ativamente',
    color: 'text-[#ff5722]',
    bg: 'bg-[#ff5722]/10',
    border: 'border-[#ff5722]/20'
  },
  {
    icon: DollarSign,
    value: 'R$ 4,8 Milhões',
    label: 'Pagos aos Criadores',
    subtext: 'Transferências instantâneas via PIX',
    color: 'text-[#10b981]',
    bg: 'bg-[#10b981]/10',
    border: 'border-[#10b981]/20'
  },
  {
    icon: BookOpen,
    value: '+180.000',
    label: 'Materiais Entregues',
    subtext: 'Apostilas em PDF, E-books e Simulados',
    color: 'text-[#6366f1]',
    bg: 'bg-[#6366f1]/10',
    border: 'border-[#6366f1]/20'
  },
  {
    icon: Smile,
    value: '99,4%',
    label: 'Aprovação dos Alunos',
    subtext: 'Entrega imediata na Área de Membros',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20'
  }
];

export default function SocialProof() {
  return (
    <section className="py-12 relative z-10 border-y border-white/10 bg-slate-900/40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {STATS.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`p-6 rounded-2xl glass-panel glass-panel-hover border ${stat.border} flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {stat.value}
                  </h3>
                  <p className="text-sm font-bold text-slate-200 mt-1">
                    {stat.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {stat.subtext}
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
