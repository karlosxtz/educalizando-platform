'use client';
import { useEffect, useRef } from 'react';
import { saveStoreRecovery, recoveryBrowserToken, type RecoveryInputItem } from '@/lib/store-recovery-client';
import type { CartItem } from '@/lib/cart-service';
type Props = { storeId: string; storeSlug: string; marketplace: boolean; productId?: string; kitId?: string; isPlr: boolean; cartItems: CartItem[]; bumpId?: string; consent: boolean; phone: string; name: string };
export function useCheckoutRecovery(props: Props) {
  const hadItems = useRef(false);
  const { storeId, storeSlug, marketplace, consent, phone, name } = props;
  const items: RecoveryInputItem[] = props.productId ? [{ productId: props.productId, quantity: 1, isPlr: props.isPlr }, ...(props.bumpId ? [{ productId: props.bumpId, quantity: 1, isPlr: false }] : [])]
    : props.kitId ? [{ productId: props.kitId, quantity: 1, kind: 'kit' }] : props.cartItems.filter(item => item.origin === 'store').map(item => ({ productId: item.productId, quantity: item.quantity, isPlr: item.isPlr }));
  const snapshot = JSON.stringify(items);
  const contact = JSON.stringify(consent ? { consent: true, phone, name } : { consent: false });
  async function flush() {
    if (marketplace || !items.length) return;
    const detail = consent && phone.replace(/\D/g, '').length < 10 ? undefined : JSON.parse(contact);
    try { await Promise.race([saveStoreRecovery({ storeId, storeSlug, stage: 'checkout', items, ...detail }), new Promise(resolve => setTimeout(resolve, 2000))]); } catch { /* Recovery cannot block payment. */ }
  }
  useEffect(() => {
    if (marketplace || (snapshot === '[]' && !hadItems.current)) return;
    const detail = JSON.parse(contact);
    if (detail.consent && detail.phone.replace(/\D/g, '').length < 10) return;
    const timer = setTimeout(() => { hadItems.current = snapshot !== '[]'; void saveStoreRecovery({ storeId, storeSlug, stage: 'checkout', items: JSON.parse(snapshot), ...detail }).catch(() => {}); }, 800);
    return () => clearTimeout(timer);
  }, [storeId, storeSlug, marketplace, snapshot, contact]);
  return { flush, token: () => !marketplace && items.length ? recoveryBrowserToken(storeId) : null };
}
