'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { PLATFORM_CONFIG } from '@/lib/config';

export default function Pricing() {
  const [productPrice, setProductPrice] = useState('50');
  const calculations = useMemo(() => {
    const gross = Math.max(0, Number(productPrice.replace(',', '.')) || 0);
    const fee = gross * (PLATFORM_CONFIG.feePercent / 100);
    return { gross, fee, net: gross - fee };
  }, [productPrice]);

  const formatBRL = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const scrollToCadastro = () => {
    const element = document.getElementById('cadastro');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="precos" className="py-20 relative z-10 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-extrabold uppercase tracking-widest text-brand-navy bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full inline-block">
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
          className="max-w-xl mx-auto bg-white rounded-3xl border-2 border-brand-navy p-8 sm:p-10 shadow-xl relative overflow-hidden space-y-8"
        >
          <div className="bg-brand-navy text-white text-[9px] sm:text-[11px] font-extrabold uppercase tracking-widest py-1.5 px-3 sm:px-4 rounded-full text-center w-max mx-auto shadow-sm">
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
            <p className="text-xs text-brand-navy font-bold pt-1">
              Taxa Educalizando: 13% por venda, sem taxa fixa
            </p>
          </div>

          <div className="rounded-2xl border border-brand-green/30 bg-emerald-50/60 p-5 space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-brand-navy">Simule seu valor líquido</h3>
              <p className="text-xs text-slate-600 font-medium mt-1">Digite o preço do produto e veja o desconto de 13%.</p>
            </div>
            <label className="block text-xs font-bold text-slate-700">
              Preço do produto
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={productPrice}
                  onChange={(event) => setProductPrice(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-base font-bold text-slate-900 outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                  aria-label="Preço do produto"
                />
              </div>
            </label>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-white border border-slate-200 p-3">
                <span className="block text-slate-500 font-semibold">Taxa (13%)</span>
                <strong className="text-red-600 text-base">-{formatBRL(calculations.fee)}</strong>
              </div>
              <div className="rounded-xl bg-white border border-brand-green/40 p-3">
                <span className="block text-slate-500 font-semibold">Você recebe</span>
                <strong className="text-brand-green text-base">{formatBRL(calculations.net)}</strong>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-200 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-brand-green flex-shrink-0" />
              <span>Loja virtual própria com link exclusivo</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-brand-green flex-shrink-0" />
              <span>Checkout com pagamento via PIX instantâneo</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-brand-green flex-shrink-0" />
              <span>Upload ilimitado de apostilas em PDF e simulados</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-brand-green flex-shrink-0" />
              <span>Área de membros para hospedagem de videoaulas</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-brand-green flex-shrink-0" />
              <span>Gerador automático de certificados para os alunos</span>
            </div>
          </div>

          <button
            onClick={scrollToCadastro}
            className="w-full py-4 rounded-xl font-extrabold text-sm bg-brand-navy hover:bg-brand-navy-hover text-white shadow-lg shadow-brand-navy/25 transition-all flex items-center justify-center gap-2"
          >
            <span>Começar Agora Gratuitamente</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

      </div>
    </section>
  );
}
