'use client';

import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { PLATFORM_CONFIG } from '@/lib/config';

export default function Pricing() {
  const scrollToCadastro = () => {
    const element = document.getElementById('cadastro');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const formattedFeePercent = PLATFORM_CONFIG.feePercent.toString().replace('.', ',');
  const formattedFeeFixed = PLATFORM_CONFIG.feeFixed.toFixed(2).replace('.', ',');

  return (
    <section id="precos" className="py-20 relative z-10 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-full inline-block">
            TRANSPARÊNCIA TOTAL DE PREÇOS
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Sem mensalidades. Você só paga quando vender.
          </h2>
          <p className="text-base text-slate-600 font-medium">
            Cadastre sua conta e publique materiais ilimitados. Cobramos apenas uma taxa por venda realizada.
          </p>
        </div>

        {/* Pricing Single Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-xl mx-auto bg-white rounded-3xl border-2 border-blue-600 p-8 sm:p-10 shadow-xl relative overflow-hidden space-y-8"
        >
          <div className="bg-blue-600 text-white text-[11px] font-extrabold uppercase tracking-widest py-1.5 px-4 rounded-full text-center w-max mx-auto shadow-sm">
            PLANO CRIADOR SEM MENSALIDADE
          </div>

          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Mensalidade Zero
            </span>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl sm:text-6xl font-black text-slate-900">R$ 0</span>
              <span className="text-sm font-bold text-slate-500">/mês</span>
            </div>
            <p className="text-xs text-blue-600 font-bold pt-1">
              + {formattedFeePercent}% + R$ {formattedFeeFixed} por transação aprovada
            </p>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-200 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Loja virtual própria com link exclusivo</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Checkout com pagamento via PIX instantâneo</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Upload ilimitado de apostilas em PDF e simulados</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Área de membros para hospedagem de videoaulas</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Gerador automático de certificados para os alunos</span>
            </div>
          </div>

          <button
            onClick={scrollToCadastro}
            className="w-full py-4 rounded-xl font-extrabold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
          >
            <span>Começar Agora Gratuitamente</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

      </div>
    </section>
  );
}
