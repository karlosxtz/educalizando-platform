'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q: 'Preciso pagar alguma mensalidade para cadastrar minha loja?',
    a: 'Não! O cadastro no Educalizando é 100% gratuito. Não cobramos nenhuma taxa de adesão nem mensalidade recorrente. Você só paga uma pequena comissão (9,9% + R$ 1,00) por cada venda realizada.'
  },
  {
    q: 'Como recebo o dinheiro das minhas vendas?',
    a: 'Todas as vendas realizadas via PIX são processadas no checkout instantâneo e disponibilizadas no seu saldo do Educalizando. Você pode solicitar o saque direto para sua chave PIX a qualquer momento.'
  },
  {
    q: 'Quais tipos de materiais didáticos posso vender?',
    a: 'Você pode vender apostilas digitais em PDF, e-books esquematizados, cadernos de exercícios e simulados com gabarito, videoaulas preparatórias, modelos de redação, planos de aula e kits pedagógicos completos.'
  },
  {
    q: 'Como é feita a entrega do material para o aluno?',
    a: 'Assim que o pagamento é aprovado, o aluno recebe acesso imediato à Área de Membros do Educalizando. Lá ele pode visualizar e ler os e-books em PDF no nosso leitor digital, assistir a videoaulas e baixar os arquivos anexos de forma protegida.'
  },
  {
    q: 'Como funciona a emissão de certificados?',
    a: 'A plataforma gera automaticamente um certificado digital de conclusão em PDF quando o aluno conclui a leitura ou visualização das aulas do seu material, com carga horária e código de verificação único.'
  },
  {
    q: 'Posso cadastrar afiliados para venderem meus materiais?',
    a: 'Sim! Você pode ativar o programa de afiliados e definir qual percentual de comissão (ex: 50%) parceiros e outros professores receberão por indicar sua loja e seus materiais didáticos.'
  }
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-24 relative z-10 bg-slate-950/40 border-t border-white/10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#6366f1] bg-[#6366f1]/10 border border-[#6366f1]/20 px-3.5 py-1.5 rounded-full inline-block">
            Tire Suas Dúvidas
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Perguntas Frequentes de <span className="gradient-text-coral">Criadores</span>
          </h2>
          <p className="text-base text-slate-300">
            Respostas claras para você começar a vender seus materiais com total segurança.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {FAQS.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-[#111827]/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-white hover:text-[#ff5722] transition-colors"
                >
                  <span className="text-base sm:text-lg flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-[#ff5722] flex-shrink-0" />
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 flex-shrink-0 ${
                      isOpen ? 'rotate-180 text-[#ff5722]' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-6 pt-0 text-sm text-slate-300 leading-relaxed border-t border-white/5 mt-2">
                        {item.a}
                      </div>
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
