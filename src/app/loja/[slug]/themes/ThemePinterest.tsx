'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Zap, FileText, Video, BookOpen, 
  Layers, HelpCircle, ShoppingBag, X, CheckCircle2, Tags, GraduationCap,
  MessageCircle, Plus, Sparkles, Search, Boxes, Percent, Star
} from 'lucide-react';

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);
import { Store, Product, ProductType, Category, EducationLevel, Kit } from '@/lib/types';
import { getCategories, getEducationLevels } from '@/lib/category-service';
import { getPublicKitsByStoreId } from '@/lib/kit-service';
import CustomSelect, { CustomSelectOption } from '@/components/ui/CustomSelect';

import { getPublicProductsByStoreId } from '@/lib/store-service';

import { StoreThemeProps } from '@/lib/types';

export default function ThemePinterest(props: StoreThemeProps) {
  const { 
    store, 
    products, 
    filteredProducts, 
    categories, 
    educationLevels, 
    kits,
    selectedCategory, 
    setSelectedCategory, 
    selectedEducation, 
    setSelectedEducation, 
    searchFilter, 
    setSearchFilter 
  } = props;

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutSimulated, setCheckoutSimulated] = useState(false);

  const primaryColor = store.cor_primaria || '#2563eb';

  const getTipoIcon = (tipo: ProductType) => {
    switch (tipo) {
      case 'pdf': return <FileText className="w-3.5 h-3.5" />;
      case 'ebook': return <BookOpen className="w-3.5 h-3.5" />;
      case 'video': return <Video className="w-3.5 h-3.5" />;
      case 'curso': return <Layers className="w-3.5 h-3.5" />;
      case 'simulado': return <HelpCircle className="w-3.5 h-3.5" />;
    }
  };

  const getCategoryName = (catId?: string | null) => {
    if (!catId) return null;
    return categories.find(c => c.id === catId)?.nome || null;
  };

  const getEducationName = (edId?: string | null) => {
    if (!edId) return null;
    return educationLevels.find(e => e.id === edId)?.nome || null;
  };

  const handleStartCheckout = () => {
    setCheckoutSimulated(true);
    setTimeout(() => {
      setCheckoutSimulated(false);
      setSelectedProduct(null);
    }, 2500);
  };

  // Build Options for CustomSelect Component
  const categoryFilterOptions: CustomSelectOption[] = [
    { value: 'all', label: 'Todas as Categorias' },
    ...categories.map(c => ({ value: c.id, label: c.nome }))
  ];

  const educationFilterOptions: CustomSelectOption[] = [
    { value: 'all', label: 'Todos os Níveis' },
    ...educationLevels.map(e => ({ value: e.id, label: e.nome }))
  ];

  return (
    <div 
      className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white"
      style={{ '--store-primary': primaryColor } as React.CSSProperties}
    >
      {/* Top Educalizando Trust Bar */}
      <div className="bg-slate-900 py-2 px-4 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center">
            <ShieldCheck className="w-4 h-4 text-brand-green flex-shrink-0" />
            <span className="flex items-center gap-1.5">
              Loja Oficial Habilitada na Plataforma 
              <img src="/branding/logo-educalizando.png" alt="Educalizando" className="h-5 w-auto object-contain inline-block" style={{ width: 'auto', height: '20px' }} />
              — Checkout PIX & Proteção
            </span>
          </div>
          <Link
            href={`/aluno/login?from=${store.slug}`}
            className="text-brand-teal hover:text-white font-extrabold flex items-center gap-1.5 bg-brand-navy/60 hover:bg-brand-navy px-3 py-1 rounded-full border border-brand-teal/30 text-[11px] transition-all"
          >
            <GraduationCap className="w-3.5 h-3.5 text-brand-teal" />
            <span>Já comprou nesta loja? Acesse seus materiais</span>
          </Link>
        </div>
      </div>

      {/* Store Banner Hero Header */}
      <header className="relative bg-white border-b border-slate-200">
        <div className="h-52 sm:h-64 relative overflow-hidden bg-slate-950">
          {store.banner_url ? (
            <>
              <img src={store.banner_url} alt={store.nome_loja} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
            </>
          ) : (
            <div 
              className="w-full h-full relative flex items-center justify-center overflow-hidden transition-all"
              style={{
                background: `radial-gradient(circle at 50% 30%, ${primaryColor}30 0%, #090d16 85%)`
              }}
            >
              {/* Subtle geometric dot matrix pattern */}
              <div 
                className="absolute inset-0 opacity-20 pointer-events-none" 
                style={{
                  backgroundImage: `radial-gradient(${primaryColor} 1.5px, transparent 1.5px)`,
                  backgroundSize: '24px 24px'
                }}
              />
              <div className="relative z-10 flex flex-col items-center gap-2 text-center p-4">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 shadow-xl backdrop-blur-md transition-transform hover:scale-105"
                  style={{ backgroundColor: `${primaryColor}25` }}
                >
                  <Sparkles className="w-6 h-6" style={{ color: primaryColor }} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-300/70 drop-shadow-xs">
                  Vitrine Oficial • {store.nome_loja}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Store Profile Bar with Floating Circle Logo */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative pb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
            
            {/* Circular Logo Overlapping Banner */}
            <div className="-mt-14 sm:-mt-16 w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white p-1.5 border-4 border-white shadow-xl overflow-hidden flex-shrink-0 relative z-10">
              {store.logo_url ? (
                <img src={store.logo_url} alt={store.nome_loja} className="w-full h-full rounded-full object-cover" />
              ) : (
                <div 
                  className="w-full h-full rounded-full flex items-center justify-center text-white font-black text-3xl sm:text-4xl shadow-inner"
                  style={{ backgroundColor: primaryColor }}
                >
                  {store.nome_loja.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Store Name & Bio */}
            <div className="space-y-2 flex-1 pt-2 sm:pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-center sm:justify-start">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                  {store.nome_loja}
                </h1>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1.5 self-center shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> VERIFICADO EDUCALIZANDO
                </span>

                {/* Social Links Header */}
                <div className="flex items-center gap-2 mt-2 sm:mt-0 sm:ml-auto">
                  {store.instagram && (
                    <a href={store.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-white rounded-full text-slate-400 hover:text-[#E1306C] hover:bg-slate-50 transition-colors shadow-sm border border-slate-200">
                      <InstagramIcon className="w-5 h-5" />
                    </a>
                  )}
                  {store.whatsapp && (
                    <a href={`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[#25D366] text-white rounded-full text-xs font-bold hover:bg-[#128C7E] transition-colors shadow-sm flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 fill-white" />
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {store.descricao && (
                <p className="text-sm text-slate-600 max-w-3xl leading-relaxed font-medium">
                  {store.descricao}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sticky Filter & Search Bar */}
      <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-md py-4 border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" style={{ color: primaryColor }} />
                Materiais Didáticos Publicados ({filteredProducts.length})
              </h2>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Acesso imediato no e-mail e na Área de Membros após a compra.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              {/* Full-width Search Input */}
              <div className="relative w-full sm:w-64 md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou tema..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-slate-900 text-xs placeholder-slate-400 focus:outline-none shadow-xs font-medium"
                />
              </div>

              {/* Custom Category Select */}
              <div className="w-full sm:w-48">
                <CustomSelect
                  options={categoryFilterOptions}
                  value={selectedCategory}
                  onChange={(val) => setSelectedCategory(val)}
                  icon={<Tags className="w-3.5 h-3.5" />}
                />
              </div>

              {/* Custom Education Level Select */}
              <div className="w-full sm:w-48">
                <CustomSelect
                  options={educationFilterOptions}
                  value={selectedEducation}
                  onChange={(val) => setSelectedEducation(val)}
                  icon={<GraduationCap className="w-3.5 h-3.5" />}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Store Products Catalog */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* Kits & Combos Section */}
        {kits.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Boxes className="w-6 h-6 text-blue-600" style={{ color: primaryColor }} />
                  Kits e Combos Promocionais
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Leve o conjunto completo de materiais didáticos com desconto especial.
                </p>
              </div>
              <span className="text-xs font-extrabold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Maior Economia
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {kits.map((kit) => {
                const prods = kit.products || [];
                const somaPrecos = prods.reduce((sum, p) => sum + p.preco, 0);
                const economia = Math.max(0, somaPrecos - kit.preco_kit);
                const percentualOff = somaPrecos > 0 && kit.preco_kit < somaPrecos
                  ? Math.round((economia / somaPrecos) * 100)
                  : 0;

                return (
                  <Link
                    key={kit.id}
                    href={`/loja/${store.slug}/kit/${kit.id}`}
                    className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group flex flex-col justify-between"
                  >
                    <div className="p-5 space-y-4">
                      {/* Kit Cover Image */}
                      <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100 relative shadow-inner">
                        {kit.capa_url ? (
                          <img src={kit.capa_url} alt={kit.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs font-semibold p-4 text-center bg-gradient-to-tr from-slate-900 to-slate-800 text-white">
                            <Boxes className="w-8 h-8 text-blue-400 mb-1" />
                            <span>Combo de Materiais</span>
                          </div>
                        )}

                        {/* Savings Badge */}
                        {percentualOff > 0 ? (
                          <span className="absolute top-3 left-3 bg-rose-600 text-white text-xs font-black px-3 py-1 rounded-xl uppercase shadow-lg flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" /> {percentualOff}% OFF
                          </span>
                        ) : (
                          <span className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase shadow-md">
                            Combo Especial
                          </span>
                        )}

                        {/* Total Count Badge */}
                        <span className="absolute bottom-3 right-3 bg-slate-900/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1 border border-white/20">
                          <Layers className="w-3 h-3 text-blue-400" /> {prods.length} itens inclusos
                        </span>
                      </div>

                      <div>
                        <h4 className="font-black text-slate-900 text-base group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                          {kit.titulo}
                        </h4>
                        {kit.descricao && (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-medium leading-relaxed">
                            {kit.descricao}
                          </p>
                        )}
                      </div>

                      {/* Included Items Pill List */}
                      {prods.length > 0 && (
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Incluso neste Combo:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {prods.slice(0, 3).map((p, i) => (
                              <span key={i} className="text-[10px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 truncate max-w-[150px]">
                                {p.titulo}
                              </span>
                            ))}
                            {prods.length > 3 && (
                              <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">
                                +{prods.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Price Footer */}
                    <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Investimento Combo</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-slate-900">
                            R$ {kit.preco_kit.toFixed(2).replace('.', ',')}
                          </span>
                          {somaPrecos > kit.preco_kit && (
                            <span className="text-xs text-slate-400 line-through font-semibold">
                              R$ {somaPrecos.toFixed(2).replace('.', ',')}
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        className="px-4 py-2 rounded-xl text-xs font-black text-white shadow-md group-hover:brightness-110 transition-all flex items-center gap-1"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Zap className="w-3.5 h-3.5 fill-white" />
                        <span>Ver Combo</span>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white p-12 sm:p-16 rounded-3xl border border-slate-200 shadow-sm text-center max-w-lg mx-auto space-y-5 my-8">
            <div 
              className="w-20 h-20 rounded-full mx-auto flex items-center justify-center border border-slate-100 shadow-inner transition-transform hover:scale-105"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <BookOpen className="w-10 h-10" style={{ color: primaryColor }} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">
                {searchFilter || selectedCategory !== 'all' || selectedEducation !== 'all' 
                  ? 'Nenhum material encontrado' 
                  : 'Ainda não há materiais publicados aqui'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">
                {searchFilter || selectedCategory !== 'all' || selectedEducation !== 'all'
                  ? 'Nenhum material atende aos filtros selecionados. Tente ajustar os parâmetros de busca.'
                  : 'Volte em breve! Este criador está preparando novidades e materiais exclusivos.'}
              </p>
            </div>

            {products.length === 0 && (
              <div className="pt-2">
                <Link
                  href="/dashboard/produtos"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black text-white shadow-lg hover:brightness-110 active:scale-95 transition-all"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Meu Primeiro Produto</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((prod, index) => {
              const catName = getCategoryName(prod.category_id);
              const edName = getEducationName(prod.education_level_id);

              return (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group flex flex-col justify-between"
                >
                  <Link 
                    href={`/loja/${store.slug}/produto/${prod.id}`}
                    className="flex-1 p-5 flex flex-col justify-between space-y-4 cursor-pointer"
                  >
                    <div className="space-y-3">
                      {/* Product Cover with Fixed 3:4 Aspect Ratio & object-cover */}
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
                          className="absolute top-2.5 left-2.5 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1.5 uppercase shadow-md backdrop-blur-xs"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {getTipoIcon(prod.tipo)}
                          <span>{prod.tipo}</span>
                        </span>
                      </div>

                      {/* Category & Education Level Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 min-h-[22px]">
                        {catName && (
                          <span className="bg-blue-50/80 text-blue-700 border border-blue-100/80 px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1">
                            <Tags className="w-3 h-3" /> {catName}
                          </span>
                        )}
                        {edName && (
                          <span className="bg-indigo-50/80 text-indigo-700 border border-indigo-100/80 px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" /> {edName}
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                          {prod.titulo}
                        </h3>
                        {prod.descricao && (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-medium leading-relaxed">
                            {prod.descricao}
                          </p>
                        )}
                        
                        {prod.average_rating ? (
                          <div className="flex items-center gap-1 mt-2">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-bold text-slate-700">{prod.average_rating}</span>
                            <span className="text-[10px] text-slate-400 font-medium">({prod.review_count})</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Price & Buy Action */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Investimento</span>
                        <span className="text-xl font-black tracking-tight text-slate-900">
                          R$ {prod.preco.toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      <span
                        className="px-3.5 py-2 rounded-xl text-xs font-extrabold text-white shadow-md group-hover:shadow-lg group-hover:brightness-110 transition-all flex items-center gap-1.5"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Zap className="w-3.5 h-3.5 fill-white" />
                        <span>Ver Detalhes</span>
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

      </main>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-5 relative overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
                <img src="/branding/logo-educalizando.png" alt="Educalizando" className="h-8 w-auto object-contain" style={{ width: 'auto', height: '32px' }} />
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Checkout Seguro
                </span>
              </div>

              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setCheckoutSimulated(false);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>

              {checkoutSimulated ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Simulação de PIX Gerada!</h3>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto font-medium">
                    Ambiente de testes do Educalizando. O split de pagamentos oficial via Asaas estará ativado nas vendas reais.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <span 
                      className="p-2 rounded-lg text-white text-xs font-bold uppercase flex items-center gap-1"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {getTipoIcon(selectedProduct.tipo)} {selectedProduct.tipo}
                    </span>
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> 7 Dias de Garantia
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedProduct.titulo}</h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Vendido por <strong>{store.nome_loja}</strong></p>
                  </div>

                  {selectedProduct.descricao && (
                    <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium">
                      {selectedProduct.descricao}
                    </p>
                  )}

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 block">Preço Final:</span>
                      <span className="text-2xl font-black text-slate-900">R$ {selectedProduct.preco.toFixed(2).replace('.', ',')}</span>
                    </div>

                    <button
                      onClick={handleStartCheckout}
                      className="px-6 py-3 rounded-xl font-extrabold text-sm text-white shadow-md flex items-center gap-2 active:scale-95 transition-transform"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Zap className="w-4 h-4 fill-white" /> Comprar via PIX
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating WhatsApp Button */}
      {store.whatsapp && (
        <a
          href={`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform z-40 group min-h-[44px] min-w-[44px] mb-[env(safe-area-inset-bottom,20px)]"
          title="Falar com a loja"
        >
          <MessageCircle className="w-7 h-7 fill-white" />
          <span className="hidden sm:block absolute right-full mr-3 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Falar com a loja
          </span>
        </a>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-900 py-8 text-center text-xs text-slate-400 space-y-4 safe-padding-bottom">
        <div className="flex items-center justify-center gap-4">
          {store.instagram && (
            <a href={store.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              <InstagramIcon className="w-4 h-4" /> Instagram
            </a>
          )}
          {store.whatsapp && (
            <a href={`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          )}
        </div>
        <p>© {new Date().getFullYear()} {store.nome_loja} — Todos os direitos reservados.</p>
        <div className="flex items-center justify-center gap-2 text-slate-500 mt-1">
          <span>Tecnologia e Entrega por</span>
          <Link href="/">
            <img src="/branding/logo-educalizando.png" alt="Educalizando" className="h-6 w-auto object-contain" style={{ width: 'auto', height: '24px' }} />
          </Link>
        </div>
      </footer>
    </div>
  );
}
