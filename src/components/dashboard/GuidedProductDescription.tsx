'use client';
import { useState, useId } from 'react';
import { DESCRIPTION_FIELDS, parseProductDescription, composeProductDescription, type DescriptionDraft } from '@/lib/product-description-sections';
import ProductDescriptionContent from '@/components/store/ProductDescriptionContent';

export default function GuidedProductDescription({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [draft, setDraft] = useState<DescriptionDraft | null>(null);
  const [base, setBase] = useState('');
  const [notice, setNotice] = useState('');
  const id = useId();
  const open = () => { setBase(value); setDraft(parseProductDescription(value)); setNotice(''); };
  const composed = draft ? composeProductDescription(draft) : '';
  const changedOutside = Boolean(draft && value !== base);
  return <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-bold text-blue-950">Uma descrição que ajuda a escolher</h3><p className="mt-1 text-xs leading-5 text-slate-600">Organize o que acompanha, como usar e as condições do seu material. Nenhuma informação é inventada.</p></div><button type="button" onClick={open} className="min-h-11 rounded-xl bg-blue-700 px-4 text-xs font-bold text-white">{draft ? 'Recarregar texto atual' : 'Montar descrição por tópicos'}</button></div>
    {notice && <p role="status" className="mt-3 text-sm font-medium text-emerald-800">{notice}</p>}
    {draft && <div className="mt-5 space-y-5">
      {changedOutside && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">O texto principal mudou enquanto você editava os tópicos. Recarregue o texto atual antes de aplicar para não perder alterações.</p>}
      <div className="grid gap-4 md:grid-cols-2">{DESCRIPTION_FIELDS.map(field => <div key={field.key}><label htmlFor={`${id}-${field.key}`} className="text-xs font-bold text-slate-800">{field.title}</label><p id={`${id}-${field.key}-hint`} className="mt-1 text-xs leading-5 text-slate-500">{field.hint}</p><textarea id={`${id}-${field.key}`} aria-describedby={`${id}-${field.key}-hint`} rows={4} value={draft[field.key]} onChange={event => setDraft({ ...draft, [field.key]: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-blue-600" /></div>)}</div>
      <details className="rounded-xl border border-slate-200 bg-white p-4"><summary className="cursor-pointer text-sm font-bold text-slate-800">Conferir descrição organizada</summary><div className="mt-4">{composed ? <ProductDescriptionContent value={composed} /> : <p className="text-sm text-slate-500">Preencha os tópicos para visualizar.</p>}</div></details>
      <p className="text-xs leading-5 text-slate-600">Preencha apenas o que você sabe. Campos vazios ficam de fora. Aplicar altera somente o formulário; a publicação acontece ao salvar o produto.</p>
      <div className="flex flex-wrap gap-3"><button type="button" disabled={!composed || changedOutside} onClick={() => { onChange(composed); setDraft(null); setNotice('Descrição aplicada ao formulário. Revise e salve o produto para publicar.'); }} className="min-h-11 rounded-xl bg-blue-700 px-4 text-sm font-bold text-white disabled:opacity-50">Usar esta descrição</button><button type="button" onClick={() => setDraft(null)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700">Cancelar tópicos</button></div>
    </div>}
  </div>;
}
