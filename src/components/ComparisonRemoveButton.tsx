'use client';
import { useRouter } from 'next/navigation';
import { removeComparison } from '@/lib/comparison-client';
import { comparisonKey,type ComparisonChoice } from '@/lib/material-comparison';
import { X } from 'lucide-react';
export default function ComparisonRemoveButton({item,choices}:{item:ComparisonChoice;choices:ComparisonChoice[]}){const router=useRouter();return <button type="button" onClick={()=>{removeComparison(item);const next=choices.filter(row=>comparisonKey(row)!==comparisonKey(item));router.replace(next.length?`/comparar?itens=${encodeURIComponent(next.map(comparisonKey).join(','))}`:'/comparar');}} className="inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-[11px] font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-700"><X size={12}/>Remover da seleção</button>;}
