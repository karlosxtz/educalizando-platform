'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { INITIAL_GLOBAL_CATEGORIES } from '@/lib/category-service';
import { useCallback, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import type { Discipline } from '@/lib/discipline-service';

const PRECOS = [
  { id: 'gratis', label: 'Grátis' },
  { id: 'pago', label: 'Pago' }
];

const ANOS_ESCOLARES = [
  { id: 'educacao-infantil', label: 'Educação Infantil' },
  { id: 'ensino-fundamental-1', label: 'Ensino Fundamental I' },
  { id: 'ensino-fundamental-2', label: 'Ensino Fundamental II' },
  { id: 'ensino-medio', label: 'Ensino Médio' }
];

const FORMATOS = [
  { id: 'pdf', label: 'PDF' },
  { id: 'word', label: 'Word' },
  { id: 'ppt', label: 'Apresentação (PPT)' },
  { id: 'planilha', label: 'Planilha' }
];

export default function SearchSidebar({ disciplines = [] }: { disciplines?: Discipline[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      
      // If toggling same value, remove it (checkbox behavior)
      if (params.get(name) === value) {
        params.delete(name);
      } else {
        params.set(name, value);
      }
      
      // Reset page when filter changes
      params.delete('page');
      
      return params.toString();
    },
    [searchParams]
  );

  const handleFilterClick = (name: string, value: string) => {
    router.push(`/buscar?${createQueryString(name, value)}`);
  };

  const currentCategoria = searchParams.get('categoria');
  const currentPreco = searchParams.get('preco');
  const currentAnoEscolar = searchParams.get('ano_escolar');
  const currentFormato = searchParams.get('formato');

  return (
    <aside className="w-full lg:w-64 shrink-0 bg-white border border-slate-200 rounded-2xl shadow-sm h-fit">
      <button
        type="button"
        onClick={() => setMobileFiltersOpen((open) => !open)}
        className="lg:hidden flex min-h-12 w-full items-center justify-between px-4 text-sm font-black text-slate-900"
        aria-expanded={mobileFiltersOpen}
      >
        <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-blue-600" /> Filtros do catálogo</span>
        {mobileFiltersOpen ? <X className="h-4 w-4 text-slate-500" /> : <span className="text-xs text-blue-600">Abrir</span>}
      </button>
      <div className={`${mobileFiltersOpen ? 'block' : 'hidden'} lg:block p-5 lg:p-6`}>
      
      {/* Categorias */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Categorias</h3>
        <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
          {INITIAL_GLOBAL_CATEGORIES.map(cat => (
            <label key={cat.slug} className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={currentCategoria === cat.slug}
                onChange={() => handleFilterClick('categoria', cat.slug)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
              />
              <span className={`text-sm transition-colors ${currentCategoria === cat.slug ? 'text-blue-700 font-bold' : 'text-slate-600 group-hover:text-slate-900'}`}>
                {cat.nome}
              </span>
            </label>
          ))}
        </div>
      </div>

      <hr className="border-slate-100 my-6" />

      {/* Preço */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Preço</h3>
        <div className="space-y-2">
          {PRECOS.map(p => (
            <label key={p.id} className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={currentPreco === p.id}
                onChange={() => handleFilterClick('preco', p.id)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
              />
              <span className={`text-sm transition-colors ${currentPreco === p.id ? 'text-blue-700 font-bold' : 'text-slate-600 group-hover:text-slate-900'}`}>
                {p.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <hr className="border-slate-100 my-6" />

      {/* Ano Escolar */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Etapa escolar</h3>
        <div className="space-y-2">
          {ANOS_ESCOLARES.map(ano => (
            <label key={ano.id} className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={currentAnoEscolar === ano.id}
                onChange={() => handleFilterClick('ano_escolar', ano.id)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
              />
              <span className={`text-sm transition-colors ${currentAnoEscolar === ano.id ? 'text-blue-700 font-bold' : 'text-slate-600 group-hover:text-slate-900'}`}>
                {ano.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <hr className="border-slate-100 my-6" />

      {/* Formato */}
      <div className="mb-8">
        <label htmlFor="search-discipline" className="block text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Disciplina</label>
        <select id="search-discipline" value={searchParams.get('disciplina') || ''}
          onChange={(event) => {
            const params = new URLSearchParams(searchParams.toString());
            if (event.target.value) params.set('disciplina', event.target.value);
            else params.delete('disciplina');
            params.delete('page');
            router.push(`/buscar?${params.toString()}`);
          }}
          className="w-full min-h-11 rounded-xl border border-slate-200 bg-white px-2 text-sm">
          <option value="">Todas as disciplinas</option>
          {disciplines.map((discipline) => <option key={discipline.slug} value={discipline.name}>{discipline.name}</option>)}
        </select>
        <p className="mt-2 text-xs text-slate-500">Conforme as habilidades BNCC cadastradas pelo autor.</p>
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Formato</h3>
        <div className="space-y-2">
          {FORMATOS.map(formato => (
            <label key={formato.id} className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={currentFormato === formato.id}
                onChange={() => handleFilterClick('formato', formato.id)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
              />
              <span className={`text-sm transition-colors ${currentFormato === formato.id ? 'text-blue-700 font-bold' : 'text-slate-600 group-hover:text-slate-900'}`}>
                {formato.label}
              </span>
            </label>
          ))}
        </div>
      </div>
      
      </div>
    </aside>
  );
}
