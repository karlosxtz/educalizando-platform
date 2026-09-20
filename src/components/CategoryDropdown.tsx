'use client';

import { useState } from 'react';
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

  return (
    <div 
      className="relative flex items-center h-full"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button 
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="marketplace-category-menu"
        className="flex max-w-full items-center gap-1 overflow-hidden py-2 text-center text-xs font-bold text-slate-600 transition-colors hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:text-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">Todas as categorias</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : 'text-slate-400'}`} />
      </button>

      {/* Dropdown Menu */}
      <div 
        id="marketplace-category-menu"
        role="menu"
        className={`absolute top-full left-1/2 mt-2 w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2 bg-white shadow-2xl rounded-xl z-[9999] border border-slate-200 p-2 flex flex-col max-h-[60vh] overflow-y-auto custom-scrollbar transition-all duration-200 origin-top-center sm:left-0 sm:w-64 sm:translate-x-0 sm:origin-top-left ${
          isOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
        }`}
      >
        <div className="grid grid-cols-1 gap-1">
          {CATEGORIES.map((cat, idx) => (
            <Link
              key={idx}
              href={cat.href}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors w-full text-left flex items-center"
              onClick={() => setIsOpen(false)}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
