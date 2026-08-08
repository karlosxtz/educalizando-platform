'use client';

import { Wallet, Sparkles, ShieldCheck } from 'lucide-react';

export default function FinancialPlaceholderPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <Wallet className="w-6 h-6 text-blue-600" /> Extrato Financeiro & Saques
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Gerencie o saldo disponível, histórico de saques via PIX e dados bancários.
        </p>
      </div>

      <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs text-center max-w-lg mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <Wallet className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> SPLIT DE PAGAMENTO ASAAS
          </span>
          <h2 className="text-lg font-bold text-slate-900">Módulo Financeiro & Split Automático</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            A infraestrutura com subconta Asaas já possui o campo reservado no banco. Em breve você poderá transferir seu saldo direto para sua chave PIX com taxa fixa de 9,9% + R$ 1,00.
          </p>
        </div>
      </div>
    </div>
  );
}
