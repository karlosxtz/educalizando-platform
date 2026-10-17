'use client';
import { useEffect, useState } from 'react';
import { AI_WRITING_PRESETS, type AiEditorStyle } from '@/lib/ai-editor-options';

export function AiWritingOptions({ style, brief, disabled, onStyle, onBrief }: { style: AiEditorStyle; brief: string; disabled: boolean; onStyle: (style: AiEditorStyle) => void; onBrief: (brief: string) => void }) {
  const selected = AI_WRITING_PRESETS.find(preset => preset.brief === brief && preset.style === style);
  return <div className="mt-4 rounded-2xl border border-violet-100 bg-white p-4 sm:p-5">
    <div><h4 className="text-sm font-bold text-slate-900">Escolha uma orientação pronta</h4><p className="mt-1 text-xs leading-5 text-slate-500">Clique em uma sugestão para preencher o pedido e ajustar o estilo. Depois, escolha a ferramenta que vai gerar o texto.</p></div>
    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{AI_WRITING_PRESETS.map(preset => <button type="button" key={preset.id} disabled={disabled} aria-pressed={selected?.id === preset.id} onClick={() => { onStyle(preset.style); onBrief(preset.brief); }} className={`rounded-xl border p-3 text-left transition disabled:opacity-50 ${selected?.id === preset.id ? 'border-violet-500 bg-violet-50 ring-1 ring-violet-200' : 'border-slate-200 hover:border-violet-300 hover:bg-violet-50/50'}`}><span className="block text-xs font-bold text-violet-900">{preset.label}{selected?.id === preset.id ? ' · Selecionada' : ''}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{preset.description}</span></button>)}</div>
    <div className="mt-4 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
    <label className="text-xs font-bold text-slate-600">Estilo do texto<select value={style} disabled={disabled} onChange={event => onStyle(event.target.value as AiEditorStyle)} className="mt-2 w-full rounded-lg border border-slate-200 p-2.5 text-sm"><option value="natural">Natural e acolhedor</option><option value="concise">Direto e objetivo</option><option value="detailed">Detalhado e explicativo</option></select></label>
    <label className="text-xs font-bold text-slate-600">Pedido para a IA <span className="font-normal">Personalizável</span><textarea value={brief} disabled={disabled} maxLength={600} onChange={event => onBrief(event.target.value)} rows={4} placeholder="Escolha uma sugestão acima ou escreva o que deseja ajustar." className="mt-2 w-full resize-y rounded-lg border border-slate-200 p-2.5 text-sm font-normal leading-6" /><span className="flex justify-between gap-2 font-normal text-slate-500"><span>A IA usa somente os fatos cadastrados no material.</span><span>{brief.length}/600</span></span></label>
    </div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><p role="status" className="text-xs text-violet-700">{selected ? `Orientação pronta: ${selected.label}. Você pode editar o pedido.` : brief.trim() ? 'Pedido personalizado. Selecione uma ferramenta para gerar.' : 'Escolha uma orientação ou escreva seu pedido.'}</p><button type="button" disabled={disabled || !brief} onClick={() => onBrief('')} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-40">Limpar pedido</button></div>
  </div>;
}

export function AiGenerationStatus({ label, onCancel }: { label: string; onCancel: () => void }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => { const start = Date.now(); const timer = setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 1000); return () => clearInterval(timer); }, []);
  return <div role="status" className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900"><div><p className="font-bold">{label} · {seconds}s</p><p className="mt-1 text-xs">{seconds < 20 ? 'Preparando a resposta a partir dos dados do material.' : 'Ainda aguardando o provedor. Você pode cancelar a espera.'}</p></div><button type="button" onClick={onCancel} className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-bold">Cancelar</button></div>;
}
