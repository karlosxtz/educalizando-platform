'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useId, useRef, useState, useTransition, useEffect } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { INITIAL_GLOBAL_CATEGORIES, INITIAL_EDUCATION_LEVELS } from '@/lib/category-service';
import type { Discipline } from '@/lib/discipline-service';
import { SCHOOL_CALENDAR_TAGS } from '@/lib/school-calendar';
import { searchHref } from '@/lib/search-navigation';

const keys = ['categoria', 'ano_escolar', 'preco', 'disciplina', 'formato', 'filter', 'data'];

export default function SearchSidebar({ disciplines = [] }: { disciplines?: Discipline[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const previousOverflow = useRef('');
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(params.toString());
  const [pending, startTransition] = useTransition();
  const count = keys.filter(key => params.has(key)).length;
  const close = () => dialog.current?.close();
  useEffect(() => {
    if (!open) return;
    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow.current; };
  }, [open]);
  const groups = [
    { key: 'categoria', label: 'Categoria', options: INITIAL_GLOBAL_CATEGORIES.map(c => [c.slug, c.nome]) },
    { key: 'ano_escolar', label: 'Nível de ensino', options: INITIAL_EDUCATION_LEVELS.map(c => [c.slug, c.nome]) },
    { key: 'preco', label: 'Preço do produto final', options: [['gratis', 'Grátis'], ['pago', 'Pago']] },
    { key: 'disciplina', label: 'Disciplina (BNCC)', options: disciplines.map(d => [d.name, d.name]) },
    { key: 'formato', label: 'Formato', options: [['pdf', 'PDF'], ['word', 'Word'], ['ppt', 'Apresentação (PPT)'], ['planilha', 'Planilha']] },
    { key: 'filter', label: 'Licença', options: [['plr', 'Com licença PLR para revenda']] },
    { key: 'data', label: 'Data ou campanha', options: SCHOOL_CALENDAR_TAGS.map(tag => [tag, tag]) },
  ];
  const form = (mobile: boolean) => {
    const values = new URLSearchParams(mobile ? draft : params.toString());
    return <form key={mobile ? 'mobile' : params.toString()} onSubmit={event => {
      event.preventDefault();
      if (pending) return;
      const data = new FormData(event.currentTarget);
      const changes = Object.fromEntries(keys.map(key => [key, String(data.get(key) || '') || null]));
      startTransition(() => router.push(searchHref(params.toString(), changes), { scroll: false }));
      if (mobile) close();
    }} className="space-y-4">
      {groups.map(group => <label key={group.key} className="block text-sm font-semibold text-slate-700">
        {group.label}
        <select name={group.key} defaultValue={values.get(group.key) || ''} className="mt-2 block min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-2 text-base focus-visible:outline-2 focus-visible:outline-blue-600">
          <option value="">Todas as opções</option>
          {values.get(group.key) && !group.options.some(([value]) => value === values.get(group.key)) && <option value={values.get(group.key)!}>{values.get(group.key)}</option>}
          {group.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>)}
      <p className="text-xs leading-5 text-slate-600">Disciplina considera as habilidades BNCC cadastradas. Em PLR, Grátis/Pago filtra o produto final; a licença possui seu próprio valor.</p>
      <div className="grid gap-2 pb-2">
        <button disabled={pending} className="min-h-11 rounded-xl bg-blue-600 px-3 py-3 font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60">{pending ? 'Atualizando…' : 'Aplicar filtros'}</button>
        <button type="button" disabled={pending} onClick={() => {
          startTransition(() => router.push(searchHref(params.toString(), Object.fromEntries(keys.map(key => [key, null]))), { scroll: false }));
          if (mobile) close();
        }} className="min-h-11 rounded-xl border border-slate-300 px-3 py-3 font-semibold text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-600">Limpar filtros</button>
      </div>
    </form>;
  };

  return <aside className="w-full min-w-0 lg:w-64">
    <button ref={trigger} type="button" aria-disabled={pending} aria-expanded={open} aria-controls={id} onClick={() => {
      if (pending) return;
      setDraft(params.toString());
      dialog.current?.showModal();
      setOpen(true);
    }} className="flex min-h-12 w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600 lg:hidden">
      <span className="flex items-center gap-2"><SlidersHorizontal className="h-5 w-5" /> Filtros{count > 0 ? ' (' + count + ')' : ''}</span><span>{pending ? 'Atualizando…' : 'Abrir'}</span>
    </button>
    <p role="status" className="sr-only">{pending ? 'Atualizando resultados. Aguarde.' : ''}</p>
    <div className="hidden rounded-2xl border border-slate-200 bg-white p-5 lg:block"><h2 className="mb-4 text-lg font-bold">Filtrar materiais</h2>{form(false)}</div>
    <dialog ref={dialog} id={id} aria-labelledby={id + '-title'} onCancel={event => { event.preventDefault(); close(); }} onClose={() => {
      setOpen(false);
      trigger.current?.focus();
    }} onClick={event => { if (event.target === event.currentTarget) close(); }} className="fixed inset-0 m-auto max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-md overflow-y-auto overscroll-contain rounded-2xl bg-white p-0 shadow-xl backdrop:bg-slate-950/50">
      <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="mb-4 flex items-center justify-between gap-2"><h2 id={id + '-title'} className="text-xl font-bold">Filtrar materiais</h2><button type="button" autoFocus onClick={close} aria-label="Fechar filtros" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-blue-600"><X /></button></div>
        {open && form(true)}
      </div>
    </dialog>
  </aside>;
}
