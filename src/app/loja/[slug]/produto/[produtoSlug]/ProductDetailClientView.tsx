'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Zap, FileText, Video, BookOpen, 
  Layers, HelpCircle, ArrowLeft, CheckCircle2, Tags, GraduationCap,
  MessageCircle, Sparkles, Lock, Clock, Check, Share2, Loader2, Ticket, Tag, AlertCircle, UserCheck, UserX, X, Library, ShoppingBag, Star
} from 'lucide-react';
import { Store, Product, ProductType, Category, EducationLevel, CouponValidationResult, Review } from '@/lib/types';
import { validateCouponCode } from '@/lib/coupon-service';
import { getProductReviewsWithNames } from '@/app/actions/review-actions';
import { getAuthenticatedUserRole } from '@/lib/student-service';
import { useCart } from '@/components/store/CartContext';
import ProductReviewsSection from '@/components/ProductReviewsSection';

import ProductCard from '@/components/ProductCard';

interface ProductDetailClientViewProps {
  store: Store;
  product: Product;
  category?: Category | null;
  educationLevel?: EducationLevel | null;
  context?: 'store' | 'marketplace';
  relatedProducts?: Product[];
}

export default function ProductDetailClientView({ 
  store, 
  product, 
  category, 
  educationLevel,
  context = 'store',
  relatedProducts = []
}: ProductDetailClientViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPlrPurchase = searchParams.get('licenca') === 'plr' && product.is_plr;

  const [isBuying, setIsBuying] = useState(false);
  const [showCreatorBlockModal, setShowCreatorBlockModal] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const { addToCart } = useCart();

  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponResult, setCouponResult] = useState<CouponValidationResult | null>(null);

  // Reviews State
  const [reviews, setReviews] = useState<Review[]>([]);

  // Gallery State
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Derive gallery images
  const galleryImages = [];
  if (product.capa_url) galleryImages.push(product.capa_url);
  if (product.images && product.images.length > 0) {
    product.images.forEach(img => {
      if (img.url !== product.capa_url) {
        galleryImages.push(img.url);
      }
    });
  }

  useEffect(() => {
    async function fetchReviews() {
      const list = await getProductReviewsWithNames(product.id);
      setReviews(list);
    }
    fetchReviews();
  }, [product.id]);

  const primaryColor = store.cor_primaria || '#2563eb';

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    const result = await validateCouponCode(
      store.id,
      couponInput,
      'product',
      product.id,
      product.preco
    );
    setValidatingCoupon(false);
    setCouponResult(result);
  };

  const basePrice = isPlrPurchase && product.preco_plr ? product.preco_plr : product.preco;

  const currentPrice = couponResult?.valid && couponResult.finalPrice !== undefined 
    ? couponResult.finalPrice 
    : basePrice;

  const getTipoIcon = (tipo: ProductType) => {
    switch (tipo) {
      case 'pdf': return <FileText className="w-4 h-4" />;
      case 'ebook': return <BookOpen className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'curso': return <Layers className="w-4 h-4" />;
      case 'simulado': return <HelpCircle className="w-4 h-4" />;
    }
  };

  // FLUXO DE ADICIONAR AO CARRINHO (Sem Redirecionar)
  const handleAddOnly = async () => {
    setIsBuying(true);
    try {
      addToCart({
        productId: product.id,
        title: product.titulo,
        price: currentPrice,
        isPlr: !!isPlrPurchase,
        storeId: store.id,
        type: product.tipo,
        imageUrl: product.capa_url || undefined,
        quantity: 1
      });

      setIsBuying(false);
    } catch (error) {
      setIsBuying(false);
    }
  };

  // FLUXO DE COMPRA RÁPIDA (1-CLICK CHECKOUT STYLE)
  const handleStartCheckout = async () => {
    setIsBuying(true);
    try {
      addToCart({
        productId: product.id,
        title: product.titulo,
        price: currentPrice,
        isPlr: !!isPlrPurchase,
        storeId: store.id,
        type: product.tipo,
        imageUrl: product.capa_url || undefined,
        quantity: 1
      });

      // Redireciona imediatamente para a página de checkout da loja
      router.push(`/loja/${store.slug}/checkout`);
    } catch (error) {
      setIsBuying(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white"
      style={{ '--store-primary': primaryColor } as React.CSSProperties}
    >
      {/* Top Educalizando Security Bar - Escondido no contexto Global (Marketplace) */}
      {context !== 'marketplace' && (
        <>
          <div className="bg-slate-900 py-2 px-4 text-center text-xs text-slate-300 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Pagamento Seguro via PIX • Download Imediato na Área de Membros • Garantia Educalizando</span>
          </div>

          {/* Navigation Breadcrumb Bar */}
          <header className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <Link
                href={`/loja/${store.slug}`}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>
                  Voltar para a vitrine de <strong>{store.nome_loja}</strong>
                </span>
              </Link>

              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 hidden sm:inline-flex items-center gap-1">
                <Lock className="w-3 h-3" /> Transação Criptografada (SSL)
              </span>
            </div>
          </header>
        </>
      )}

      {/* Main Page Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT COLUMN: Content */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">

            {/* Cover Display & Gallery */}
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-md flex flex-col gap-4">
              <div className="aspect-[3/4] max-w-md mx-auto w-full rounded-2xl overflow-hidden bg-slate-100 relative shadow-inner">
                {galleryImages.length > 0 ? (
                  <AnimatePresence mode="wait">
                    <motion.img 
                      key={activeImageIndex}
                      src={galleryImages[activeImageIndex]} 
                      alt={product.titulo} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-full h-full object-cover" 
                    />
                  </AnimatePresence>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-semibold p-8 text-center">
                    Material Didático Digital
                  </div>
                )}
              </div>

              {/* Gallery Thumbnails */}
              {galleryImages.length > 1 && (
                <div className="flex justify-center gap-3 overflow-x-auto pb-2 px-2">
                  {galleryImages.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-16 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                        activeImageIndex === idx 
                          ? 'border-brand-navy shadow-md opacity-100' 
                          : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                      }`}
                      style={activeImageIndex === idx ? { borderColor: primaryColor } : undefined}
                    >
                      <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description Box */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
                <FileText className="w-5 h-5" style={{ color: primaryColor }} />
                Descrição Completa do Material Didático
              </h2>

              <div className="text-sm text-slate-700 leading-relaxed space-y-3 font-medium whitespace-pre-line">
                {product.descricao || 'O criador ainda não adicionou uma descrição detalhada para este produto.'}
              </div>
            </div>

            {/* Benefits Box */}
            <div className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl space-y-6 relative overflow-hidden">
              <div className="relative z-10 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-300 bg-white/10 px-3 py-1 rounded-full border border-white/15 inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" /> CONTEÚDO EXCLUSIVO INCLUÍDO
                </span>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                  O que você vai receber ao garantir seu material:
                </h3>
              </div>

              <div className="relative z-10 grid sm:grid-cols-2 gap-4">
                <div className="bg-white/10 p-4 rounded-2xl border border-white/15 space-y-1.5 backdrop-blur-xs">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/30 flex items-center justify-center text-blue-300">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm">Arquivo Digital Completo</h4>
                  <p className="text-xs text-blue-100 leading-normal">
                    Formato {product.tipo.toUpperCase()} pronto para impressão ou leitura em telas.
                  </p>
                </div>

                <div className="bg-white/10 p-4 rounded-2xl border border-white/15 space-y-1.5 backdrop-blur-xs">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/30 flex items-center justify-center text-emerald-300">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm">Acesso Imediato no PIX</h4>
                  <p className="text-xs text-blue-100 leading-normal">
                    Receba o link de download no e-mail em menos de 10 segundos.
                  </p>
                </div>
              </div>
            </div>

            {/* Creator Bio Box */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
              <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4">
                Sobre o Autor / Criador do Conteúdo
              </h3>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-2xl text-slate-700 shadow-md">
                  {store.logo_url ? (
                    <img src={store.logo_url} alt={store.nome_loja} className="w-full h-full object-cover" />
                  ) : (
                    <span style={{ color: primaryColor }}>{store.nome_loja.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <h4 className="text-lg font-black text-slate-900">{store.nome_loja}</h4>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1 self-center">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> PROFESSOR VERIFICADO
                    </span>
                  </div>

                  {store.descricao && (
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {store.descricao}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <ProductReviewsSection reviews={reviews} primaryColor={primaryColor} />
          </div>

          {/* RIGHT COLUMN: Buy Action Card */}
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-8">
            <div className="bg-white shadow-[0_10px_40px_rgb(0,0,0,0.06)] rounded-3xl p-6 sm:p-8 flex flex-col space-y-6">
              
              {/* Product Header (Mobile & Desktop in Sidebar) */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span 
                    className="text-white text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-md flex items-center gap-1.5 uppercase shadow-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {getTipoIcon(product.tipo)}
                    <span>{product.tipo}</span>
                  </span>

                  {category && (
                    <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold flex items-center gap-1">
                      <Tags className="w-3 h-3" /> {category.nome}
                    </span>
                  )}

                  {educationLevel && (
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" /> {educationLevel.nome}
                    </span>
                  )}
                  {isPlrPurchase && (
                    <span className="bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-black flex items-center gap-1">
                      <Library className="w-3 h-3" /> PLR
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight tracking-tight">
                  {product.titulo}
                </h1>

                {/* Social Proof (Stars) */}
                <div className="flex items-center gap-2">
                  {reviews.length > 0 ? (
                    <>
                      <div className="flex items-center text-amber-400">
                        <Star className="w-4 h-4 fill-amber-400" />
                        <span className="ml-1 text-sm font-bold text-slate-700">
                          {(reviews.reduce((acc, rev) => acc + (rev.nota || 5), 0) / reviews.length).toFixed(1)}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium underline decoration-slate-300 underline-offset-2 cursor-pointer hover:text-slate-700">
                        ({reviews.length} avaliaç{reviews.length === 1 ? 'ão' : 'ões'})
                      </span>
                    </>
                  ) : (
                    <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Lançamento
                    </span>
                  )}
                </div>
              </div>
              
              <div className="h-px w-full bg-slate-100" /> {/* Divider */}
              
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Investimento Único
                </span>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                    R$ {currentPrice.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Sem Mensalidade
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-2">
                  Pagamento único com acesso vitalício ao arquivo.
                </p>
              </div>

              {/* Coupon Box Input (Minimalist Toggle) */}
              <div>
                {!showCouponInput ? (
                  <button 
                    onClick={() => setShowCouponInput(true)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center sm:justify-start gap-1 transition-colors w-full sm:w-auto"
                  >
                    <Ticket className="w-3.5 h-3.5" /> Adicionar Cupom
                  </button>
                ) : (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Código do cupom"
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl text-xs font-mono font-black uppercase text-slate-900 focus:outline-none min-h-[40px] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={validatingCoupon || !couponInput.trim()}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold disabled:opacity-50 transition-all min-h-[40px] flex items-center gap-1 flex-shrink-0"
                      >
                        {validatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Aplicar'}
                      </button>
                    </div>

                    {couponResult && (
                      <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                        couponResult.valid 
                          ? 'bg-emerald-50 text-brand-green border border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {couponResult.valid ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                        <span>{couponResult.message}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Primary Call to Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleStartCheckout}
                  disabled={isBuying}
                  className="w-full py-4 rounded-2xl font-black text-base text-white shadow-xl hover:brightness-110 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group min-h-[44px]"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isBuying ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-5 h-5 fill-transparent group-hover:animate-pulse" />
                      <span className="tracking-wide">Comprar Agora</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleAddOnly}
                  disabled={isBuying}
                  className="w-full py-4 rounded-2xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2 group min-h-[44px]"
                >
                  {isBuying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Adicionar ao Carrinho</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Specs Block (Alta Conversão) */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 border border-slate-200 text-slate-600 shadow-sm">
                    {getTipoIcon(product.tipo)}
                  </div>
                  <div className="flex flex-col pt-0.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Formato</span>
                    <span className="text-sm font-bold text-slate-800">{product.tipo.toUpperCase()} (Pronto para Uso)</span>
                  </div>
                </div>

                {educationLevel && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 border border-slate-200 text-slate-600 shadow-sm">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col pt-0.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Público</span>
                      <span className="text-sm font-bold text-slate-800">{educationLevel.nome}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 border border-emerald-100 text-emerald-600 shadow-sm">
                    <Zap className="w-4 h-4 fill-emerald-600" />
                  </div>
                  <div className="flex flex-col pt-0.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Entrega</span>
                    <span className="text-sm font-bold text-slate-800">Download imediato após pagamento</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100 text-blue-600 shadow-sm">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col pt-0.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Garantia</span>
                    <span className="text-sm font-bold text-slate-800">Acesso vitalício na plataforma</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RELATED PRODUCTS SECTION */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-16 sm:mt-24 pt-10 sm:pt-16 border-t border-slate-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Materiais que você também vai gostar
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={{ ...p, store }} />
              ))}
            </div>
          </div>
        )}

      </main>

      {/* MODAL DE BLOQUEIO PARA CRIADOR (Item 11 da Especificação) */}
      <AnimatePresence>
        {showCreatorBlockModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-8 text-center space-y-5 shadow-2xl relative font-sans"
            >
              <button 
                onClick={() => setShowCreatorBlockModal(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto border border-amber-200">
                <UserX className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  Conta de Criador Detectada
                </span>
                <h3 className="text-xl font-black text-slate-900">Você está conectado como Criador</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Esta conta é utilizada para vender materiais na Educalizando. Para comprar e acessar materiais didáticos, utilize uma <strong>conta de Aluno</strong>.
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <Link
                  href={`/aluno/login?returnTo=${encodeURIComponent(`/loja/${store.slug}/checkout?produtoId=${product.id}`)}&action=buy`}
                  className="w-full py-3.5 rounded-2xl bg-brand-navy hover:bg-brand-navy-hover text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" /> Entrar com Conta de Aluno
                </Link>

                <Link
                  href={`/aluno/cadastro?returnTo=${encodeURIComponent(`/loja/${store.slug}/checkout?produtoId=${product.id}`)}&action=buy`}
                  className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2"
                >
                  Criar Conta de Aluno Gratuitamente
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer - Escondido no contexto Global (Marketplace) */}
      {context !== 'marketplace' && (
        <footer className="border-t border-slate-200 bg-slate-900 py-8 text-center text-xs text-slate-400 space-y-4 mb-16 lg:mb-0">
          <p>© {new Date().getFullYear()} {store.nome_loja} — Todos os direitos reservados.</p>
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <span>Tecnologia e Entrega por</span>
            <Link href="/">
              <img src="/branding/logo-educalizando.png" alt="Educalizando" className="h-6 w-auto object-contain" style={{ width: 'auto', height: '24px' }} />
            </Link>
          </div>
        </footer>
      )}
      {/* Sticky Bottom Bar for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] p-4 z-40 safe-padding-bottom flex items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Investimento</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">R$ {currentPrice.toFixed(2).replace('.', ',')}</span>
        </div>
        <div className="flex flex-1 gap-2">
          <button
            type="button"
            onClick={handleAddOnly}
            disabled={isBuying}
            className="flex-1 py-3 px-2 rounded-xl font-black text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="tracking-wide leading-tight text-center">Adicionar</span>
          </button>
          <button
            type="button"
            onClick={handleStartCheckout}
            disabled={isBuying}
            className="flex-[1.5] py-3 px-2 rounded-xl font-black text-xs sm:text-sm text-white shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
            style={{ backgroundColor: primaryColor }}
          >
            {isBuying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Zap className="w-4 h-4 fill-transparent" />
                <span className="tracking-wide leading-tight text-center">Comprar Agora</span>
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
