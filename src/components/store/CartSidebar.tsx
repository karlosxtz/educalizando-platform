'use client';

import { useCart } from './CartContext';
import { X, ShoppingBag, Trash2, ArrowRight, Gift, Check } from 'lucide-react';
import Link from 'next/link';
import type { Store } from '@/lib/types';
import { getStorePromotion } from '@/lib/store-promotion';

interface CartSidebarProps {
  storeSlug?: string;
  store?: Store;
}

export default function CartSidebar({ storeSlug, store }: CartSidebarProps = {}) {
  const { items, isOpen, setIsOpen, total, removeFromCart } = useCart();
  const promotion = getStorePromotion(store, total);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9998] transition-opacity duration-300" 
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar Panel */}
      <div className="fixed inset-y-0 right-0 z-[9999] w-full max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 safe-padding-top">
          <div className="flex items-center gap-2 text-slate-900">
            <ShoppingBag className="w-5 h-5" />
            <h2 className="text-lg font-bold">Seu Carrinho</h2>
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full ml-1">
              {items.length}
            </span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="min-h-11 min-w-11 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-label="Fechar carrinho"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-3 px-4 text-center text-slate-400">
              <ShoppingBag className="h-12 w-12 opacity-20" aria-hidden="true" />
              <p className="font-bold text-slate-700">Seu carrinho está vazio</p>
              <p className="max-w-xs text-sm leading-relaxed text-slate-500">Adicione materiais para revisá-los antes de finalizar a compra.</p>
              <button 
                onClick={() => setIsOpen(false)}
                className="min-h-11 rounded-xl px-3 text-sm font-bold text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 sm:gap-4">
                  {/* Thumbnail Placeholder if no image */}
                  <div className="w-20 h-20 bg-slate-100 rounded-xl border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-tight">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 capitalize bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.type}
                        </span>
                        {item.isPlr && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded uppercase">
                            PLR
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-black text-slate-900 text-sm">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                      </span>
                      
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100"
                        aria-label={`Remover ${item.title} do carrinho`}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 safe-padding-bottom">
            {promotion.enabled && (
              <div className={`mb-4 rounded-2xl border p-3 ${promotion.qualified ? 'border-emerald-200 bg-emerald-50' : 'border-blue-200 bg-blue-50'}`}>
                <div className="flex items-start gap-2.5">
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${promotion.qualified ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>
                    {promotion.qualified ? <Check className="h-4 w-4" /> : <Gift className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-black ${promotion.qualified ? 'text-emerald-900' : 'text-blue-950'}`}>
                      {promotion.qualified ? `${promotion.percentage}% de desconto liberado!` : `Faltam R$ ${promotion.amountRemaining.toFixed(2).replace('.', ',')} para ganhar ${promotion.percentage}% OFF`}
                    </p>
                    <p className={`mt-0.5 text-[11px] font-medium ${promotion.qualified ? 'text-emerald-700' : 'text-blue-700'}`}>Oferta válida apenas para materiais desta loja.</p>
                  </div>
                </div>
                {!promotion.qualified && <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-blue-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${Math.min(100, (total / promotion.minimum) * 100)}%` }} /></div>}
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-500 font-medium">Subtotal</span>
              <span className="text-xl font-black text-slate-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
              </span>
            </div>
            <p className="text-xs text-slate-500 text-center mb-4">
              Taxas ou cupons serão calculados no próximo passo.
            </p>
            <Link 
              href={storeSlug ? `/loja/${storeSlug}/checkout` : '/carrinho'}
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
            >
              {storeSlug ? 'Finalizar Compra' : 'Ver Carrinho'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
