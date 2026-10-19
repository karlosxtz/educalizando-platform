'use client';
import { Bell, Check, Loader2, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { customerApi } from '@/lib/customer-api';
import Link from 'next/link';

export default function StoreFollowControl({ storeId, storeName }: { storeId: string; storeName: string }) {
  const [state, setState] = useState({ following: false, notifications: false });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const path = usePathname(); const router = useRouter();
  useEffect(() => {
    let alive = true; let generation = 0;
    const load = async () => {
      const version = ++generation;
      setState({ following: false, notifications: false }); setError('');
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) return;
        const result = await customerApi(`/api/customer/followed-stores?storeId=${encodeURIComponent(storeId)}`);
        if (alive && version === generation) setState({ following: result.following, notifications: result.notifications });
      } catch { if (alive && version === generation) setError('Não foi possível consultar suas lojas seguidas.'); }
    };
    void load();
    const { data: subscription } = supabase.auth.onAuthStateChange(() => { generation++; queueMicrotask(() => { if (alive) void load(); }); });
    return () => { alive = false; generation++; subscription.subscription.unsubscribe(); };
  }, [storeId]);
  async function save(following: boolean, notifications: boolean) {
    if (pending) return;
    setPending(true); setError('');
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.push(`/cliente/login?returnTo=${encodeURIComponent((path || '/lojas') + window.location.search)}`); return; }
      const result = await customerApi('/api/customer/followed-stores', { method: 'POST', body: JSON.stringify({ storeId, following, notifications }) });
      setState({ following: result.following, notifications: result.notifications });
      window.dispatchEvent(new Event('educalizando:follow-change'));
    } catch (err) { setError(err instanceof Error ? err.message : 'Tente novamente em instantes.'); }
    finally { setPending(false); }
  }
  return <div className="min-w-0 space-y-2 text-sm">
    <button type="button" disabled={pending} aria-pressed={state.following} onClick={() => void save(!state.following, false)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-blue-200 bg-white px-4 font-bold text-blue-900 shadow-sm hover:bg-blue-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-blue-700">
      {pending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : state.following ? <Check aria-hidden="true" className="h-4 w-4" /> : <Store aria-hidden="true" className="h-4 w-4" />}{state.following ? 'Seguindo loja' : 'Seguir loja'}<span className="sr-only"> {storeName}</span>
    </button>
    {state.following && <div className="space-y-2"><label className="flex min-h-11 cursor-pointer items-center gap-2 text-xs leading-5 text-slate-700"><input type="checkbox" checked={state.notifications} disabled={pending} onChange={event => void save(true, event.target.checked)} className="h-4 w-4 shrink-0 accent-blue-700" /><Bell aria-hidden="true" className="h-4 w-4 shrink-0" />Mostrar novos materiais desta loja na minha área</label><Link href="/cliente/favoritos#lojas-seguidas" className="inline-flex min-h-9 items-center text-xs font-bold text-blue-800 underline">Minhas lojas e novidades</Link></div>}
    {error && <p role="alert" className="text-xs leading-5 text-rose-700">{error}</p>}
  </div>;
}
