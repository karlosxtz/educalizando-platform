'use client';

// =============================================================================
// EDUCALIZANDO — CART SERVICE
// Serviço de carrinho persistente baseado em LocalStorage.
// =============================================================================

export interface CartItem {
  id: string;              // Um id único (ex: productId)
  productId: string;       // Referência ao produto real
  storeId: string;         // Loja a qual o produto pertence
  title: string;           // Nome do produto
  price: number;           // Preço no momento da adição
  quantity: number;        // Quantidade (default: 1)
  isPlr: boolean;          // Se é compra de licença PLR
  imageUrl?: string;       // Capa do produto para a UI
  type: string;            // Tipo (video, pdf, kit, etc)
}

const CART_STORAGE_KEY = '@educalizando:cart';

// 1. LER CARRINHO
export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(CART_STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as CartItem[];
  } catch (err) {
    console.error('[CartService] Erro ao ler carrinho:', err);
    return [];
  }
}

// 2. SALVAR CARRINHO
export function saveCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    // Dispara evento global para abas / componentes sincronizarem
    window.dispatchEvent(new Event('cart_updated'));
  } catch (err) {
    console.error('[CartService] Erro ao salvar carrinho:', err);
  }
}

// 3. ADICIONAR ITEM
export function addToCart(item: Omit<CartItem, 'id' | 'quantity'> & { quantity?: number }): void {
  const cart = getCart();
  const id = item.productId + (item.isPlr ? '_plr' : '');
  
  const existingIndex = cart.findIndex(i => i.id === id);
  if (existingIndex >= 0) {
    // Se o item já existe, atualiza a quantidade (limitado a 10)
    cart[existingIndex].quantity = Math.min(10, cart[existingIndex].quantity + (item.quantity || 1));
  } else {
    // Adiciona novo item
    cart.push({
      ...item,
      id,
      quantity: item.quantity || 1
    });
  }
  saveCart(cart);
}

// 4. REMOVER ITEM
export function removeFromCart(id: string): void {
  const cart = getCart();
  const newCart = cart.filter(item => item.id !== id);
  saveCart(newCart);
}

// 5. ATUALIZAR QUANTIDADE
export function updateQuantity(id: string, quantity: number): void {
  if (quantity < 1) {
    removeFromCart(id);
    return;
  }
  const cart = getCart();
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.quantity = Math.min(10, quantity);
    saveCart(cart);
  }
}

// 6. LIMPAR CARRINHO
export function clearCart(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CART_STORAGE_KEY);
  window.dispatchEvent(new Event('cart_updated'));
}

// 7. CALCULAR SUBTOTAL
export function getCartTotal(items: CartItem[]): number {
  return items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
}

// 8. FILTRAR POR LOJA
export function getCartByStore(storeId: string): CartItem[] {
  return getCart().filter(item => item.storeId === storeId);
}
