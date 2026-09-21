'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { searchHref } from '@/lib/search-navigation';
import { useTransition } from 'react';

export default function SearchSort() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  return (
    <label className="flex max-w-full flex-wrap items-center gap-2 text-sm text-slate-600">
      Ordenar por:
      <select
        value={params.get('sort') || 'recentes'}
        disabled={pending}
        onChange={(event) => startTransition(() => router.push(searchHref(params.toString(), { sort: event.target.value }), { scroll: false }))}
        className="min-h-11 max-w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-bold text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600"
      >
        <option value="recentes">Mais recentes</option>
        <option value="menor-preco">Menor preço</option>
        <option value="maior-preco">Maior preço</option>
        <option value="popular">Mais acessados</option>
      </select>
      <span role="status">{pending ? 'Atualizando…' : ''}</span>
    </label>
  );
}
