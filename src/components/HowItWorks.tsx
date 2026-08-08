'use client';

import { motion } from 'framer-motion';
import { UserPlus, Store, UploadCloud, Zap } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    icon: UserPlus,
    title: 'Cadastre sua conta grátis',
    description: 'Preencha seus dados de professor em 1 minuto. Sem taxa de adesão ou contrato de fidelidade.',
    color: 'from-[#ff5722] to-amber-500'
  },
  {
    step: '02',
    icon: Store,
    title: 'Crie sua Loja Exclusiva',
    description: 'Defina a marca e o link próprio da sua loja (ex: educalizando.com.br/loja/sua-marca).',
    color: 'from-amber-500 to-[#10b981]'
  },
  {
    step: '03',
    icon: UploadCloud,
    title: 'Publique seus Materiais',
    description: 'Cadastre apostilas em PDF, e-books, simulados ou videoaulas definindo o preço desejado.',
    color: 'from-[#10b981] to-[#6366f1]'
  },
  {
    step: '04',
    icon: Zap,
    title: 'Venda e Receba via PIX',
    description: 'Os alunos compram no seu checkout com liberação automática na Área de Membros e PIX na sua conta.',
    color: 'from-[#6366f1] to-[#ff5722]'
  }
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#ff5722] bg-[#ff5722]/10 border border-[#ff5722]/20 px-3.5 py-1.5 rounded-full inline-block">
            SIMPLICIDADE TOTAL
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Como funciona o <span className="gradient-text-coral">Educalizando</span>?
          </h2>
          <p className="text-base sm:text-lg text-slate-300">
            Tudo o que você precisa para transformar seu conhecimento em um negócio digital lucrativo em 4 passos simples.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {STEPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="relative bg-[#111827]/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl flex flex-col justify-between group hover:border-[#ff5722]/40 transition-all hover:-translate-y-1"
              >
                <div>
                  {/* Step Number & Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} p-0.5 shadow-lg flex items-center justify-center`}>
                      <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <span className="text-3xl font-black text-slate-700 group-hover:text-[#ff5722] transition-colors">
                      {item.step}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-xs font-bold text-[#ff5722]">
                  <span>Passo {item.step} de 04</span>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
