'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

const CATEGORIES = [
  { name: 'Alfabetização', href: '/buscar?categoria=alfabetizacao' },
  { name: 'Artes', href: '/buscar?categoria=artes' },
  { name: 'Ciência e Biologia', href: '/buscar?categoria=ciencia-biologia' },
  { name: 'Datas Comemorativas', href: '/buscar?categoria=datas-comemorativas' },
  { name: 'Educação Especial', href: '/buscar?categoria=educacao-especial' },
  { name: 'Educação Infantil', href: '/buscar?categoria=educacao-infantil' },
  { name: 'Ensino Fundamental', href: '/buscar?categoria=ensino-fundamental' },
  { name: 'Matemática', href: '/buscar?categoria=matematica' }
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
        className="flex items-center gap-1 whitespace-nowrap text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors py-2 cursor-pointer focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        Todas as categorias
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : 'text-slate-400'}`} />
      </button>

      {/* Dropdown Menu */}
      <div 
        className={`absolute top-full left-0 mt-2 w-64 bg-white shadow-2xl rounded-xl z-[9999] border border-slate-200 p-2 flex flex-col max-h-[70vh] overflow-y-auto custom-scrollbar transition-all duration-200 origin-top-left ${
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
