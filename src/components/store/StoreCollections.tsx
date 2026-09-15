'use client';

import { Flame, Layers3, Rocket, Sparkles } from 'lucide-react';
import { StoreCollection } from '@/lib/types';

interface StoreCollectionsProps {
  active: StoreCollection;
  onChange: (collection: StoreCollection) => void;
  variant?: 'default' | 'minimalist' | 'netflix' | 'linktree' | 'pinterest';
}

const collections = [
  { id: 'all' as const, label: 'Produtos finais', icon: Layers3 },
  { id: 'popular' as const, label: 'Em alta', icon: Flame },
  { id: 'new' as const, label: 'Novidades', icon: Sparkles },
  { id: 'plr' as const, label: 'Licenças PLR', icon: Rocket },
];

export default function StoreCollections({ active, onChange, variant = 'default' }: StoreCollectionsProps) {
  const isDark = variant === 'netflix';

  return (
    <section className={isDark ? 'bg-slate-950/30 rounded-2xl p-1' : ''} aria-label="Coleções da loja">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
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
              className={`min-h-11 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 ${selected ? selectedStyle : idleStyle} ${variant === 'minimalist' ? 'rounded-lg shadow-none' : 'shadow-sm'}`}
              aria-pressed={selected}
            >
              <span className="flex items-center gap-2 whitespace-nowrap text-sm font-black"><Icon className="w-4 h-4" />{collection.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
