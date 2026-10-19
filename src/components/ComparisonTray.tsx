'use client';
import Link from 'next/link';
import { useMaterialComparison,clearComparison } from '@/lib/comparison-client';
import { comparisonKey } from '@/lib/material-comparison';
export default function ComparisonTray(){const items=useMaterialComparison();if(!items.length)return null;return <aside aria-label="Materiais para comparar" className="fixed bottom-20 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-wrap items-center justify-between gap-2 rounded-2xl border border-indigo-200 bg-white p-3 text-sm shadow-xl sm:bottom-4"><span className="font-bold text-indigo-950">{items.length}/3 materiais</span><Link href={`/comparar?itens=${encodeURIComponent(items.map(comparisonKey).join(','))}`} className="inline-flex min-h-11 items-center rounded-xl bg-indigo-800 px-4 font-bold text-white">Comparar</Link><button type="button" onClick={clearComparison} className="min-h-11 px-2 text-xs font-bold text-slate-600 underline">Limpar</button></aside>;}
