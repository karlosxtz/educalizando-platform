'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Zap, FileText, Video, BookOpen, 
  Layers, HelpCircle, ShoppingBag, X, CheckCircle2, Tags, GraduationCap,
  MessageCircle 
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
import { Store, Product, ProductType, Category, EducationLevel } from '@/lib/types';
import { getCategories, getEducationLevels } from '@/lib/category-service';
import CustomSelect, { CustomSelectOption } from '@/components/ui/CustomSelect';

interface PublicStoreClientViewProps {
  store: Store;
  initialProducts: Product[];
}

export default function PublicStoreClientView({ store, initialProducts }: PublicStoreClientViewProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutSimulated, setCheckoutSimulated] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEducation, setSelectedEducation] = useState<string>('all');

  useEffect(() => {
    loadMetadata();
  }, [store.id]);

  const loadMetadata = async () => {
    const cats = await getCategories(store.id);
    const edLevels = await getEducationLevels();
    setCategories(cats);
    setEducationLevels(edLevels);
  };

  const primaryColor = store.cor_primaria || '#2563eb';

  const filteredProducts = initialProducts.filter(p => {
    const matchSearch = p.titulo.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (p.descricao && p.descricao.toLowerCase().includes(searchFilter.toLowerCase()));
    const matchCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchEducation = selectedEducation === 'all' || p.education_level_id === selectedEducation;
    return matchSearch && matchCategory && matchEducation;
  });

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
      <div className="bg-slate-900 py-2 px-4 text-center text-xs text-slate-300 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>Loja Oficial Habilitada na Plataforma <strong>Educalizando</strong> — Checkout PIX & Proteção Garantida</span>
      </div>

      {/* Store Banner Hero Header */}
      <header className="relative bg-white border-b border-slate-200">
        <div className="h-48 sm:h-64 relative overflow-hidden bg-slate-900">
          {store.banner_url ? (
            <img src={store.banner_url} alt={store.nome_loja} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center text-slate-400 font-bold text-sm">
              Banner Oficial da Loja (1200x400)
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
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

      {/* Main Store Products Catalog */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Filter & Catalog Header with Styled CustomSelect Components */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" style={{ color: primaryColor }} />
              Materiais Didáticos Publicados ({filteredProducts.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Escolha seu material e receba acesso imediato na Área de Membros após o pagamento via PIX.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="w-full sm:w-56">
              <input
                type="text"
                placeholder="Buscar material..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-slate-400 rounded-xl text-slate-900 text-xs placeholder-slate-400 focus:outline-none shadow-xs font-medium"
              />
            </div>

            {/* Custom Category Select */}
            <div className="w-full sm:w-52">
              <CustomSelect
                options={categoryFilterOptions}
                value={selectedCategory}
                onChange={(val) => setSelectedCategory(val)}
                icon={<Tags className="w-3.5 h-3.5" />}
              />
            </div>

            {/* Custom Education Level Select */}
            <div className="w-full sm:w-52">
              <CustomSelect
                options={educationFilterOptions}
                value={selectedEducation}
                onChange={(val) => setSelectedEducation(val)}
                icon={<GraduationCap className="w-3.5 h-3.5" />}
              />
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs text-center max-w-md mx-auto space-y-3">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Nenhum material encontrado</h3>
            <p className="text-xs text-slate-500">
              Não foram encontrados materiais para o filtro selecionado nesta loja.
            </p>
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
                  transition={{ delay: index * 0.06, duration: 0.4 }}
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group hover:border-slate-300"
                >
                  <div className="space-y-3">
                    {/* Product Cover with Fixed 3:4 Aspect Ratio */}
                    <div className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-slate-100 relative">
                      {prod.capa_url ? (
                        <img src={prod.capa_url} alt={prod.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-semibold p-4 text-center">
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

                    {/* Category & Education Level Badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {catName && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1">
                          <Tags className="w-3 h-3" /> {catName}
                        </span>
                      )}
                      {edName && (
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" /> {edName}
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                        {prod.titulo}
                      </h3>
                      {prod.descricao && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                          {prod.descricao}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Price & Buy Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Investimento</span>
                      <span className="text-xl font-black text-slate-900">
                        R$ {prod.preco.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setCheckoutSimulated(false);
                        setSelectedProduct(prod);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Zap className="w-3.5 h-3.5 fill-white" />
                      <span>Ver Detalhes</span>
                    </button>
                  </div>
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
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform z-40 group"
          title="Falar com a loja"
        >
          <MessageCircle className="w-7 h-7 fill-white" />
          <span className="absolute right-full mr-3 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Falar com a loja
          </span>
        </a>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-900 py-8 text-center text-xs text-slate-400 space-y-4">
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
        <p className="text-slate-500">Tecnologia e Entrega por <Link href="/" className="text-blue-400 font-bold hover:underline">Educalizando Plataforma Digital</Link></p>
      </footer>
    </div>
  );
}
