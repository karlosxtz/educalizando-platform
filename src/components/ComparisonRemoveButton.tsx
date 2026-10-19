'use client';
import { useRouter } from 'next/navigation';
import { removeComparison } from '@/lib/comparison-client';
import { comparisonKey,type ComparisonChoice } from '@/lib/material-comparison';
export default function ComparisonRemoveButton({item,choices}:{item:ComparisonChoice;choices:ComparisonChoice[]}){const router=useRouter();return <button type="button" onClick={()=>{removeComparison(item);const next=choices.filter(row=>comparisonKey(row)!==comparisonKey(item));router.replace(next.length?`/comparar?itens=${encodeURIComponent(next.map(comparisonKey).join(','))}`:'/comparar');}} className="min-h-11 text-xs font-bold text-slate-600 underline">Remover desta comparação</button>;}
