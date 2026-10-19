'use client';
import { Columns2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMaterialComparison,toggleComparison } from '@/lib/comparison-client';
export default function CompareProductButton({productId,mode='standard'}:{productId:string;mode?:'standard'|'plr'}) {
  const items=useMaterialComparison();const selected=items.some(item=>item.id===productId&&item.mode===mode);
  return <button type="button" aria-pressed={selected} onClick={()=>{if(!toggleComparison({id:productId,mode}))toast.info('Compare até 3 materiais. Remova um para escolher outro.');}} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold ${selected?'border-indigo-300 bg-indigo-50 text-indigo-900':'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}><Columns2 aria-hidden="true" className="h-4 w-4"/>{selected?'Na comparação':'Comparar material'}</button>;
}
