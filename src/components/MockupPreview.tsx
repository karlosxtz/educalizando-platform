'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Award, Star, CheckCircle, FileText, Video, ExternalLink } from 'lucide-react';

export default function MockupPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="relative w-full max-w-xl mx-auto"
    >
      {/* Glow Backdrop */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#ff5722] via-[#6366f1] to-[#10b981] rounded-2xl blur-xl opacity-30 animate-pulse" />

      {/* Main Container Window */}
      <div className="relative bg-[#111827] border border-white/15 rounded-2xl overflow-hidden shadow-2xl">
        {/* Browser Chrome Header */}
        <div className="bg-[#0b0f19] px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="bg-[#1f2937] text-slate-300 text-xs px-3 py-1 rounded-full font-mono flex items-center gap-1.5 border border-white/5">
            <span className="text-emerald-400 font-bold">https://</span>
            <span>educalizando.com.br/loja/prof-ricardo</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
        </div>

        {/* Store Body Mockup */}
        <div className="p-5 space-y-4">
          {/* Store Banner & Creator Profile */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 rounded-xl border border-white/10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#ff5722] to-amber-500 p-0.5 shadow-md flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                alt="Prof. Ricardo"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-white font-bold text-base">Prof. Ricardo Silva</h4>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> VERIFICADO
                </span>
              </div>
              <p className="text-xs text-slate-400">Especialista em Redação & Matemática ENEM</p>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-300">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-3 h-3 fill-amber-400" /> 4.9 (1.420 avaliações)
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">+3.800 materiais vendidos</span>
              </div>
            </div>
          </div>

          {/* Product Listing Card Mockup */}
          <div className="bg-[#1f2937]/70 border border-white/10 rounded-xl p-3.5 flex gap-3.5 items-center">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800 relative">
              <img
                src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=300&q=80"
                alt="Material"
                className="w-full h-full object-cover"
              />
              <span className="absolute top-1 left-1 bg-[#ff5722] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                PDF + VÍDEO
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span className="text-[#ff5722] font-bold">Apostila Digital ENEM</span>
                <span className="text-emerald-400 font-medium">Entrega Imediata</span>
              </div>
              <h5 className="text-white font-bold text-xs truncate">
                Combo Definitivo ENEM: 1.000 Questões + Redação Nota 1000
              </h5>
              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                Modelos coringa de redação e mapas mentais ilustrados
              </p>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                <div>
                  <span className="text-[10px] text-slate-400 line-through mr-1">R$ 147,00</span>
                  <span className="text-white font-black text-sm">R$ 67,90</span>
                </div>
                <button className="bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-1 shadow-md shadow-emerald-500/20">
                  <Zap className="w-3 h-3 fill-white" /> Comprar via PIX
                </button>
              </div>
            </div>
          </div>

          {/* Floating Badges */}
          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="bg-slate-800/80 border border-white/5 p-2 rounded-lg">
              <Zap className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
              <span className="text-slate-300 font-medium block">PIX na Hora</span>
            </div>
            <div className="bg-slate-800/80 border border-white/5 p-2 rounded-lg">
              <Award className="w-3.5 h-3.5 text-indigo-400 mx-auto mb-1" />
              <span className="text-slate-300 font-medium block">Certificados</span>
            </div>
            <div className="bg-slate-800/80 border border-white/5 p-2 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
              <span className="text-slate-300 font-medium block">Garantia 7 Dias</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
