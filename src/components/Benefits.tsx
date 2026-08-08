'use client';

import { motion } from 'framer-motion';
import { Zap, BookOpen, Award, Store, BarChart3, ShieldCheck, CheckCircle2 } from 'lucide-react';

const BENEFITS = [
  {
    icon: Zap,
    title: 'Checkout PIX Instantâneo de Alta Conversão',
    description: 'Converta mais vendas com um checkout ultra-rápido otimizado para celulares. O aluno paga via QR Code ou Copia e Cola e a liberação é imediata.',
    tag: 'PIX + Cartão em 12x',
    color: 'text-[#10b981]',
    glow: 'group-hover:border-[#10b981]/40'
  },
  {
    icon: BookOpen,
    title: 'Área de Membros com Leitor de PDF Integrado',
    description: 'Entregue seus e-books e apostilas didáticas em uma plataforma moderna e protegida contra pirataria, com leitor online e player de vídeo.',
    tag: 'Proteção Antipirataria',
    color: 'text-[#6366f1]',
    glow: 'group-hover:border-[#6366f1]/40'
  },
  {
    icon: Award,
    title: 'Emissão Automática de Certificados',
    description: 'Seus alunos recebem automaticamente um certificado digital de conclusão com carga horária, QR Code de validação e selo de autenticidade.',
    tag: 'Valor Agregado',
    color: 'text-amber-400',
    glow: 'group-hover:border-amber-400/40'
  },
  {
    icon: Store,
    title: 'Sua Loja Própria e Personalizada',
    description: 'Tenha seu próprio link oficial de vendas (educalizando.com.br/loja/sua-marca) para colocar na bio do seu Instagram, YouTube ou TikTok.',
    tag: 'Sua Marca em Destaque',
    color: 'text-[#ff5722]',
    glow: 'group-hover:border-[#ff5722]/40'
  },
  {
    icon: BarChart3,
    title: 'Painel Financeiro & Afiliados',
    description: 'Acompanhe a receita diária, o ticket médio e recrute parceiros/afiliados que divulgam seus materiais didáticos em troca de comissão.',
    tag: 'Escala de Vendas',
    color: 'text-sky-400',
    glow: 'group-hover:border-sky-400/40'
  },
  {
    icon: ShieldCheck,
    title: 'Garantia e Suporte Automatizado',
    description: 'Gerenciamento automático de reembolsos de 7 dias e suporte técnico integrado aos alunos para você focar apenas em criar conteúdo.',
    tag: 'Tranquilidade 100%',
    color: 'text-rose-400',
    glow: 'group-hover:border-rose-400/40'
  }
];

export default function Benefits() {
  return (
    <section id="beneficios" className="py-24 relative z-10 bg-slate-950/60 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/20 px-3.5 py-1.5 rounded-full inline-block">
            DIFERENCIAIS EXCLUSIVOS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Por que escolher o <span className="gradient-text-emerald">Educalizando</span>?
          </h2>
          <p className="text-base sm:text-lg text-slate-300">
            Fomos criados especificamente para atender as necessidades de quem ensina e produz material educativo.
          </p>
        </div>

        {/* Benefits Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {BENEFITS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`p-8 rounded-2xl bg-[#111827]/90 backdrop-blur-xl border border-white/10 ${item.glow} transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between group`}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-3.5 rounded-2xl bg-white/5 border border-white/10 ${item.color}`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-white/5 border border-white/5 px-2.5 py-1 rounded-full">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#10b981] transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                  <span>Incluso em todos os cadastros</span>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
