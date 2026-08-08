'use client';

import { ShoppingCart, Sparkles } from 'lucide-react';

export default function OrdersPlaceholderPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <ShoppingCart className="w-6 h-6 text-blue-600" /> Pedidos & Vendas
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Acompanhe o histórico de vendas, relatórios de compras via PIX e dados dos alunos.
        </p>
      </div>

      <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs text-center max-w-lg mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="bg-blue-100 text-blue-700 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> EM BREVE
          </span>
          <h2 className="text-lg font-bold text-slate-900">Módulo de Gestão de Vendas</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Em breve você poderá visualizar os pedidos em tempo real, filtrar por período e exportar relatórios de vendas.
          </p>
        </div>
      </div>
    </div>
  );
}
