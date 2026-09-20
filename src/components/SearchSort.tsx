'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { searchHref } from '@/lib/search-navigation';

export default function SearchSort() {
  const router = useRouter();
  const params = useSearchParams();
  return (
    <label className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
      Ordenar por:
      <select
        value={params.get('sort') || 'recentes'}
        onChange={(event) => router.push(searchHref(params.toString(), { sort: event.target.value }))}
        className="min-h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 font-bold text-slate-900"
      >
        <option value="recentes">Mais recentes</option>
        <option value="menor-preco">Menor preço</option>
        <option value="maior-preco">Maior preço</option>
        <option value="popular">Mais acessados</option>
      </select>
    </label>
  );
}
