'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const FAQS = [
    {
      q: 'Quanto custa para criar minha loja no Educalizando?',
      a: 'Criar sua conta e sua loja na Educalizando é 100% gratuito. Não há taxa de adesão nem mensalidade fixa. Você só paga R$ 1,99 da taxa de processamento do PIX + R$ 0,99 fixo por produto vendido (0% de comissão).'
    },
    {
      q: 'Como recebo o dinheiro das minhas vendas?',
      a: 'Os pagamentos são processados via PIX instantâneo. O valor da venda fica disponível e pode ser transferido diretamente para a sua conta bancária via chave PIX.'
    },
    {
      q: 'Quais tipos de materiais posso vender?',
      a: 'Você pode vender apostilas digitais em PDF, e-books esquematizados, cadernos de questões, simulados gabaritados, videoaulas e cursos completos.'
    },
    {
      q: 'Como o meu aluno acessa o conteúdo após a compra?',
      a: 'Assim que o pagamento via PIX é confirmado (em poucos segundos), o aluno recebe acesso imediato à Área de Membros da sua loja para baixar os arquivos em PDF ou assistir aos vídeos.'
    },
    {
      q: 'Posso personalizar as cores e o nome da minha loja?',
      a: 'Sim! No seu painel de criador você define o nome da sua marca, adiciona sua logo, imagem de capa e escolhe a cor de destaque da sua vitrine pública.'
    }
  ];

  return (
    <section id="faq" className="py-20 relative z-10 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-extrabold uppercase tracking-widest text-brand-navy bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full inline-block">
            PERGUNTAS FREQUENTES
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Tire suas dúvidas sobre a plataforma
          </h2>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={faq.q}
                className="bg-slate-50 rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-base"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-brand-teal flex-shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-brand-navy' : ''}`} />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-6 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-200 font-medium"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
