'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, ArrowLeft, Tags, GraduationCap, Star, ExternalLink, Sparkles
} from 'lucide-react';

interface AffiliateStoreClientViewProps {
  affiliateId: string;
  profile: any;
  products: any[];
}

export default function AffiliateStoreClientView({ affiliateId, profile, products }: AffiliateStoreClientViewProps) {
  const [searchFilter, setSearchFilter] = useState('');

  const filteredProducts = products.filter(p => {
    const matchSearch = p.titulo.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (p.descricao && p.descricao.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchSearch;
  });

  const getTipoIcon = (tipo: string) => {
    return <Sparkles className="w-3.5 h-3.5" />; // Simplification
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Banner & Profile */}
      <div className="bg-brand-navy w-full pt-12 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/branding/mesh-bg.png')] opacity-10 bg-cover bg-center"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-teal/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center space-y-4 mt-8">
          {profile.logo_url ? (
            <img 
              src={profile.logo_url} 
              alt={profile.nome_loja} 
              className="w-24 h-24 rounded-full mx-auto border-4 border-white shadow-xl bg-white object-cover" 
            />
          ) : (
            <div className="w-24 h-24 rounded-full mx-auto border-4 border-white shadow-xl bg-gradient-to-tr from-brand-navy to-brand-teal flex items-center justify-center text-3xl font-black text-white">
              {profile.nome_loja.substring(0, 2).toUpperCase()}
            </div>
          )}
          
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Vitrine de {profile.nome_loja}
          </h1>
          {profile.descricao && (
            <p className="text-blue-100 max-w-2xl mx-auto text-sm sm:text-base font-medium">
              {profile.descricao}
            </p>
          )}
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20 mt-4 backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-brand-teal" />
            <span className="text-xs font-bold text-white tracking-wide">
              Afiliado Autorizado Educalizando
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 -mt-12 relative z-20">
        {/* Search */}
        <div className="bg-white p-2 rounded-2xl shadow-xl shadow-slate-200/50 flex flex-wrap lg:flex-nowrap items-center gap-2 border border-slate-100 mb-8 max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Buscar recomendações..."
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            className="flex-1 bg-slate-50 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none border border-transparent focus:border-brand-navy focus:bg-white transition-all w-full lg:w-auto"
          />
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100">
            <h3 className="text-xl font-black text-slate-800 mb-2">Nenhum material encontrado</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Ainda não há materiais aprovados para a vitrine deste afiliado, ou sua busca não retornou resultados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((prod, index) => {
              return (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group flex flex-col justify-between"
                >
                  <a 
                    href={`/loja/${prod.store.slug}?ref=${affiliateId}`}
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
                        <span 
                          className="absolute top-2.5 left-2.5 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1.5 uppercase shadow-md backdrop-blur-xs bg-brand-navy"
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
                          Criado por: <strong>{prod.store.nome_loja}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Investimento</span>
                        <span className="text-xl font-black tracking-tight text-slate-900">
                          R$ {prod.preco.toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      <div
                        className="px-3.5 py-2 rounded-xl text-xs font-extrabold text-white shadow-md group-hover:shadow-lg transition-all flex items-center gap-1.5 bg-brand-navy group-hover:bg-brand-navy-hover"
                      >
                        <span>Acessar</span>
                        <ExternalLink className="w-3 h-3" />
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
