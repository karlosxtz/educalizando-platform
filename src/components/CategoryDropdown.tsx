'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

const CATEGORIES = [
  { name: 'Alfabetização', href: '/buscar?categoria=alfabetizacao' },
  { name: 'Artes', href: '/buscar?categoria=artes' },
  { name: 'Berçário', href: '/buscar?categoria=bercario' },
  { name: 'Ciência e Biologia', href: '/buscar?categoria=ciencia-e-biologia' },
  { name: 'Combo', href: '/buscar?categoria=combo' },
  { name: 'Datas Comemorativas', href: '/buscar?categoria=datas-comemorativas' },
  { name: 'Educação Especial', href: '/buscar?categoria=educacao-especial' },
  { name: 'Educação Financeira', href: '/buscar?categoria=educacao-financeira' },
  { name: 'Educação Infantil', href: '/buscar?categoria=educacao-infantil' },
  { name: 'Ensino Fundamental', href: '/buscar?categoria=ensino-fundamental' },
  { name: 'Ensino Religioso', href: '/buscar?categoria=ensino-religioso' },
  { name: 'Geografia', href: '/buscar?categoria=geografia' },
  { name: 'História', href: '/buscar?categoria=historia' },
  { name: 'Inglês', href: '/buscar?categoria=ingles' },
  { name: 'Jogos', href: '/buscar?categoria=jogos' },
  { name: 'Libras', href: '/buscar?categoria=libras' },
  { name: 'Matemática', href: '/buscar?categoria=matematica' },
  { name: 'Música', href: '/buscar?categoria=musica' },
  { name: 'Planners e Organização', href: '/buscar?categoria=planners-e-organizacao' },
  { name: 'Outros', href: '/buscar?categoria=outros' }
];

export default function CategoryDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const outside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [isOpen]);

  return (
    <div 
      ref={rootRef}
      className="flex items-center h-full xl:relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isOpen) {
          event.stopPropagation();
          setIsOpen(false);
          buttonRef.current?.focus();
        }
      }}
    >
      <button 
        type="button"
        ref={buttonRef}
        aria-label="Todas as categorias"
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex min-h-11 items-center gap-1 py-2 text-center text-sm font-bold text-slate-600 transition-colors hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="xl:hidden">Categorias</span>
        <span className="hidden xl:inline">Todas as categorias</span>
        <ChevronDown aria-hidden="true" className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : 'text-slate-400'}`} />
      </button>

      {/* Dropdown Menu */}
      <div
        id={panelId}
        hidden={!isOpen}
        className="absolute top-full inset-x-0 mt-1 bg-white shadow-2xl rounded-xl z-[60] border border-slate-200 p-2 max-h-[min(60dvh,24rem)] overflow-y-auto overscroll-contain xl:right-auto xl:w-64"
      >
        <div className="grid grid-cols-1 gap-1">
          {CATEGORIES.map((cat, idx) => (
            <Link
              key={idx}
              href={cat.href}
              className="min-h-11 px-4 py-2.5 text-sm font-medium text-slate-700 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors w-full text-left flex items-center focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-[-2px]"
              onClick={() => { setIsOpen(false); buttonRef.current?.focus(); }}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
