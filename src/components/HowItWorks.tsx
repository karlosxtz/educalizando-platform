'use client';

import { motion } from 'framer-motion';
import { UserPlus, Upload, Share2, Wallet, ArrowRight } from 'lucide-react';

export default function HowItWorks() {
  const STEPS = [
    {
      num: '01',
      icon: UserPlus,
      title: 'Cadastre sua Loja',
      description: 'Preencha o formulário em menos de 2 minutos. Escolha o nome e o link exclusivo da sua marca.'
    },
    {
      num: '02',
      icon: Upload,
      title: 'Suba seus Materiais',
      description: 'Cadastre suas apostilas em PDF, simulados, e-books ou cursos. Defina o valor de cada conteúdo.'
    },
    {
      num: '03',
      icon: Share2,
      title: 'Divulgue para seus Alunos',
      description: 'Compartilhe o link da sua loja nas suas redes sociais, grupos de estudo e canais do Telegram.'
    },
    {
      num: '04',
      icon: Wallet,
      title: 'Receba no PIX na Hora',
      description: 'O pagamento é processado via PIX e o material é entregue automaticamente para o aluno.'
    }
  ];

  return (
    <section id="como-funciona" className="py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-full inline-block">
            PASSO A PASSO SIMPLES
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Como funciona o Educalizando?
          </h2>
          <p className="text-base text-slate-600">
            Simplificamos todo o processo técnico para você focar no que faz de melhor: ensinar e criar conteúdo didático.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black text-slate-300">
                    {step.num}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  {step.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
