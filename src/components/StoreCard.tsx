
import CatalogImage from '@/components/ui/CatalogImage';
import { Store } from '@/lib/types';
import { normalizePublicAssetUrl } from '@/lib/public-links';
import { ChevronRight } from 'lucide-react';
import Link from '@/components/OnDemandLink';

export default function StoreCard({ store }: { store: Store }) {
  return (
    <Link href={`/loja/${store.slug}`} className="group bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_10px_40px_rgb(0,0,0,0.06)] transition-all duration-300 flex flex-col p-6 hover:-translate-y-1 w-full">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shadow-sm shrink-0">
          {store.logo_url ? (
            <CatalogImage src={normalizePublicAssetUrl(store.logo_url) || store.logo_url} alt={store.nome_loja} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-black text-slate-400">{store.nome_loja.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 text-lg truncate group-hover:text-blue-600 transition-colors">
            {store.nome_loja}
          </h3>
          <p className="mt-1 text-xs text-slate-500">Loja na Educalizando</p>
        </div>
      </div>
      {store.descricao ? (
        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed flex-1 mb-6">
          {store.descricao}
        </p>
      ) : (
        <p className="text-sm text-slate-400 italic flex-1 mb-6">
          Materiais didáticos de excelência.
        </p>
      )}
      <div className="mt-auto">
        <span className="inline-flex w-full justify-center items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors">
          Visitar Loja <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}
