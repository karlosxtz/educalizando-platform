'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { INITIAL_GLOBAL_CATEGORIES } from '@/lib/category-service';
import { useCallback } from 'react';

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

export default function SearchSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
    <aside className="w-full lg:w-64 shrink-0 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm h-fit">
      
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
        <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Ano Escolar</h3>
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
      
    </aside>
  );
}
