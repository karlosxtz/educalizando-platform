'use client';

export default function StoreCatalogMoreButton({ remaining, onMore }: { remaining: number; onMore: () => void }) {
  if (remaining <= 0) return null;
  return <div className="flex justify-center py-6"><button type="button" onClick={onMore} className="min-h-12 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50">
    Mostrar mais materiais ({remaining} restantes)
  </button></div>;
}
