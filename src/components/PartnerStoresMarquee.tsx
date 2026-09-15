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
  const marqueeStores = [...stores, ...stores];

  return (
    <div className="group relative overflow-hidden py-5" aria-label="Lojas parceiras">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-slate-50 to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-slate-50 to-transparent sm:w-24" />
      <div className="partner-stores-track flex w-max gap-7 group-hover:[animation-play-state:paused]">
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
      <style jsx>{`@keyframes partner-stores-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } } @keyframes partner-halo-shift { 0%, 100% { filter: saturate(1); background-position: 0% 50%; } 50% { filter: saturate(1.35) brightness(1.06); background-position: 100% 50%; } } .partner-stores-track { animation: partner-stores-scroll ${Math.max(stores.length * 4, 28)}s linear infinite; } .partner-store-halo { background-size: 220% 220%; animation: partner-halo-shift 4.5s ease-in-out infinite; } @media (prefers-reduced-motion: reduce) { .partner-stores-track, .partner-store-halo { animation: none; } }`}</style>
    </div>
  );
}
