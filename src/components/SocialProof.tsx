'use client';

import { motion } from 'framer-motion';
import { Zap, ShieldCheck, Headphones, Store, Sparkles } from 'lucide-react';

export default function SocialProof() {
  const TRUST_CARDS = [
    {
      icon: Zap,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      title: 'Checkout PIX Instantâneo',
      description: 'O aluno paga via QR Code ou Copia e Cola e o dinheiro cai direto na sua conta, com liberação automática do material.'
    },
    {
      icon: Store,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      title: 'Área de Membros Inclusa',
      description: 'Entregue apostilas em PDF, simulados e videoaulas em um ambiente seguro e profissional sob o nome da sua marca.'
    },
    {
      icon: ShieldCheck,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      title: 'Risco Zero & Sem Mensalidade',
      description: 'Crie sua loja e cadastre quantos materiais didáticos quiser sem pagar nada por mês. Você só paga taxa fixa quando vender.'
    },
    {
      icon: Headphones,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      title: 'Suporte Direto com o Fundador',
      description: 'Plataforma nova pensada para criadores. Você tem acesso direto à equipe para tirar dúvidas e sugerir melhorias.'
    }
  ];

  return (
    <section className="py-16 relative z-10 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Early-stage Trust Badge Banner */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-4 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> PLATAFORMA NOVA — SEJA UM DOS PRIMEIROS CRIADORES
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Construída sob medida para quem cria conteúdo educativo
          </h2>
          <p className="text-sm text-slate-600 font-medium">
            Transparência total desde o primeiro dia. Confira os diferenciais reais que você tem hoje no Educalizando:
          </p>
        </div>

        {/* 4 Real Benefits Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRUST_CARDS.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3"
              >
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {card.description}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
