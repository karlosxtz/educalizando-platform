'use client';

import { StoreCollection } from '@/lib/types';
import { Flame,Layers3,Rocket,Sparkles } from 'lucide-react';

interface StoreCollectionsProps {
  active: StoreCollection;
  onChange: (collection: StoreCollection) => void;
  variant?: 'default' | 'minimalist' | 'netflix' | 'linktree' | 'pinterest';
}

const collections = [
  { id: 'all' as const, label: 'Produtos finais', description: 'Materiais prontos para usar', icon: Layers3, accent: 'blue' },
  { id: 'popular' as const, label: 'Mais procurados', description: 'Os favoritos da loja', icon: Flame, accent: 'orange' },
  { id: 'new' as const, label: 'Novidades', description: 'Publicados recentemente', icon: Sparkles, accent: 'violet' },
  { id: 'plr' as const, label: 'Licenças PLR', description: 'Materiais para revenda', icon: Rocket, accent: 'fuchsia' },
];

export default function StoreCollections({ active, onChange, variant = 'default' }: StoreCollectionsProps) {
  const isDark = variant === 'netflix';

  return (
    <section className={isDark ? 'bg-slate-950/30 rounded-2xl p-1' : ''} aria-label="Coleções da loja">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
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
            : collection.accent === 'orange'
              ? 'bg-orange-50/70 text-slate-800 border-orange-100 hover:border-orange-300 hover:bg-orange-50'
              : collection.accent === 'violet'
                ? 'bg-violet-50/60 text-slate-800 border-violet-100 hover:border-violet-300 hover:bg-violet-50'
                : collection.accent === 'fuchsia'
                  ? 'bg-fuchsia-50/60 text-slate-800 border-fuchsia-100 hover:border-fuchsia-300 hover:bg-fuchsia-50'
                  : 'bg-blue-50/60 text-slate-800 border-blue-100 hover:border-blue-300 hover:bg-blue-50';

          return (
            <button
              key={collection.id}
              type="button"
              onClick={() => onChange(collection.id)}
              className={`min-h-[68px] rounded-2xl border px-3.5 py-3 text-left transition-all duration-200 ${selected ? selectedStyle : idleStyle} ${variant === 'minimalist' ? 'rounded-lg shadow-none' : 'shadow-sm'}`}
              aria-pressed={selected}
            >
              <span className="flex items-center gap-2 text-sm font-black"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${selected ? 'bg-white/20' : 'bg-white/80 shadow-sm'}`}><Icon className="w-4 h-4" /></span><span><span className="block leading-tight">{collection.label}</span><span className={`mt-0.5 block text-[10px] font-semibold ${selected ? 'text-white/75' : 'text-slate-500'}`}>{collection.description}</span></span></span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
