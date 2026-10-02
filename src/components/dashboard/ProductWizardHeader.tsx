'use client';

import { CheckCircle2,Package,X } from 'lucide-react';

export default function ProductWizardHeader({ currentStep, editing, onClose }: { currentStep: number; editing: boolean; onClose: () => void }) {
  const labels = ['Básico', 'Capa', 'Arquivo', 'Revisão'];
  const descriptions = ['Informações & Categorização', 'Capa do Material', 'Arquivo Entregável', 'Preço e Publicação'];
  return <>
    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-5">
      <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md"><Package className="h-5 w-5" /></div><div><h2 className="text-lg font-black leading-tight text-slate-900">{editing ? 'Editar Produto Didático' : 'Wizard de Cadastro de Produto'}</h2><p className="text-xs font-medium text-slate-500">Passo {currentStep} de 4 — {descriptions[currentStep - 1]}</p></div></div>
      <button onClick={onClose} aria-label="Fechar cadastro" className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"><X className="h-5 w-5" /></button>
    </div>
    <div className="border-b border-slate-200 bg-slate-100 px-6 py-3"><div className="mx-auto flex max-w-xl items-center justify-between gap-2">{labels.map((label, index) => { const step = index + 1; const completed = currentStep > step; const active = currentStep === step; return <div key={step} className="flex flex-1 items-center gap-2"><div className="flex items-center gap-2"><div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition-all ${completed ? 'bg-emerald-600 text-white' : active ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-200 text-slate-500'}`}>{completed ? <CheckCircle2 className="h-4 w-4" /> : step}</div><span className={`hidden text-xs font-bold sm:inline ${active ? 'text-blue-600' : 'text-slate-500'}`}>{label}</span></div>{index < 3 && <div className={`h-1 flex-1 rounded-full ${completed ? 'bg-emerald-500' : 'bg-slate-200'}`} />}</div>; })}</div></div>
  </>;
}
