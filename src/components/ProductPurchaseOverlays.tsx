'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, ShoppingBag, UserCheck, UserX, X, Zap } from 'lucide-react';
import Link from 'next/link';
import type { RefObject } from 'react';
import type { Product, Store } from '@/lib/types';

type CreatorBlockProps = {
  showCreatorBlockModal: boolean;
  setShowCreatorBlockModal: (open: boolean) => void;
  creatorBlockCloseButton: RefObject<HTMLButtonElement | null>;
  store: Store;
  product: Product;
  context: 'store' | 'marketplace';
};
type PurchaseBarProps = {
  originalPrice: number | null;
  isFreeProduct: boolean;
  currentPrice: number;
  purchaseError: string | null;
  handleAddOnly: () => void;
  isBuying: boolean;
  handleStartCheckout: () => void;
  primaryColor: string;
};

export function ProductCreatorBlockModal({ showCreatorBlockModal, setShowCreatorBlockModal, creatorBlockCloseButton, store, product, context }: CreatorBlockProps) { return <>
      {/* MODAL DE BLOQUEIO PARA CRIADOR (Item 11 da Especificação) */}
      <AnimatePresence>
        {showCreatorBlockModal && (
          <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" role="presentation">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-8 text-center space-y-5 shadow-2xl relative font-sans"
              role="dialog"
              aria-modal="true"
              aria-labelledby="creator-block-title"
            >
              <button 
                ref={creatorBlockCloseButton}
                type="button"
                onClick={() => setShowCreatorBlockModal(false)}
                aria-label="Fechar aviso"
                className="absolute right-4 top-4 rounded-md p-2 text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
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
                <h3 id="creator-block-title" className="text-xl font-black text-slate-900">Você está conectado como Criador</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Esta conta é utilizada para vender materiais na Educalizando. Para comprar e acessar materiais didáticos, utilize uma <strong>conta de Cliente</strong>.
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <Link
                  href={`/cliente/login?returnTo=${encodeURIComponent(`/loja/${store.slug}/checkout?produtoId=${product.id}${context === 'marketplace' ? '&origem=marketplace' : ''}`)}&action=buy`}
                  className="w-full py-3.5 rounded-2xl bg-brand-navy hover:bg-brand-navy-hover text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" /> Entrar com Conta de Cliente
                </Link>

                <Link
                  href={`/cliente/cadastro?returnTo=${encodeURIComponent(`/loja/${store.slug}/checkout?produtoId=${product.id}${context === 'marketplace' ? '&origem=marketplace' : ''}`)}&action=buy`}
                  className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2"
                >
                  Criar Conta de Cliente Gratuitamente
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


</>; }

export function ProductMobilePurchaseBar({ originalPrice, isFreeProduct, currentPrice, purchaseError, handleAddOnly, isBuying, handleStartCheckout, primaryColor }: PurchaseBarProps) { return <>
      {/* Sticky Bottom Bar for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-10px_20px_rgba(0,0,0,0.08)] px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] z-[60] flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Investimento</span>
          {originalPrice && <span className="block text-xs font-bold text-slate-400 line-through">R$ {originalPrice.toFixed(2).replace('.', ',')}</span>}
          <span className={`text-xl sm:text-2xl font-black tracking-tight ${isFreeProduct ? 'text-emerald-600' : 'text-slate-900'}`}>{isFreeProduct ? 'Grátis' : `R$ ${currentPrice.toFixed(2).replace('.', ',')}`}</span>
        </div>
        {purchaseError && <p className="absolute bottom-full left-3 right-3 mb-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 shadow-lg" role="alert">{purchaseError}</p>}
        <div className="flex flex-1 gap-2">
          <button
            type="button"
            onClick={handleAddOnly}
            disabled={isBuying}
            className="flex-1 py-3 px-2 rounded-xl font-black text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="tracking-wide leading-tight text-center">{isFreeProduct ? 'Resgatar' : 'Adicionar'}</span>
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
                <span className="tracking-wide leading-tight text-center">{isFreeProduct ? 'Liberar Grátis' : 'Comprar Agora'}</span>
              </>
            )}
          </button>
        </div>
      </div>
</>; }
