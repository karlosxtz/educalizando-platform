'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCart, saveCart, type CartItem } from '@/lib/cart-service';
import { setRecoveryParent } from '@/lib/store-recovery-client';
import { readApiJson } from '@/lib/api-response';
type Recovery = { store: { id: string; slug: string; nome_loja: string }; items: (CartItem & { kind: string })[]; total: number };
export default function ResumePurchase() {
  const { token } = useParams<{ token: string }>(), router = useRouter();
  const [cart, setCart] = useState<Recovery | null>(null), [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { const controller = new AbortController(); void fetch('/api/store-carts/recover?token=' + encodeURIComponent(token), { signal: controller.signal, cache: 'no-store' }).then(async response => { const data = await readApiJson(response); if (!response.ok) throw new Error(data.error); setCart(data); }).catch(cause => { if (!controller.signal.aborted) setError(cause.message || 'Não foi possível retomar este carrinho.'); }); return () => controller.abort(); }, [token]);
  function resume() {
    if (!cart || busy) return; setBusy(true);
    setRecoveryParent(cart.store.id, token);
    if (cart.items[0]?.kind === 'kit') router.push(`/loja/${encodeURIComponent(cart.store.slug)}/checkout?kitId=${encodeURIComponent(cart.items[0].productId)}`);
    else { saveCart([...getCart().filter(item => item.storeId !== cart.store.id), ...cart.items]); router.push(`/loja/${encodeURIComponent(cart.store.slug)}/checkout`); }
  }
  async function unsubscribe() {
    setBusy(true); setNotice('');
    try { const response = await fetch('/api/store-carts/recover', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, action: 'unsubscribe' }) }); const data = await readApiJson(response); if (!response.ok) throw new Error(data.error); setNotice('Autorização cancelada. A loja não poderá preparar novos lembretes para este carrinho.'); }
    catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Tente novamente.'); } finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-slate-50 px-4 py-12"><section className="mx-auto max-w-xl space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9"><p className="text-sm font-bold text-blue-700">Educalizando · Retomar compra</p><h1 className="text-2xl font-bold text-slate-950">{cart ? `Seu carrinho na ${cart.store.nome_loja}` : 'Vamos conferir seu carrinho'}</h1>{error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}{!cart && !error && <p role="status">Conferindo os materiais e preços atuais…</p>}{cart && <><ul className="divide-y divide-slate-100">{cart.items.map(item => <li key={item.id} className="py-4"><p className="font-semibold">{item.title}{item.isPlr ? ' · Licença PLR' : ''}</p><p className="mt-1 text-sm text-slate-500">{item.quantity} × {item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></li>)}</ul><p className="text-xl font-bold">Subtotal: {cart.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p><p className="text-sm leading-6 text-slate-500">Você poderá conferir descontos, valor final e forma de pagamento no checkout. Retomar não realiza nenhuma cobrança.</p><button disabled={busy} type="button" onClick={resume} className="w-full rounded-xl bg-blue-700 px-5 py-4 font-bold text-white disabled:opacity-50">Retomar na loja</button></>}{notice && <p role="status" className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900">{notice}</p>}<button type="button" disabled={busy} onClick={() => void unsubscribe()} className="text-sm text-slate-500 underline disabled:opacity-50">Cancelar autorização de lembrete</button></section></main>;
}
