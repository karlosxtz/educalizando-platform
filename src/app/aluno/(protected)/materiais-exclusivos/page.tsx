'use client';
import StudentHeader from '@/components/aluno/StudentHeader';
import ExclusiveMaterialPanel from '@/components/exclusive-material/ExclusiveMaterialPanel';
import ClientExclusiveRequestComposer from '@/components/exclusive-material/ClientExclusiveRequestComposer';
export default function Page() { return <div className="min-h-screen bg-slate-50"><StudentHeader/><main className="mx-auto max-w-7xl p-4 sm:p-8"><p className="text-xs font-black uppercase tracking-widest text-blue-600">Encomendas personalizadas</p><h1 className="mt-1 text-3xl font-black text-slate-950">Meus materiais exclusivos</h1><p className="mt-2 text-sm text-slate-600">Converse com o criador, aceite sua proposta, pague com segurança e receba os arquivos aqui.</p><div className="mt-7"><ClientExclusiveRequestComposer/><ExclusiveMaterialPanel view="customer"/></div></main></div>; }
