'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

const CATEGORIES = [
  { name: 'Educação Infantil', href: '/buscar?categoria=educacao-infantil' },
  { name: 'Ensino Fundamental I', href: '/buscar?categoria=ensino-fundamental-1' },
  { name: 'Ensino Fundamental II', href: '/buscar?categoria=ensino-fundamental-2' },
  { name: 'Ensino Médio', href: '/buscar?categoria=ensino-medio' },
  { name: 'Matemática', href: '/buscar?categoria=matematica' },
  { name: 'Português & Literatura', href: '/buscar?categoria=portugues-literatura' },
  { name: 'Ciências & Biologia', href: '/buscar?categoria=ciencias-biologia' },
  { name: 'História & Geografia', href: '/buscar?categoria=historia-geografia' },
  { name: 'Artes', href: '/buscar?categoria=artes' },
  { name: 'Inclusão & Ed. Especial', href: '/buscar?categoria=inclusao' },
  { name: 'Datas Comemorativas', href: '/buscar?categoria=datas-comemorativas' },
  { name: 'Jogos Lúdicos', href: '/buscar?categoria=jogos' }
];

export default function CategoryDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="relative flex items-center h-full"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Link 
        href="/buscar" 
        className="flex items-center gap-1 whitespace-nowrap text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors py-2"
        onClick={() => setIsOpen(false)}
      >
        Todas as categorias
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : 'text-slate-400'}`} />
      </Link>

      {/* Dropdown Menu */}
      <div 
        className={`absolute top-full left-0 mt-0 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_10px_40px_rgb(0,0,0,0.08)] border border-slate-100 p-2 z-[60] flex flex-col max-h-[70vh] overflow-y-auto custom-scrollbar transition-all duration-200 origin-top-left ${
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
