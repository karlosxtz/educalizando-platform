'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store as StoreIcon, ShieldCheck, Zap, Award, Star, 
  FileText, Video, BookOpen, Layers, HelpCircle, ShoppingBag, X, Sparkles, CheckCircle2 
} from 'lucide-react';
import { Store, Product, ProductType } from '@/lib/types';

interface PublicStoreClientViewProps {
  store: Store;
  initialProducts: Product[];
}

export default function PublicStoreClientView({ store, initialProducts }: PublicStoreClientViewProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  const primaryColor = store.cor_primaria || '#ff5722';

  const filteredProducts = initialProducts.filter(p => 
    p.titulo.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (p.descricao && p.descricao.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const getTipoIcon = (tipo: ProductType) => {
    switch (tipo) {
      case 'pdf': return <FileText className="w-3.5 h-3.5" />;
      case 'ebook': return <BookOpen className="w-3.5 h-3.5" />;
      case 'video': return <Video className="w-3.5 h-3.5" />;
      case 'curso': return <Layers className="w-3.5 h-3.5" />;
      case 'simulado': return <HelpCircle className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-[#ff5722] selection:text-white"
      style={{ '--store-primary': primaryColor } as React.CSSProperties}
    >
      {/* Top Educalizando Trust Bar */}
      <div className="bg-[#090d16] border-b border-white/10 py-2 px-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>Loja Oficial Habilitada na Plataforma <strong>Educalizando</strong> — Checkout PIX & Proteção Garantida</span>
      </div>

      {/* Store Banner Hero Header */}
      <header className="relative bg-slate-900 border-b border-white/10">
        <div className="h-44 sm:h-60 relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900">
          {store.banner_url ? (
            <img src={store.banner_url} alt={store.nome_loja} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold text-sm">
              Banner Oficial da Loja
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/50 to-transparent" />
        </div>

        {/* Store Profile Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-16 pb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
            {/* Logo Avatar */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#0b0f19] p-1 border-4 border-[#0b0f19] shadow-2xl overflow-hidden flex-shrink-0">
              {store.logo_url ? (
                <img src={store.logo_url} alt={store.nome_loja} className="w-full h-full rounded-full object-cover" />
              ) : (
                <div 
                  className="w-full h-full rounded-full flex items-center justify-center text-white font-black text-3xl shadow-inner"
                  style={{ backgroundColor: primaryColor }}
                >
                  {store.nome_loja.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Store Name & Bio */}
            <div className="space-y-2 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-center sm:justify-start">
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  {store.nome_loja}
                </h1>
                <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30 inline-flex items-center gap-1.5 self-center">
                  <ShieldCheck className="w-3.5 h-3.5" /> VERIFICADO EDUCALIZANDO
                </span>
              </div>

              {store.descricao && (
                <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
                  {store.descricao}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Store Products Catalog */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Filter & Catalog Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" style={{ color: primaryColor }} />
              Materiais Didáticos Publicados ({filteredProducts.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Escolha seu material e receba acesso imediato na Área de Membros após o pagamento via PIX.
            </p>
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Buscar material didático..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full px-4 py-2 bg-[#111827] border border-white/10 focus:border-white/30 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="glass-panel p-12 text-center max-w-md mx-auto space-y-3">
            <BookOpen className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">Nenhum material encontrado</h3>
            <p className="text-xs text-slate-400">
              Esta loja ainda não possui materiais didáticos publicados no catálogo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(prod => (
              <div
                key={prod.id}
                className="glass-panel glass-panel-hover p-5 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Product Cover */}
                  <div className="h-44 rounded-xl overflow-hidden bg-slate-800 relative">
                    {prod.capa_url ? (
                      <img src={prod.capa_url} alt={prod.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                        Material Didático Digital
                      </div>
                    )}
                    <span 
                      className="absolute top-2.5 left-2.5 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md flex items-center gap-1.5 uppercase shadow-md"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {getTipoIcon(prod.tipo)}
                      <span>{prod.tipo}</span>
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-bold text-white text-base group-hover:text-slate-200 transition-colors line-clamp-2 leading-tight">
                      {prod.titulo}
                    </h3>
                    {prod.descricao && (
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                        {prod.descricao}
                      </p>
                    )}
                  </div>
                </div>

                {/* Price & Buy Action */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Investimento</span>
                    <span className="text-xl font-black text-white">
                      R$ {prod.preco.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedProduct(prod)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg flex items-center gap-1.5 transition-transform active:scale-95"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    <span>Ver Detalhes</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel border-white/20 w-full max-w-lg p-6 space-y-5 relative overflow-hidden"
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <span 
                  className="p-2 rounded-lg text-white text-xs font-bold uppercase flex items-center gap-1"
                  style={{ backgroundColor: primaryColor }}
                >
                  {getTipoIcon(selectedProduct.tipo)} {selectedProduct.tipo}
                </span>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> 7 Dias de Garantia
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">{selectedProduct.titulo}</h3>
                <p className="text-xs text-slate-400 mt-1">Vendido por <strong>{store.nome_loja}</strong></p>
              </div>

              {selectedProduct.descricao && (
                <p className="text-sm text-slate-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                  {selectedProduct.descricao}
                </p>
              )}

              <div className="bg-[#0b0f19] p-4 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Preço Final:</span>
                  <span className="text-2xl font-black text-white">R$ {selectedProduct.preco.toFixed(2).replace('.', ',')}</span>
                </div>

                <button
                  onClick={() => {
                    alert(`Iniciando simulação de checkout para "${selectedProduct.titulo}". Em breve o checkout com PIX estará integrado com o Asaas!`);
                    setSelectedProduct(null);
                  }}
                  className="px-6 py-3 rounded-xl font-extrabold text-sm text-white shadow-xl flex items-center gap-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Zap className="w-4 h-4 fill-white" /> Comprar via PIX
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#090d16] py-8 text-center text-xs text-slate-400 space-y-2">
        <p>© {new Date().getFullYear()} {store.nome_loja} — Todos os direitos reservados.</p>
        <p className="text-slate-500">Tecnologia e Entrega por <Link href="/" className="text-[#ff5722] font-bold hover:underline">Educalizando Plataforma Digital</Link></p>
      </footer>
    </div>
  );
}
