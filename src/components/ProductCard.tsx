'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Rocket, Gift, Store as StoreIcon, ShoppingBag, Zap } from 'lucide-react';
import { Product, Store } from '@/lib/types';
import { useCart } from '@/components/store/CartContext';

export default function ProductCard({ product }: { product: Product & { store?: Store } }) {
  const router = useRouter();
  const { addToCart } = useCart();

  const itemTitle = product.titulo || 'Material Didático';
  const itemCover = product.capa_url || null;
  const storeName = product.store?.nome_loja || 'Loja Parceira';
  const isFree = product.is_free || product.preco === 0;
  
  // Format price
  let priceDisplay = 'Grátis';
  if (!isFree && product.preco) {
    priceDisplay = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco);
  }

  // Target link
  const storeSlug = product.store?.slug || product.store_id;
  const productLink = `/loja/${storeSlug}/produto/${product.id}`;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      productId: product.id,
      title: product.titulo,
      price: product.preco,
      isPlr: !!product.is_plr,
      storeId: product.store_id,
      type: product.tipo,
      imageUrl: product.capa_url || undefined,
      quantity: 1
    });
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      productId: product.id,
      title: product.titulo,
      price: product.preco,
      isPlr: !!product.is_plr,
      storeId: product.store_id,
      type: product.tipo,
      imageUrl: product.capa_url || undefined,
      quantity: 1
    });
    router.push(`/loja/${storeSlug}/checkout`);
  };

  return (
    <div className="group bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_10px_40px_rgb(0,0,0,0.06)] transition-all duration-300 flex flex-col h-full hover:-translate-y-1">
      {/* Imagem (Capa) */}
      <Link href={productLink} className="aspect-[4/3] sm:aspect-square w-full bg-slate-100 relative overflow-hidden block">
        {itemCover ? (
          <img src={itemCover} alt={itemTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
            <BookOpen className="w-12 h-12" />
          </div>
        )}
        {/* Badge PLR ou Grátis */}
        {product.is_plr && (
          <div className="absolute top-3 left-3 bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-md flex items-center gap-1">
            <Rocket className="w-3 h-3" /> Revenda
          </div>
        )}
        {!product.is_plr && isFree && (
          <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-md flex items-center gap-1">
            <Gift className="w-3 h-3" /> Grátis
          </div>
        )}
      </Link>

      {/* Corpo do Card */}
      <div className="p-5 flex flex-col flex-1">
        <Link href={productLink} className="block flex-1">
          <h3 className="font-bold text-slate-900 text-base line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors mb-1">
            {itemTitle}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1.5 mb-4">
            <StoreIcon className="w-3.5 h-3.5" />
            <span className="truncate">{storeName}</span>
          </p>
        </Link>

        {/* Preço e Botão */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className={`text-lg font-black ${isFree ? 'text-emerald-600' : 'text-slate-900'}`}>
              {priceDisplay}
            </span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleAdd}
              className="flex-1 bg-slate-100 text-slate-700 p-2 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 active:scale-95"
              title="Adicionar ao Carrinho"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
            <button 
              onClick={handleBuy}
              className="flex-[2] bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Zap className="w-4 h-4 fill-transparent" />
              Comprar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
