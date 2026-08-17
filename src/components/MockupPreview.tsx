'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Award, Star, ExternalLink } from 'lucide-react';
import Image from 'next/image';

export default function MockupPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="relative w-full max-w-xl mx-auto"
    >
      {/* Soft Glow Backdrop */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-2xl blur-xl opacity-20 animate-pulse" />

      {/* Main Container Window */}
      <div className="relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl">
        {/* Browser Chrome Header */}
        <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
          </div>
          <div className="bg-white text-slate-700 text-[9px] sm:text-xs px-2 sm:px-3 py-1 rounded-full font-mono flex items-center gap-1 border border-slate-200 shadow-xs max-w-[140px] sm:max-w-none overflow-hidden">
            <span className="text-emerald-600 font-bold shrink-0">https://</span>
            <span className="truncate">educalizando.com.br/...</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>

        {/* Store Body Mockup */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Store Banner & Creator Profile */}
          <div className="bg-gradient-to-r from-brand-navy via-brand-teal to-brand-navy p-3 sm:p-4 rounded-xl text-white shadow-sm flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white p-0.5 shadow-md flex-shrink-0 relative">
              <Image
                src="/prof_profile.jpg"
                alt="Prof. Ricardo"
                fill
                className="rounded-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <h4 className="text-white font-bold text-sm sm:text-base truncate max-w-[130px] sm:max-w-none">Prof. Ricardo Silva</h4>
                <span className="bg-emerald-400/20 text-emerald-300 text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-300/30 flex items-center gap-1 whitespace-nowrap">
                  <ShieldCheck className="w-3 h-3 text-emerald-300 shrink-0" /> <span className="hidden sm:inline">VERIFICADO</span>
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-blue-100 truncate">Especialista em Redação & Matemática ENEM</p>
              <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-1.5 text-[10px] sm:text-[11px] text-blue-100 flex-wrap">
                <span className="flex items-center gap-1 text-brand-amber font-bold whitespace-nowrap">
                  <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-brand-amber" /> 4.9
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="text-emerald-300 font-semibold truncate">Entrega Garantida</span>
              </div>
            </div>
          </div>

          {/* Product Listing Card Mockup */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 sm:p-3.5 flex gap-2.5 sm:gap-3.5 items-center min-w-0 overflow-hidden">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200 relative">
              <Image
                src="/book_cover.jpg"
                alt="Material"
                fill
                className="object-cover"
              />
              <span className="absolute top-1 left-1 bg-brand-navy text-white text-[7px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.5 rounded">
                PDF+VÍDEO
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between text-[9px] sm:text-[11px] text-slate-500 mb-0.5 sm:mb-1 gap-1">
                <span className="text-brand-navy font-bold truncate">Apostila Digital ENEM</span>
                <span className="text-brand-green font-bold hidden min-[400px]:inline">Entrega Imediata</span>
              </div>
              <h5 className="text-slate-900 font-bold text-[11px] sm:text-xs truncate">
                Combo Definitivo ENEM: 1.000 Questões + Redação Nota 1000
              </h5>
              <p className="text-[9px] sm:text-[11px] text-slate-500 line-clamp-1 sm:line-clamp-2 mt-0.5 font-medium leading-tight">
                Modelos coringa de redação e mapas mentais ilustrados
              </p>

              <div className="flex flex-wrap items-center justify-between mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-200 gap-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-[9px] sm:text-[10px] text-slate-400 line-through">R$ 147,00</span>
                  <span className="text-slate-900 font-black text-xs sm:text-sm">R$ 67,90</span>
                </div>
                <button className="bg-brand-green hover:bg-brand-green-hover text-white text-[9px] sm:text-[11px] font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg flex items-center gap-1 shadow-xs transition-transform active:scale-95 whitespace-nowrap shrink-0">
                  <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white shrink-0" /> Comprar no PIX
                </button>
              </div>
            </div>
          </div>

          {/* Floating Badges */}
          <div className="grid grid-cols-3 gap-1 sm:gap-2 text-center text-[9px] sm:text-[10px]">
            <div className="bg-slate-50 border border-slate-200 p-1.5 sm:p-2 rounded-lg">
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-amber mx-auto mb-0.5 sm:mb-1" />
              <span className="text-slate-700 font-bold block leading-tight">PIX na Hora</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-1.5 sm:p-2 rounded-lg">
              <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-teal mx-auto mb-0.5 sm:mb-1" />
              <span className="text-slate-700 font-bold block leading-tight">Certificados</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-1.5 sm:p-2 rounded-lg">
              <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-green mx-auto mb-0.5 sm:mb-1" />
              <span className="text-slate-700 font-bold block leading-tight">Garantia 7 Dias</span>
            </div>
          </div>
        </div>

        {/* Small Illustrative Notice */}
        <div className="bg-slate-100 px-4 py-2 border-t border-slate-200 text-center text-[11px] text-slate-500 italic">
          💡 Exemplo ilustrativo de como a sua loja aparecerá para os alunos.
        </div>
      </div>
    </motion.div>
  );
}
