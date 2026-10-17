'use client';
import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCart } from './CartContext';
import { saveStoreRecovery, finishStoreRecovery } from '@/lib/store-recovery-client';
export default function StoreCartTracker({ storeId, storeSlug }: { storeId: string; storeSlug: string }) {
  const { items } = useCart(), pathname = usePathname(), params = useSearchParams();
  const hadItems = useRef(false), last = useRef('');
  const snapshot = JSON.stringify(items.filter(item => item.storeId === storeId && item.origin === 'store').map(item => ({ productId: item.productId, quantity: item.quantity, isPlr: item.isPlr })));
  const blocked = params.get('origem') === 'marketplace' || pathname.includes('/checkout');
  useEffect(() => {
    if (blocked || snapshot === last.current || (snapshot === '[]' && !hadItems.current)) return;
    const flush = () => {
      if (last.current === snapshot) return;
      last.current = snapshot; hadItems.current = snapshot !== '[]';
      void saveStoreRecovery({ storeId, storeSlug, stage: 'cart', items: JSON.parse(snapshot) }).then(response => { if (response?.ok && snapshot === '[]') finishStoreRecovery(storeId); }).catch(() => {});
    };
    const timer = setTimeout(flush, 700);
    window.addEventListener('pagehide', flush);
    return () => { clearTimeout(timer); window.removeEventListener('pagehide', flush); };
  }, [snapshot, blocked, storeId, storeSlug]);
  return null;
}
