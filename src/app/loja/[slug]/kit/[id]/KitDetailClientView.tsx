'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Zap, FileText, Video, BookOpen, 
  Layers, HelpCircle, ArrowLeft, CheckCircle2,
  MessageCircle, Sparkles, Lock, Check, Loader2, Boxes, Package, Tags, Ticket, AlertCircle 
} from 'lucide-react';
import { Store, Kit, ProductType, CouponValidationResult, ProductReview } from '@/lib/types';
import { validateCouponCode } from '@/lib/coupon-service';
import { getReviews } from '@/lib/review-service';
import ProductReviewsSection from '@/components/ProductReviewsSection';

interface KitDetailClientViewProps {
  store: Store;
  kit: Kit;
}

export default function KitDetailClientView({ store, kit }: KitDetailClientViewProps) {
  const [checkoutSimulated, setCheckoutSimulated] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponResult, setCouponResult] = useState<CouponValidationResult | null>(null);

  // Reviews State
  const [reviews, setReviews] = useState<ProductReview[]>([]);

  useEffect(() => {
    async function fetchReviews() {
      const list = await getReviews('kit', kit.id);
      setReviews(list);
    }
    fetchReviews();
  }, [kit.id]);

  const primaryColor = store.cor_primaria || '#093b6c';
  const includedProducts = kit.products || [];

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    const result = await validateCouponCode(
      store.id,
      couponInput,
      'kit',
      kit.id,
      kit.preco_kit
    );
    setValidatingCoupon(false);
    setCouponResult(result);
  };

  const currentPrice = couponResult?.valid && couponResult.finalPrice !== undefined 
    ? couponResult.finalPrice 
    : kit.preco_kit;

  const somaPrecosIndividuais = includedProducts.reduce((acc, p) => acc + p.preco, 0);
  const economiaValor = Math.max(0, somaPrecosIndividuais - currentPrice);
  const economiaPercentual = somaPrecosIndividuais > 0 && currentPrice < somaPrecosIndividuais
    ? Math.round((economiaValor / somaPrecosIndividuais) * 100)
    : 0;

  const getTipoIcon = (tipo: ProductType) => {
    switch (tipo) {
      case 'pdf': return <FileText className="w-4 h-4 text-sky-600" />;
      case 'ebook': return <BookOpen className="w-4 h-4 text-indigo-600" />;
      case 'video': return <Video className="w-4 h-4 text-purple-600" />;
      case 'curso': return <Layers className="w-4 h-4 text-blue-600" />;
      case 'simulado': return <HelpCircle className="w-4 h-4 text-amber-600" />;
    }
  };

  const handleStartCheckout = () => {
    setIsBuying(true);
    setTimeout(() => {
      setIsBuying(false);
      setCheckoutSimulated(true);
    }, 1000);
  };

  return (
    <div 
      className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white"
      style={{ '--store-primary': primaryColor } as React.CSSProperties}
    >
      {/* Top Educalizando Security & Guarantee Bar */}
      <div className="bg-slate-900 py-2 px-4 text-center text-xs text-slate-300 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>Pagamento Seguro via PIX • Combo com Acesso Imediato a Todos os Materiais • Garantia Educalizando</span>
      </div>

      {/* Navigation Breadcrumb Bar */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href={`/loja/${store.slug}`}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para a vitrine de <strong>{store.nome_loja}</strong></span>
          </Link>

          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 hidden sm:inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> LOJA VERIFICADA
          </span>
        </div>
      </header>

      {/* Main Page Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT COLUMN: Main Content, Cover, Included Products & Description (7 Cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            
            {/* Header Badges & Title */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span 
                  className="text-white text-xs font-black px-3 py-1 rounded-lg flex items-center gap-1.5 uppercase shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Boxes className="w-4 h-4" />
                  <span>COMBO DE PRODUTOS</span>
                </span>

                {economiaPercentual > 0 && (
                  <span className="bg-rose-600 text-white border border-rose-700 px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1 uppercase shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" /> {economiaPercentual}% OFF
                  </span>
                )}

                <span className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> {includedProducts.length} Materiais Inclusos
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight tracking-tight">
                {kit.titulo}
              </h1>

              <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                <span>Combo oferecido por <strong>{store.nome_loja}</strong></span>
                <span>•</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Liberação Imediata no PIX
                </span>
              </div>
            </div>

            {/* Kit High-Res Cover Display */}
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-md">
              <div className="aspect-[16/9] max-w-2xl mx-auto w-full rounded-2xl overflow-hidden bg-slate-100 relative shadow-inner">
                {kit.capa_url ? (
                  <img src={kit.capa_url} alt={kit.titulo} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-sm font-semibold p-8 text-center bg-gradient-to-tr from-slate-900 to-slate-800 text-white">
                    <Boxes className="w-12 h-12 text-blue-400 mb-2" />
                    <span>Combo de Materiais Didáticos</span>
                  </div>
                )}
              </div>
            </div>

            {/* Included Products List Box */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  <Package className="w-5 h-5" style={{ color: primaryColor }} />
                  Produtos Inclusos neste Combo ({includedProducts.length})
                </h2>
                <span className="text-xs text-slate-400 font-medium">Download individual de cada arquivo</span>
              </div>

              {includedProducts.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Nenhum produto listado especificamente.</p>
              ) : (
                <div className="grid gap-3">
                  {includedProducts.map((prod, idx) => (
                    <div
                      key={prod.id || idx}
                      className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4 transition-all hover:bg-slate-100/80"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-14 rounded-xl bg-white border border-slate-200 overflow-hidden flex-shrink-0 shadow-xs">
                          {prod.capa_url ? (
                            <img src={prod.capa_url} alt={prod.titulo} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-bold">
                              PDF
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="bg-white text-slate-900 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase flex items-center gap-1">
                              {getTipoIcon(prod.tipo)} {prod.tipo}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-900 text-sm truncate">{prod.titulo}</h3>
                          {prod.descricao && (
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 font-medium">{prod.descricao}</p>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Preço Individual</span>
                        <span className="text-sm font-black text-slate-900">
                          R$ {prod.preco.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Detailed Description Box */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
                <FileText className="w-5 h-5" style={{ color: primaryColor }} />
                Descrição Completa do Kit
              </h2>

              <div className="text-sm text-slate-700 leading-relaxed space-y-3 font-medium whitespace-pre-line">
                {kit.descricao || 'O criador não inseriu uma descrição detalhada para este combo.'}
              </div>
            </div>

            {/* "O que você vai receber" Benefits Box */}
            <div className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl space-y-6 relative overflow-hidden">
              <div 
                className="absolute inset-0 opacity-10 pointer-events-none" 
                style={{
                  backgroundImage: `radial-gradient(${primaryColor} 2px, transparent 2px)`,
                  backgroundSize: '24px 24px'
                }}
              />

              <div className="relative z-10 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-300 bg-white/10 px-3 py-1 rounded-full border border-white/15 inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" /> PACOTE COMPLETO INCLUÍDO
                </span>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                  Vantagens de comprar este Combo:
                </h3>
              </div>

              <div className="relative z-10 grid sm:grid-cols-2 gap-4">
                <div className="bg-white/10 p-4 rounded-2xl border border-white/15 space-y-1.5 backdrop-blur-xs">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/30 flex items-center justify-center text-blue-300">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm">Todos os Materiais em 1 Clique</h4>
                  <p className="text-xs text-blue-100 leading-normal">
                    Receba os arquivos digitais de cada um dos {includedProducts.length} itens inclusos no combo.
                  </p>
                </div>

                <div className="bg-white/10 p-4 rounded-2xl border border-white/15 space-y-1.5 backdrop-blur-xs">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/30 flex items-center justify-center text-emerald-300">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm">Desconto Garantido</h4>
                  <p className="text-xs text-blue-100 leading-normal">
                    {economiaValor > 0 
                      ? `Você economiza R$ ${economiaValor.toFixed(2).replace('.', ',')} (${economiaPercentual}% off) comparado aos preços individuais.`
                      : 'Super preço especial de lançamento do pacote completo.'}
                  </p>
                </div>

                <div className="bg-white/10 p-4 rounded-2xl border border-white/15 space-y-1.5 backdrop-blur-xs">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/30 flex items-center justify-center text-amber-300">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm">Garantia 7 Dias</h4>
                  <p className="text-xs text-blue-100 leading-normal">
                    Satisfação incondicional ou devolução integral do valor pago via PIX.
                  </p>
                </div>

                <div className="bg-white/10 p-4 rounded-2xl border border-white/15 space-y-1.5 backdrop-blur-xs">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/30 flex items-center justify-center text-purple-300">
                    <Check className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm">Acesso Vitalício</h4>
                  <p className="text-xs text-blue-100 leading-normal">
                    Faça o download quando quiser e estude no seu tempo em qualquer dispositivo.
                  </p>
                </div>
              </div>
            </div>

            {/* Creator / Store Bio Box */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
              <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4">
                Sobre a Loja / Criador do Conteúdo
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
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> CRIADOR VERIFICADO
                    </span>
                  </div>

                  {store.descricao && (
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {store.descricao}
                    </p>
                  )}

                  <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    <Link
                      href={`/loja/${store.slug}`}
                      className="px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      Ver Todos os Materiais da Loja
                    </Link>

                    {store.whatsapp && (
                      <a 
                        href={`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-[#25D366] text-white rounded-xl text-xs font-bold hover:bg-[#128C7E] transition-colors flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-white" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Student Reviews & Testimonials Section */}
            <ProductReviewsSection reviews={reviews} primaryColor={primaryColor} />

          </div>

          {/* RIGHT COLUMN: Sticky Buy Card (5 Cols) */}
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 space-y-6">
            
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-6">
              
              {/* Savings Highlight Banner */}
              {economiaValor > 0 && (
                <div className="bg-gradient-to-r from-rose-500 to-pink-600 text-white p-3.5 rounded-2xl text-center space-y-0.5 shadow-md">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest block opacity-90">Desconto do Combo</span>
                  <div className="text-sm font-black">
                    Economia de R$ {economiaValor.toFixed(2).replace('.', ',')} ({economiaPercentual}% OFF)
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Investimento Único do Combo
                </span>

                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                    R$ {currentPrice.toFixed(2).replace('.', ',')}
                  </span>
                  {somaPrecosIndividuais > currentPrice && (
                    <span className="text-sm font-bold text-slate-400 line-through">
                      R$ {somaPrecosIndividuais.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Pagamento único via PIX com liberação imediata de todos os arquivos.
                </p>
              </div>

              {/* Coupon Box Input */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700">
                  <Ticket className="w-4 h-4 text-brand-teal" />
                  <span>Possui um cupom de desconto?</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Código do cupom"
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 focus:border-brand-navy rounded-xl text-xs font-mono font-black uppercase text-slate-900 focus:outline-none min-h-[40px]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon || !couponInput.trim()}
                    className="px-4 py-2 rounded-xl bg-brand-navy hover:bg-brand-navy-hover text-white text-xs font-extrabold disabled:opacity-50 transition-all min-h-[40px] flex items-center gap-1 flex-shrink-0"
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

              {/* Primary Call to Action Button */}
              <button
                type="button"
                onClick={handleStartCheckout}
                disabled={isBuying}
                className="w-full py-4 rounded-2xl font-black text-base text-white shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 group min-h-[44px]"
                style={{ backgroundColor: primaryColor }}
              >
                {isBuying ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-5 h-5 fill-white group-hover:animate-bounce" />
                    <span>Comprar Combo via PIX</span>
                  </>
                )}
              </button>

              {/* Trust Features Grid */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-3 text-xs text-slate-600 font-bold">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-200">
                    <Zap className="w-4 h-4 fill-emerald-600" />
                  </div>
                  <span>Acesso Imediato via PIX</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600 font-bold">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-200">
                    <Lock className="w-4 h-4" />
                  </div>
                  <span>Pagamento Criptografado & Seguro</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600 font-bold">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-200">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span>Garantia de Satisfação 7 Dias</span>
                </div>
              </div>
            </div>

            {/* Need Help Banner */}
            {store.whatsapp && (
              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h5 className="text-xs font-black text-emerald-900">Dúvidas sobre o combo?</h5>
                  <p className="text-[11px] text-emerald-700 font-medium">Fale com o autor pelo WhatsApp</p>
                </div>
                <a
                  href={`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-[#25D366] text-white rounded-xl text-xs font-bold hover:bg-[#128C7E] transition-colors shadow-xs flex-shrink-0 flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white" /> Conversar
                </a>
              </div>
            )}

          </div>

        </div>
      </main>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3.5 z-40 shadow-2xl flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Preço do Combo</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900">
              R$ {currentPrice.toFixed(2).replace('.', ',')}
            </span>
            {couponResult?.valid && (
              <span className="text-xs text-slate-400 line-through font-bold">
                R$ {kit.preco_kit.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleStartCheckout}
          disabled={isBuying}
          className="px-6 py-3 rounded-xl font-extrabold text-sm text-white shadow-lg flex items-center gap-2 active:scale-95 transition-transform"
          style={{ backgroundColor: primaryColor }}
        >
          {isBuying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-white" />}
          <span>Comprar PIX</span>
        </button>
      </div>

      {/* Simulated PIX Checkout Modal */}
      <AnimatePresence>
        {checkoutSimulated && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-8 text-center space-y-5 shadow-2xl relative"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">Simulação de PIX do Combo!</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Você está testando a vitrine pública do Educalizando. Nas vendas reais, o split automático via Asaas enviará o pagamento instantâneo para a conta do criador e liberará o download dos {includedProducts.length} materiais inclusos no combo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCheckoutSimulated(false)}
                className="w-full py-3 rounded-xl font-extrabold text-xs text-white shadow-md transition-all"
                style={{ backgroundColor: primaryColor }}
              >
                Concluir Teste
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-900 py-8 text-center text-xs text-slate-400 space-y-4 mb-16 lg:mb-0">
        <p>© {new Date().getFullYear()} {store.nome_loja} — Todos os direitos reservados.</p>
        <p className="text-slate-500">Tecnologia e Entrega por <Link href="/" className="text-blue-400 font-bold hover:underline">Educalizando Plataforma Digital</Link></p>
      </footer>
    </div>
  );
}
