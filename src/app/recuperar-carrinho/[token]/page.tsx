'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { saveCart } from '@/lib/cart-service';

export default function RecoverCartPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [message, setMessage] = useState('Recuperando seu carrinho…');
  useEffect(() => {
    async function recover() {
      const response = await fetch(`/api/remarketing/abandoned-cart?token=${encodeURIComponent(params.token)}`);
      const data = await response.json();
      if (!response.ok) { setMessage(data.error || 'Este carrinho não está disponível.'); return; }
      saveCart(data.cart.cart_items.map((item: any) => ({ id: item.productId, productId: item.productId, storeId: data.cart.store_id, title: item.title, price: item.price, quantity: item.quantity, isPlr: false, type: 'material' })));
      router.replace(`/loja/${data.cart.store_slug}/checkout`);
    }
    void recover();
  }, [params.token, router]);
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center"><p className="text-sm font-bold text-slate-700">{message}</p></main>;
}
