'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Trash2, ArrowRight, Store as StoreIcon, AlertCircle } from 'lucide-react';
import { useCart } from '@/components/store/CartContext';
import { supabase } from '@/lib/supabase';
import { CartItem } from '@/lib/cart-service';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart } = useCart();
  const router = useRouter();

  const [storeMap, setStoreMap] = useState<Record<string, { nome_loja: string; slug: string }>>({});
  const [loadingStores, setLoadingStores] = useState(true);

  // Agrupa os itens por storeId
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.storeId]) {
      acc[item.storeId] = [];
    }
    acc[item.storeId].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);

  const storeIds = Object.keys(groupedItems);

  useEffect(() => {
    async function fetchStores() {
      if (storeIds.length === 0) {
        setLoadingStores(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('stores')
          .select('id, nome_loja, slug')
          .in('id', storeIds);

        if (data && !error) {
          const map: Record<string, { nome_loja: string; slug: string }> = {};
          data.forEach(store => {
            map[store.id] = { nome_loja: store.nome_loja, slug: store.slug };
          });
          setStoreMap(map);
        }
      } catch (err) {
        console.error('Erro ao buscar lojas do carrinho:', err);
      } finally {
        setLoadingStores(false);
      }
    }

    fetchStores();
  }, [storeIds.join(',')]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 flex flex-col items-center justify-center font-sans">
        <div className="w-24 h-24 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mb-6">
          <ShoppingCart className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Seu carrinho está vazio</h1>
        <p className="text-slate-500 mb-8 max-w-md text-center">
          Explore o marketplace e encontre materiais didáticos incríveis para adicionar ao seu carrinho.
        </p>
        <Link href="/" className="bg-blue-600 text-white font-bold px-8 py-3 rounded-full hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
          Voltar para as compras
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Carrinho de Compras</h1>
            <p className="text-slate-500 mt-1">Seus itens estão agrupados por loja parceira.</p>
          </div>
          <button 
            onClick={clearCart}
            className="text-sm font-medium text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Esvaziar Carrinho
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 leading-relaxed">
            <strong>Como funciona o checkout?</strong> O Educalizando utiliza checkouts blindados individuais por produtor. 
            Clique em "Finalizar Compra" no bloco da loja para prosseguir com o pagamento daquele pedido de forma segura.
          </div>
        </div>

        {loadingStores ? (
          <div className="text-center py-12 text-slate-400 font-medium animate-pulse">
            Organizando seu carrinho...
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedItems).map(([storeId, storeItems]) => {
              const storeData = storeMap[storeId];
              const storeName = storeData?.nome_loja || 'Loja Desconhecida';
              const storeSlug = storeData?.slug;
              
              const productCount = storeItems.reduce((acc, item) => acc + item.quantity, 0);
              const subtotal = storeItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
              const platformFee = productCount * 0.99;
              const total = subtotal; // Total paid by buyer is subtotal. Platform fee is deducted from creator.

              return (
                <div key={storeId} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  {/* Cabeçalho da Loja */}
                  <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StoreIcon className="w-5 h-5 text-slate-500" />
                      <h2 className="font-bold text-slate-800 text-lg">{storeName}</h2>
                    </div>
                  </div>

                  {/* Itens da Loja */}
                  <div className="divide-y divide-slate-100">
                    {storeItems.map((item) => (
                      <div key={item.id} className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                        <img 
                          src={item.imageUrl || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200&auto=format&fit=crop&q=80'} 
                          alt={item.title} 
                          className="w-24 h-24 object-cover rounded-xl border border-slate-100 bg-slate-50"
                        />
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-800 mb-1 leading-snug">{item.isPlr ? `${item.title} (Licença PLR)` : item.title}</h3>
                          <p className="text-blue-600 font-black text-lg mb-3">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                          </p>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="px-3 py-1 text-slate-500 hover:text-slate-800 font-bold"
                              >-</button>
                              <span className="px-3 font-semibold text-slate-800 w-8 text-center">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="px-3 py-1 text-slate-500 hover:text-slate-800 font-bold"
                              >+</button>
                            </div>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="text-sm text-slate-400 hover:text-rose-500 font-medium transition-colors"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                        <div className="hidden sm:block text-right">
                          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Subtotal Item</p>
                          <p className="font-bold text-slate-800 text-lg">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Resumo e Checkout da Loja */}
                  <div className="bg-slate-50 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-200">
                    <div>
                      <p className="text-sm text-slate-500 font-medium mb-1">
                        Resumo do Pedido ({productCount} {productCount === 1 ? 'item' : 'itens'})
                      </p>
                      <div className="flex items-end gap-3">
                        <p className="text-2xl font-black text-slate-900">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                        </p>
                      </div>
                    </div>

                    {storeSlug ? (
                      <Link 
                        href={`/loja/${storeSlug}/checkout`}
                        className="w-full sm:w-auto bg-blue-600 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 group"
                      >
                        Finalizar Compra da Loja
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    ) : (
                      <button disabled className="w-full sm:w-auto bg-slate-300 text-white font-bold px-8 py-3.5 rounded-xl cursor-not-allowed">
                        Loja Indisponível
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
