'use client';

import { motion } from 'framer-motion';
import { 
  Zap, Award, Store, ShieldCheck, Lock, 
  Smartphone, Clock 
} from 'lucide-react';

export default function Benefits() {
  const BENEFITS_LIST = [
    {
      icon: Zap,
      title: 'Checkout PIX Instantâneo',
      desc: 'O aluno faz o pagamento via PIX e recebe acesso imediato. O valor cai direto na sua conta registrada.'
    },
    {
      icon: Store,
      title: 'Sua Própria Vitrine Virtual',
      desc: 'Um link exclusivo da sua marca (educalizando.com.br/loja/sua-loja) para centralizar todos os seus materiais.'
    },
    {
      icon: Award,
      title: 'Emissão de Certificados Automática',
      desc: 'Certificados personalizados gerados automaticamente para alunos que concluírem seus cursos digitais.'
    },
    {
      icon: Lock,
      title: 'Proteção Anti-Pirataria',
      desc: 'PDFs marcados com o CPF/e-mail do comprador no rodapé de cada página para desestimular o compartilhamento indevido.'
    },
    {
      icon: Smartphone,
      title: 'Área de Membros Responsiva',
      desc: 'Alunos podem ler apostilas e assistir videoaulas pelo celular, tablet ou computador de forma rápida.'
    },
    {
      icon: Clock,
      title: 'Atendimento & Suporte Dedicado',
      desc: 'Equipe pronta para atender criadores e resolver qualquer dúvida técnica de forma humana e rápida.'
    }
  ];

  return (
    <section id="beneficios" className="py-20 relative z-10 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-extrabold uppercase tracking-widest text-brand-navy bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full inline-block">
            POR QUE ESCOLHER O EDUCALIZANDO
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Tudo o que você precisa para monetizar seu conhecimento
          </h2>
          <p className="text-base text-slate-600 font-medium">
            Recursos projetados especificamente para criadores de infoprodutos e conteúdos digitais.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {BENEFITS_LIST.map((b, idx) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-brand-navy border border-slate-200 flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {b.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {b.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
