'use client';

import { supabase } from '@/lib/supabase';
import { CircleUserRound,Loader2 } from 'lucide-react';
import { useEffect,useState } from 'react';

type Participant = {
  key: string;
  name: string;
  email: string;
  avatar?: string | null;
  requests: number;
  lastTitle: string;
};

export default function ExclusiveParticipantDirectory() {
  const [items, setItems] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/exclusive-material?view=creator', {
        credentials: 'include',
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      const data = await response.json();
      const grouped = new Map<string, Participant>();

      for (const request of data.requests || []) {
        const key = request.customer_id || request.customer_email || request.id;
        const current = grouped.get(key);
        grouped.set(key, {
          key,
          name: request.customer_name || current?.name || 'Cliente Educalizando',
          email: request.customer_email || current?.email || 'Conta identificada',
          avatar: request.customer_avatar_url || current?.avatar,
          requests: (current?.requests || 0) + 1,
          lastTitle: current?.lastTitle || request.title,
        });
      }
      setItems(Array.from(grouped.values()).slice(0, 6));
      setLoading(false);
    }
    void load();
  }, []);

  if (loading) return <div className="mb-5 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Carregando solicitantes…</div>;
  if (!items.length) return null;

  return <section className="mb-5 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-widest text-blue-600">Solicitantes identificados</p><h2 className="mt-1 text-lg font-black text-slate-950">Clientes com conta verificada</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <div key={item.key} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">{item.avatar ? <img src={item.avatar} alt={`Foto de ${item.name}`} className="h-10 w-10 rounded-full object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400"><CircleUserRound className="h-5 w-5" /></div>}<div className="min-w-0"><p className="truncate text-sm font-black text-slate-900">{item.name}</p><p className="truncate text-xs text-slate-500">{item.email}</p><p className="mt-1 truncate text-[11px] font-bold text-blue-700">{item.requests} {item.requests === 1 ? 'pedido' : 'pedidos'} · último: {item.lastTitle}</p></div></div>)}</div></section>;
}
