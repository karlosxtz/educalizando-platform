'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Library, Search, Sparkles, Filter, 
  ExternalLink, ShoppingCart, Loader2, ShieldCheck, FileText, CheckCircle2, Eye
} from 'lucide-react';
import { getPlrMarketplaceProducts } from '@/lib/store-service';
import { Product, Store } from '@/lib/types';

type PlrProduct = Product & { store?: Store };

export default function PlrMarketplacePage() {
  const [products, setProducts] = useState<PlrProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [purchasedProductIds, setPurchasedProductIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadData() {
      try {
        const [plrData, purchasesResponse] = await Promise.all([
          getPlrMarketplaceProducts(),
          fetch('/api/plr/purchases')
        ]);
        setProducts(plrData || []);
        if (purchasesResponse.ok) {
          const purchasesData = await purchasesResponse.json();
          setPurchasedProductIds(new Set((purchasesData.items || []).map((item: { productId: string }) => item.productId)));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredProducts = products.filter(p => 
    p.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.store?.nome_loja || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Library className="w-7 h-7 text-blue-600" />
            Mercado de PLR
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Descubra produtos com direitos de revenda criados por outros professores e adicione-os à sua loja.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por título ou loja..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>
        <button className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
          <Filter className="w-4 h-4" />
          Filtros
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
          <p className="text-sm font-medium">Buscando oportunidades de PLR...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhum PLR encontrado</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            {searchQuery ? "Tente buscar com outras palavras-chave." : "Ainda não há produtos com licença PLR ativada na plataforma. Seja o primeiro a criar um!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const productUrl = product.store ? `/loja/${encodeURIComponent(product.store.slug)}/produto/${encodeURIComponent(product.slug || product.id)}?licenca=plr` : '#';
            const alreadyPurchased = purchasedProductIds.has(product.id);
            const displayPrice = Number(product.preco_plr || 0);

            return (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                {/* Cover Image */}
                <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden group">
                  {product.capa_url ? (
                    <img src={product.capa_url} alt={product.titulo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50">
                      <Library className="w-10 h-10 text-slate-300" />
                    </div>
                  )}
                  {/* Overlay Price */}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
                    <span className="text-sm font-black text-slate-900">
                      R$ {displayPrice.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  {alreadyPurchased && (
                    <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-[10px] font-black uppercase text-white shadow-lg">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Produto adquirido
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex-1">
                    <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-violet-700">
                      <ShieldCheck className="h-3.5 w-3.5" /> Licença de revenda PLR
                    </div>
                    <h3 className="font-bold text-slate-900 text-base line-clamp-2 mb-2 leading-tight">
                      {product.titulo}
                    </h3>
                    {product.descricao && (
                      <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-slate-500">
                        {product.descricao}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mb-4">
                      {product.store?.logo_url ? (
                        <img src={product.store.logo_url} alt="Logo" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-[10px] font-bold text-blue-700">
                            {(product.store?.nome_loja || 'L')[0]}
                          </span>
                        </div>
                      )}
                      <span className="text-xs font-medium text-slate-500 truncate">
                        {product.store?.nome_loja || 'Loja Desconhecida'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-[11px] font-bold text-slate-600">
                      <span className="flex min-w-0 items-center gap-1.5"><FileText className="h-3.5 w-3.5 shrink-0 text-blue-600" /> {String(product.tipo || 'digital').toUpperCase()}</span>
                      <span className="text-right text-emerald-700">Entrega PLR inclusa</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                      href={productUrl}
                      className="min-h-11 rounded-xl border border-blue-200 bg-white px-3 text-xs font-black text-blue-700 hover:bg-blue-50 flex items-center justify-center gap-1.5"
                    >
                      <Eye className="h-4 w-4" /> Ver detalhes
                    </Link>
                    {alreadyPurchased ? (
                      <Link
                        href={`/dashboard/plr/comprados?produto=${encodeURIComponent(product.id)}`}
                        className="min-h-11 rounded-xl bg-emerald-600 px-3 text-xs font-black text-white hover:bg-emerald-700 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Adquirido
                      </Link>
                    ) : (
                      <Link
                        href={productUrl}
                        className="min-h-11 rounded-xl bg-blue-600 px-3 text-xs font-black text-white hover:bg-blue-700 flex items-center justify-center gap-1.5 shadow-sm shadow-blue-200"
                      >
                        <ShoppingCart className="h-4 w-4" /> Comprar PLR
                        <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  );
}
