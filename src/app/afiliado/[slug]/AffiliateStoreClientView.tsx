'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, ExternalLink, Sparkles
} from 'lucide-react';
import { AffiliateProfile } from '@/lib/types';

interface AffiliateStoreClientViewProps {
  profile: AffiliateProfile;
  products: any[];
}

export default function AffiliateStoreClientView({ profile, products }: AffiliateStoreClientViewProps) {
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('recent');

  const availableStores = Array.from(
    new Map(products.filter(p => p.store).map(p => [p.store.id, p.store])).values()
  ) as {id: string, nome_loja: string}[];

  const availableCategories = Array.from(
    new Map(products.filter(p => p.category).map(p => [p.category.id, p.category])).values()
  ) as {id: string, nome: string}[];

  let filteredProducts = products.filter(p => {
    const matchSearch = p.titulo.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (p.descricao && p.descricao.toLowerCase().includes(searchFilter.toLowerCase()));
    const matchCategory = !selectedCategory || p.category?.id === selectedCategory;
    const matchMinPrice = !minPrice || p.preco >= parseFloat(minPrice);
    const matchMaxPrice = !maxPrice || p.preco <= parseFloat(maxPrice);
    const matchStore = !selectedStore || p.store?.id === selectedStore;
    return matchSearch && matchCategory && matchMinPrice && matchMaxPrice && matchStore;
  });

  filteredProducts = filteredProducts.sort((a, b) => {
    if (sortBy === 'price_asc') return (a.preco || 0) - (b.preco || 0);
    if (sortBy === 'price_desc') return (b.preco || 0) - (a.preco || 0);
    // default 'recent'
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  const getTipoIcon = (tipo: string) => {
    return <Sparkles className="w-3.5 h-3.5" />; // Simplification
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Banner & Profile */}
      <div 
        className="w-full pt-12 pb-24 relative overflow-hidden bg-cover bg-center"
        style={{ 
          backgroundColor: profile.cor_primaria || '#1e293b',
          backgroundImage: profile.banner_url ? `url(${profile.banner_url})` : undefined
        }}
      >
        {!profile.banner_url && (
          <div className="absolute inset-0 bg-[url('/branding/mesh-bg.png')] opacity-10 bg-cover bg-center"></div>
        )}
        {profile.banner_url && (
          <div className="absolute inset-0 bg-black/40"></div>
        )}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 relative z-10 text-center space-y-4 mt-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {profile.logo_url ? (
            <img 
              src={profile.logo_url} 
              alt={profile.nome || 'Vitrine'} 
              className="w-24 h-24 rounded-full mx-auto border-4 border-white shadow-2xl bg-white object-cover" 
            />
          ) : (
            <div className="w-24 h-24 rounded-full mx-auto border-4 border-white shadow-2xl bg-gradient-to-tr from-white/20 to-white/5 flex items-center justify-center text-3xl font-black text-white">
              {(profile.nome || 'A').substring(0, 2).toUpperCase()}
            </div>
          )}
          
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Vitrine de {profile.nome || 'Afiliado'}
          </h1>
          {profile.descricao && (
            <p className="text-white/90 max-w-2xl mx-auto text-sm sm:text-base font-medium">
              {profile.descricao}
            </p>
          )}
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20 mt-4 backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-white" />
            <span className="text-xs font-bold text-white tracking-wide">
              Afiliado Autorizado Educalizando
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 -mt-12 relative z-20">
        {/* Filters */}
        <div className="sticky top-4 z-40 backdrop-blur-xl bg-white/80 border border-slate-200/60 p-3 rounded-2xl shadow-sm flex flex-wrap items-center gap-3 mb-8 max-w-5xl mx-auto">
          <input
            type="text"
            placeholder="Buscar recomendações..."
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            className="flex-1 bg-slate-50 px-3 py-2 rounded-lg text-sm font-medium focus:outline-none border border-transparent focus:border-brand-navy focus:bg-white transition-all w-full md:w-auto min-w-[200px]"
          />
          
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="flex-1 md:flex-none bg-slate-50 px-3 py-2 rounded-lg text-sm font-medium focus:outline-none border border-transparent focus:border-brand-navy focus:bg-white transition-all w-full md:w-auto min-w-[160px] text-slate-700"
          >
            <option value="">Todas as categorias</option>
            {availableCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nome}</option>
            ))}
          </select>

          {availableStores.length > 1 && (
            <select
              value={selectedStore}
              onChange={e => setSelectedStore(e.target.value)}
              className="flex-1 md:flex-none bg-slate-50 px-3 py-2 rounded-lg text-sm font-medium focus:outline-none border border-transparent focus:border-brand-navy focus:bg-white transition-all w-full md:w-auto min-w-[160px] text-slate-700"
            >
              <option value="">Todas as lojas</option>
              {availableStores.map(store => (
                <option key={store.id} value={store.id}>{store.nome_loja}</option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-2 w-full md:w-auto flex-1 md:flex-none">
            <input
              type="number"
              placeholder="Mín (R$)"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              className="w-full min-w-[100px] flex-1 bg-slate-50 px-3 py-2 rounded-lg text-sm font-medium focus:outline-none border border-transparent focus:border-brand-navy focus:bg-white transition-all"
            />
            <span className="text-slate-400 font-medium">-</span>
            <input
              type="number"
              placeholder="Máx (R$)"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              className="w-full min-w-[100px] flex-1 bg-slate-50 px-3 py-2 rounded-lg text-sm font-medium focus:outline-none border border-transparent focus:border-brand-navy focus:bg-white transition-all"
            />
          </div>
            
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="flex-1 md:flex-none bg-slate-50 px-3 py-2 rounded-lg text-sm font-medium focus:outline-none border border-transparent focus:border-brand-navy focus:bg-white transition-all w-full md:w-auto min-w-[140px] text-slate-700"
          >
            <option value="recent">Mais recente</option>
            <option value="price_asc">Mais barato</option>
            <option value="price_desc">Mais caro</option>
          </select>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100">
            <h3 className="text-xl font-black text-slate-800 mb-2">Nenhum material encontrado</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              {products.length > 0 
                ? 'Nenhum material corresponde aos filtros selecionados.' 
                : 'Ainda não há materiais aprovados para a vitrine deste afiliado.'}
            </p>
            {products.length > 0 && (
              <button
                onClick={() => {
                  setSearchFilter('');
                  setSelectedCategory('');
                  setMinPrice('');
                  setMaxPrice('');
                  setSelectedStore('');
                  setSortBy('recent');
                }}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((prod, index) => {
              // Extract the affiliate ID for this specific affiliation link
              const refId = prod.affiliateInfo?.id || '';
              
              return (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
                >
                  <a 
                    href={`/loja/${prod.store?.slug || 'loja'}/produto/${prod.id}?ref=${refId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-slate-100 relative shadow-inner">
                        {prod.capa_url ? (
                          <img 
                            src={prod.capa_url} 
                            alt={prod.titulo} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-semibold p-4 text-center">
                            Material Didático Digital
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-0 pointer-events-none" />
                        <span 
                          className="absolute top-2.5 left-2.5 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1.5 uppercase shadow-md backdrop-blur-xs bg-brand-navy z-10"
                        >
                          {getTipoIcon(prod.tipo)}
                          <span>{prod.tipo}</span>
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                          {prod.titulo}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-1 font-medium">
                          Criado por: <strong>{prod.store?.nome_loja || 'Autor'}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-col gap-3 mt-auto">
                      <div className="text-center">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-0.5">Investimento</span>
                        <div className="text-slate-900 flex items-end justify-center gap-1">
                          <span className="text-sm font-bold mb-0.5">R$</span>
                          <span className="text-2xl font-black tracking-tight">
                            {prod.preco ? prod.preco.toFixed(2).replace('.', ',') : '0,00'}
                          </span>
                        </div>
                      </div>

                      <div
                        className="w-full py-3 rounded-xl font-black text-sm text-white text-center flex justify-center items-center gap-2 transition-transform active:scale-95 shadow-md group-hover:shadow-lg"
                        style={{ backgroundColor: profile.cor_primaria || '#1e293b' }}
                      >
                        <span>Acessar</span>
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </div>
                  </a>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
