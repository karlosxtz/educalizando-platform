'use client';

import { useCart } from './CartContext';
import { ShoppingBag } from 'lucide-react';

export default function CartWidget() {
  const { itemCount, toggleCart } = useCart();

  if (itemCount === 0) return null;

  return (
    <button
      onClick={toggleCart}
      className="fixed bottom-24 sm:bottom-6 left-4 sm:left-6 z-40 bg-slate-900 text-white rounded-full p-4 shadow-2xl hover:scale-105 active:scale-95 transition-transform flex items-center justify-center min-w-[56px] min-h-[56px]"
      aria-label="Abrir carrinho"
    >
      <div className="relative">
        <ShoppingBag className="w-6 h-6" />
        <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900">
          {itemCount}
        </span>
      </div>
    </button>
  );
}
