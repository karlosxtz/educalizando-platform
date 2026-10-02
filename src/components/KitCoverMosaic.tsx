import type { Product } from '@/lib/types';
import { Boxes } from 'lucide-react';

export default function KitCoverMosaic({ products, className = '' }: { products: Product[]; className?: string }) {
  const covers = products.filter(product => Boolean(product.capa_url)).slice(0, 4);
  if (!covers.length) return <div className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-violet-950 to-slate-900 text-center text-white ${className}`}><Boxes className="h-9 w-9 text-lime-300" /><span className="text-xs font-black">Combo de materiais didáticos</span></div>;
  return <div className={`grid h-full w-full grid-cols-2 overflow-hidden bg-violet-950 ${className}`}>{covers.map((product, index) => <div key={product.id} className={`relative overflow-hidden border-violet-950/70 ${covers.length === 1 ? 'col-span-2 row-span-2' : 'border'}`}><img src={product.capa_url || ''} alt={`Capa de ${product.titulo}`} className="h-full w-full object-cover" />{index === 3 && products.length > 4 && <span className="absolute inset-0 flex items-center justify-center bg-violet-950/65 text-xl font-black text-white">+{products.length - 4}</span>}</div>)}</div>;
}
