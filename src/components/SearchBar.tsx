'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const encodedQuery = encodeURIComponent(query.trim());
      router.push(`/buscar?q=${encodedQuery}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative group w-full">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="block w-full pl-11 pr-6 py-3 sm:py-3.5 bg-slate-100/50 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-full leading-5 text-slate-900 placeholder-slate-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium shadow-inner"
        placeholder="O que você procura hoje? (Atividades, apostilas, jogos...)"
      />
      <button 
        type="submit"
        className="absolute inset-y-1.5 right-1.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-full transition-colors hidden sm:block shadow-sm"
      >
        Buscar
      </button>
    </form>
  );
}
