'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';
import { quickSearch } from '@/lib/search-service';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const debouncedQuery = useDebounce(query, 400);
  const router = useRouter();

  useEffect(() => {
    async function fetchSuggestions() {
      if (debouncedQuery.trim().length >= 2) {
        setIsSearching(true);
        const results = await quickSearch(debouncedQuery);
        setSuggestions(results);
        setIsSearching(false);
      } else {
        setSuggestions([]);
      }
    }
    
    fetchSuggestions();
  }, [debouncedQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSuggestions([]); // close dropdown
      const encodedQuery = encodeURIComponent(query.trim());
      router.push(`/buscar?q=${encodedQuery}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative group w-full">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        {isSearching ? (
           <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
        ) : (
           <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        )}
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

      {/* Auto-complete Dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden">
          <ul className="max-h-80 overflow-y-auto">
            {suggestions.map((item) => (
              <li key={item.id} className="border-b border-slate-100 last:border-0">
                <Link 
                  href={`/produto/${item.slug}`} 
                  onClick={() => setSuggestions([])}
                  className="block px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-sm font-medium text-slate-800 line-clamp-1">{item.titulo}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
