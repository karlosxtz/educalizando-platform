'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  CartItem,
  getCart,
  getCartByStore,
  addToCart as _addToCart,
  removeFromCart as _removeFromCart,
  updateQuantity as _updateQuantity,
  clearCart as _clearCart,
  getCartTotal
} from '@/lib/cart-service';

interface CartContextType {
  items: CartItem[];
  total: number;
  itemCount: number;
  isOpen: boolean;
  storeId?: string;
  setIsOpen: (isOpen: boolean) => void;
  toggleCart: () => void;
  addToCart: (item: Omit<CartItem, 'id' | 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children, storeId }: { children: ReactNode; storeId?: string }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Sincroniza o estado do React com o LocalStorage
  const syncCart = () => {
    if (storeId) {
      setItems(getCartByStore(storeId));
    } else {
      setItems(getCart());
    }
  };

  useEffect(() => {
    // Sincronização inicial
    syncCart();



    // Event listener customizado para outras abas / componentes
    const handleStorageChange = () => syncCart();
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cart_updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cart_updated', handleStorageChange);
    };
  }, [storeId]);

  const addToCart = (item: Omit<CartItem, 'id' | 'quantity'> & { quantity?: number }) => {
    _addToCart(item);
    syncCart();
    setIsOpen(true); // Abre a sidebar ao adicionar
  };

  const removeFromCart = (id: string) => {
    _removeFromCart(id);
    syncCart();
  };

  const updateQuantity = (id: string, quantity: number) => {
    _updateQuantity(id, quantity);
    syncCart();
  };

  const clearCart = () => {
    if (storeId) {
      // Remover todos os itens DESTA loja
      const currentStoreItems = getCartByStore(storeId);
      currentStoreItems.forEach(item => _removeFromCart(item.id));
    } else {
      // Limpa tudo (modo global)
      _clearCart();
    }
    syncCart();
  };

  const toggleCart = () => setIsOpen(prev => !prev);

  const total = getCartTotal(items);
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        itemCount,
        isOpen,
        storeId,
        setIsOpen,
        toggleCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
