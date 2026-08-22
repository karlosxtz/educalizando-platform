'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, ExternalLink, Sparkles, Star, Flame
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
  const [filterTopRated, setFilterTopRated] = useState(false);
  const [filterUnder50, setFilterUnder50] = useState(false);

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
    const matchTopRated = !filterTopRated || (p.average_rating && p.average_rating >= 4.5);
    const matchUnder50 = !filterUnder50 || p.preco <= 50;
    return matchSearch && matchCategory && matchMinPrice && matchMaxPrice && matchStore && matchTopRated && matchUnder50;
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
        <div className="sticky top-4 z-40 backdrop-blur-xl bg-white/80 border border-slate-200/60 p-4 rounded-2xl shadow-sm flex flex-col gap-4 mb-8 max-w-6xl mx-auto">
          
          {/* ANDAR 1: Busca e Ordenação */}
          <div className="flex flex-col md:flex-row gap-3 justify-between items-center w-full">
            <div className="w-full flex-1">
              <input
                type="text"
                placeholder="Buscar recomendações..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="w-full bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none border border-transparent focus:border-brand-navy focus:bg-white transition-all"
              />
            </div>
            <div className="w-full md:w-48">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="w-full bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none border border-transparent focus:border-brand-navy focus:bg-white transition-all text-slate-700 cursor-pointer"
              >
                <option value="recent">Mais recente</option>
                <option value="price_asc">Mais barato</option>
                <option value="price_desc">Mais caro</option>
              </select>
            </div>
          </div>

          {/* ANDAR 2: Categorias e Lojas (Pills) */}
          <div className="flex flex-col gap-3 w-full">
            {/* Categorias */}
            <div className="flex overflow-x-auto gap-2 scrollbar-hide items-center w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
                  !selectedCategory 
                    ? 'text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                style={{ backgroundColor: !selectedCategory ? (profile.cor_primaria || '#1e293b') : undefined }}
              >
                Todas as categorias
              </button>
              {availableCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
                    selectedCategory === cat.id 
                      ? 'text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  style={{ backgroundColor: selectedCategory === cat.id ? (profile.cor_primaria || '#1e293b') : undefined }}
                >
                  {cat.nome}
                </button>
              ))}
            </div>

            {/* Lojas Pills */}
            {availableStores.length > 1 && (
              <div className="flex overflow-x-auto gap-2 scrollbar-hide items-center w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]">
                <button
                  onClick={() => setSelectedStore('')}
                  className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
                    !selectedStore 
                      ? 'text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  style={{ backgroundColor: !selectedStore ? (profile.cor_primaria || '#1e293b') : undefined }}
                >
                  Todas as lojas
                </button>
                {availableStores.map(store => (
                  <button
                    key={store.id}
                    onClick={() => setSelectedStore(store.id)}
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
                      selectedStore === store.id 
                        ? 'text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    style={{ backgroundColor: selectedStore === store.id ? (profile.cor_primaria || '#1e293b') : undefined }}
                  >
                    {store.nome_loja}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ANDAR 3: Preço Mín/Máx e Smart Toggles */}
          <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between w-full">
            
            {/* Filtros Rápidos (Smart Toggles) */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]">
              <button 
                onClick={() => setFilterTopRated(!filterTopRated)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${filterTopRated ? 'bg-yellow-100 border-yellow-400 text-yellow-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
              >
                ⭐ Top Avaliados
              </button>
              <button 
                onClick={() => setFilterUnder50(!filterUnder50)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${filterUnder50 ? 'bg-emerald-100 border-emerald-400 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
              >
                💸 Até R$ 50
              </button>
            </div>

            {/* Inputs de Preço (Mín / Máx) */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="number"
                placeholder="Mín (R$)"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                className="w-full md:w-24 bg-slate-50 px-3 py-2 rounded-lg text-sm font-medium focus:outline-none border border-transparent focus:border-brand-navy focus:bg-white transition-all"
              />
              <span className="text-slate-400 font-medium">-</span>
              <input
                type="number"
                placeholder="Máx (R$)"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                className="w-full md:w-24 bg-slate-50 px-3 py-2 rounded-lg text-sm font-medium focus:outline-none border border-transparent focus:border-brand-navy focus:bg-white transition-all"
              />
            </div>
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 [perspective:1000px]">
            {filteredProducts.map((prod, index) => {
              // Extract the affiliate ID for this specific affiliation link
              const refId = prod.affiliateInfo?.id || '';
              
              return (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5, scale: 1.02, rotateX: 2, rotateY: -2 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-2xl transition-shadow duration-300 group flex flex-col justify-between"
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
                        {/* Hot Badge */}
                        <span className="absolute top-2.5 right-2.5 bg-rose-500/90 backdrop-blur-sm text-white text-[10px] font-black px-2 py-1 rounded-md flex items-center gap-1 z-10 shadow-md">
                          <Flame className="w-3 h-3" />Em Alta
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                          {prod.titulo}
                        </h3>
                        {prod.average_rating ? (
                          <div className="flex items-center gap-1 mt-1.5">
                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs font-bold text-slate-700">{prod.average_rating.toFixed(1)}</span>
                            <span className="text-xs font-medium text-slate-400">({prod.review_count || 0})</span>
                          </div>
                        ) : null}
                        <p className="text-xs text-slate-500 line-clamp-1 mt-1.5 font-medium">
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
