import Link from 'next/link';
import { Boxes, FileText, Package } from 'lucide-react';
import type { MarketplaceKit } from '@/lib/marketplace-kit-service';
import KitCoverMosaic from '@/components/KitCoverMosaic';

export default function MarketplaceKitCard({ kit }: { kit: MarketplaceKit }) {
  const products = kit.products || [];
  const total = products.reduce((sum, product) => sum + Number(product.preco || 0), 0);
  const saving = Math.max(0, total - Number(kit.preco_kit || 0));
  const href = `/kit/${kit.id}`;
  return <Link href={href} className="group overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700">
    <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-violet-900 to-indigo-950">
      {kit.capa_url ? <img src={kit.capa_url} alt={kit.titulo} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <KitCoverMosaic products={products} />}
      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-violet-950/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white"><Boxes className="h-3.5 w-3.5 text-lime-300" /> Combo</span>
      <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-violet-800"><Package className="h-3.5 w-3.5" /> {products.length} materiais</span>
    </div>
    <div className="space-y-3 p-4"><div><h3 className="line-clamp-2 text-base font-black leading-tight text-slate-950 group-hover:text-violet-700">{kit.titulo}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{kit.descricao || 'Pacote de materiais didáticos selecionados para o seu planejamento.'}</p></div><div className="rounded-xl bg-slate-50 p-2.5"><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Você recebe</p><p className="mt-1 line-clamp-1 text-xs font-bold text-slate-700"><FileText className="mr-1 inline h-3.5 w-3.5 text-violet-600" />Arquivos finais de {products.slice(0, 2).map(product => product.titulo).join(' e ')}{products.length > 2 ? ' e mais' : ''}</p></div><div className="flex items-end justify-between border-t border-slate-100 pt-3"><div><span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Preço do combo</span><strong className="text-lg font-black text-slate-950">R$ {Number(kit.preco_kit || 0).toFixed(2).replace('.', ',')}</strong></div>{saving > 0 && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">Economize R$ {saving.toFixed(2).replace('.', ',')}</span>}</div></div>
  </Link>;
}
