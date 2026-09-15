'use client';

import { Flame, Layers3, Rocket, Sparkles } from 'lucide-react';
import { StoreCollection } from '@/lib/types';

interface StoreCollectionsProps {
  active: StoreCollection;
  onChange: (collection: StoreCollection) => void;
  variant?: 'default' | 'minimalist' | 'netflix' | 'linktree' | 'pinterest';
}

const collections = [
  { id: 'all' as const, label: 'Todos os materiais', description: 'Explore a coleção completa', icon: Layers3 },
  { id: 'popular' as const, label: 'Em alta', description: 'Os mais procurados', icon: Flame },
  { id: 'new' as const, label: 'Novidades', description: 'Acabaram de chegar', icon: Sparkles },
  { id: 'plr' as const, label: 'Licenças PLR', description: 'Prontos para revender', icon: Rocket },
];

export default function StoreCollections({ active, onChange, variant = 'default' }: StoreCollectionsProps) {
  const isDark = variant === 'netflix';

  return (
    <section className={`overflow-x-auto hide-scrollbar ${isDark ? 'bg-slate-950' : ''}`} aria-label="Coleções da loja">
      <div className="flex min-w-max gap-3 pb-1">
        {collections.map((collection) => {
          const Icon = collection.icon;
          const selected = active === collection.id;
          const selectedStyle = variant === 'pinterest'
            ? 'bg-gradient-to-br from-rose-500 to-fuchsia-600 text-white border-transparent shadow-rose-200/70'
            : variant === 'netflix'
              ? 'bg-red-600 text-white border-red-500 shadow-red-950/50'
              : variant === 'linktree'
                ? 'bg-violet-600 text-white border-violet-500 shadow-violet-200/80'
                : 'bg-slate-900 text-white border-slate-900 shadow-slate-200/80';
          const idleStyle = isDark
            ? 'bg-slate-900 text-slate-200 border-slate-800 hover:border-slate-600'
            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:shadow-sm';

          return (
            <button
              key={collection.id}
              type="button"
              onClick={() => onChange(collection.id)}
              className={`min-w-48 rounded-2xl border p-3.5 text-left transition-all duration-200 ${selected ? selectedStyle : idleStyle} ${variant === 'minimalist' ? 'rounded-lg shadow-none' : 'shadow-sm'}`}
              aria-pressed={selected}
            >
              <span className="flex items-center gap-2 text-sm font-black"><Icon className="w-4 h-4" />{collection.label}</span>
              <span className={`mt-1 block text-[11px] font-medium ${selected ? 'text-white/80' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>{collection.description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
