'use client';

import Link from 'next/link';
import { Store } from '@/lib/types';

const halos = [
  'from-blue-500 via-cyan-400 to-violet-500', 'from-fuchsia-500 via-rose-400 to-amber-400',
  'from-emerald-500 via-lime-400 to-cyan-500', 'from-violet-500 via-pink-400 to-rose-500',
  'from-amber-400 via-orange-500 to-rose-500', 'from-sky-500 via-indigo-500 to-fuchsia-500',
];

export default function PartnerStoresMarquee({ stores }: { stores: Store[] }) {
  if (!stores.length) return <p className="py-8 text-center text-sm font-medium text-slate-500">Nenhuma loja ativa no momento.</p>;
  // Mantém uma esteira longa mesmo enquanto a plataforma ainda possui poucas lojas.
  const repetitions = Math.max(1, Math.ceil(12 / stores.length));
  const sequence = Array.from({ length: repetitions }, () => stores).flat();
  const marqueeStores = [...sequence, ...sequence];

  return (
    <div className="group relative overflow-hidden py-5" aria-label="Lojas parceiras">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-slate-50 to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-slate-50 to-transparent sm:w-24" />
      <div className="partner-stores-track flex w-max gap-7">
        {marqueeStores.map((store, index) => {
          const initial = store.nome_loja?.charAt(0).toUpperCase() || 'L';
          return (
            <Link href={`/loja/${store.slug}`} key={`${store.id}-${index}`} className="w-28 shrink-0 text-center sm:w-32" aria-label={`Visitar loja ${store.nome_loja}`}>
              <div className={`partner-store-halo mx-auto rounded-full bg-gradient-to-br ${halos[index % halos.length]} p-[3px] shadow-lg shadow-slate-300/50 transition-transform duration-300 hover:scale-110`}>
                <div className="overflow-hidden rounded-full">
                  {store.logo_url ? <img src={store.logo_url} alt={store.nome_loja} className="block h-20 w-20 rounded-full object-cover sm:h-24 sm:w-24" /> : <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-3xl font-black text-blue-600 sm:h-24 sm:w-24">{initial}</div>}
                </div>
              </div>
              <span className="mt-3 block truncate text-sm font-bold text-slate-700 transition-colors hover:text-blue-600">{store.nome_loja}</span>
            </Link>
          );
        })}
      </div>
      <style jsx global>{`@keyframes partner-stores-scroll { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(-50%, 0, 0); } } @keyframes partner-halo-shift { 0%, 100% { filter: saturate(1) brightness(1); background-position: 0% 50%; box-shadow: 0 0 0 0 rgba(59, 130, 246, .22), 0 10px 22px rgba(15, 23, 42, .14); } 50% { filter: saturate(1.55) brightness(1.12); background-position: 100% 50%; box-shadow: 0 0 0 10px rgba(192, 132, 252, 0), 0 14px 28px rgba(168, 85, 247, .3); } } .partner-stores-track { will-change: transform; animation: partner-stores-scroll 18s linear infinite !important; } .partner-store-halo { background-size: 260% 260%; animation: partner-halo-shift 1.9s ease-in-out infinite !important; } @media (prefers-reduced-motion: reduce) { .partner-stores-track, .partner-store-halo { animation: none !important; } }`}</style>
    </div>
  );
}
