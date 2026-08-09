'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Zap, FileText, Video, BookOpen, 
  Layers, HelpCircle, ArrowLeft, CheckCircle2, Tags, GraduationCap,
  MessageCircle, Sparkles, Lock, Clock, Check, Share2, Loader2
} from 'lucide-react';
import { Store, Product, ProductType, Category, EducationLevel } from '@/lib/types';

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

interface ProductDetailClientViewProps {
  store: Store;
  product: Product;
  category?: Category | null;
  educationLevel?: EducationLevel | null;
}

export default function ProductDetailClientView({ 
  store, 
  product, 
  category, 
  educationLevel 
}: ProductDetailClientViewProps) {
  const [checkoutSimulated, setCheckoutSimulated] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  const primaryColor = store.cor_primaria || '#2563eb';

  const getTipoIcon = (tipo: ProductType) => {
    switch (tipo) {
      case 'pdf': return <FileText className="w-4 h-4" />;
      case 'ebook': return <BookOpen className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'curso': return <Layers className="w-4 h-4" />;
      case 'simulado': return <HelpCircle className="w-4 h-4" />;
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
          
          {/* LEFT COLUMN: Main Content, Cover, Description & Benefits (8 Cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            
            {/* Header Badges & Title */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span 
                  className="text-white text-xs font-black px-3 py-1 rounded-lg flex items-center gap-1.5 uppercase shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  {getTipoIcon(product.tipo)}
                  <span>{product.tipo}</span>
                </span>

                {category && (
                  <span className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5">
                    <Tags className="w-3.5 h-3.5" /> {category.nome}
                  </span>
                )}

                {educationLevel && (
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5" /> {educationLevel.nome}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight tracking-tight">
                {product.titulo}
              </h1>

              <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                <span>Criado por <strong>{store.nome_loja}</strong></span>
                <span>•</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Entrega Imediata
                </span>
              </div>
            </div>

            {/* Product High-Res Cover Display */}
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-md">
              <div className="aspect-[3/4] max-w-md mx-auto w-full rounded-2xl overflow-hidden bg-slate-100 relative shadow-inner">
                {product.capa_url ? (
                  <img src={product.capa_url} alt={product.titulo} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-semibold p-8 text-center">
                    Material Didático Digital
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Description Box */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
                <FileText className="w-5 h-5" style={{ color: primaryColor }} />
                Descrição Completa do Material Didático
              </h2>

              <div className="text-sm text-slate-700 leading-relaxed space-y-3 font-medium whitespace-pre-line">
                {product.descricao || 'O criador ainda não adicionou uma descrição detalhada para este produto.'}
              </div>
            </div>

            {/* "O que você vai receber" Benefits Box (Hotmart Style) */}
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

                <div className="bg-white/10 p-4 rounded-2xl border border-white/15 space-y-1.5 backdrop-blur-xs">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/30 flex items-center justify-center text-amber-300">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm">Garantia Incondicional 7 Dias</h4>
                  <p className="text-xs text-blue-100 leading-normal">
                    Satisfação garantida ou seu dinheiro de volta sem complicações.
                  </p>
                </div>

                <div className="bg-white/10 p-4 rounded-2xl border border-white/15 space-y-1.5 backdrop-blur-xs">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/30 flex items-center justify-center text-purple-300">
                    <Check className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm">Uso Vitalício</h4>
                  <p className="text-xs text-blue-100 leading-normal">
                    Baixe e guarde seus arquivos no computador para usar quando quiser.
                  </p>
                </div>
              </div>
            </div>

            {/* Creator / Store Bio Box */}
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

          </div>

          {/* RIGHT COLUMN: Sticky Buy Card Desktop (4 Cols) */}
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 space-y-6">
            
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-6">
              
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Investimento Único
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                    R$ {product.preco.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Sem Mensalidade
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Pagamento único com acesso vitalício ao arquivo digital.
                </p>
              </div>

              {/* Primary Call to Action Button */}
              <button
                type="button"
                onClick={handleStartCheckout}
                disabled={isBuying}
                className="w-full py-4 rounded-2xl font-black text-base text-white shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                style={{ backgroundColor: primaryColor }}
              >
                {isBuying ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-5 h-5 fill-white group-hover:animate-bounce" />
                    <span>Comprar via PIX Instantâneo</span>
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
                  <span>Pagamento 100% Criptografado & Seguro</span>
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
                  <h5 className="text-xs font-black text-emerald-900">Dúvidas sobre o produto?</h5>
                  <p className="text-[11px] text-emerald-700 font-medium">Fale com o autor pelo WhatsApp</p>
                </div>
                <a
                  href={`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-[#25D366] text-white rounded-xl text-xs font-bold hover:bg-[#128C7E] transition-colors shadow-xs flex-shrink-0 flex items-center gap-1.5 min-h-[44px]"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white" /> Conversar
                </a>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* MOBILE STICKY BOTTOM BAR (Hotmart Style - Always visible during scroll on mobile) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3.5 shadow-2xl flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Preço Único</span>
          <span className="text-xl font-black text-slate-900 tracking-tight block">
            R$ {product.preco.toFixed(2).replace('.', ',')}
          </span>
        </div>

        <button
          type="button"
          onClick={handleStartCheckout}
          disabled={isBuying}
          className="px-6 py-3 rounded-xl font-extrabold text-xs text-white shadow-lg flex items-center gap-1.5 transition-all active:scale-95 min-h-[44px]"
          style={{ backgroundColor: primaryColor }}
        >
          {isBuying ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Zap className="w-4 h-4 fill-white" />
              <span>Comprar via PIX</span>
            </>
          )}
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
                <h3 className="text-2xl font-black text-slate-900">Simulação de PIX Gerada!</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Você está testando a vitrine pública do Educalizando. Nas vendas reais, o split automático via Asaas enviará o pagamento instantâneo para a conta do criador.
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
