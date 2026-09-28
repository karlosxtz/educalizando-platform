'use client';
import { useEffect, useState } from 'react';
import { CircleUserRound, Loader2 } from 'lucide-react';
export default function ExclusiveParticipantDirectory() {
  const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { fetch('/api/exclusive-material?view=creator').then(r => r.json()).then(data => setItems(data.requests || [])).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="mb-5 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin"/>Carregando solicitantes…</div>;
  if (!items.length) return null;
  return <section className="mb-5 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-widest text-blue-600">Solicitantes identificados</p><h2 className="mt-1 text-lg font-black text-slate-950">Clientes com conta verificada</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.slice(0, 6).map(item => <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">{item.customer_avatar_url ? <img src={item.customer_avatar_url} alt={`Foto de ${item.customer_name || 'cliente'}`} className="h-10 w-10 rounded-full object-cover"/> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400"><CircleUserRound className="h-5 w-5"/></div>}<div className="min-w-0"><p className="truncate text-sm font-black text-slate-900">{item.customer_name || 'Cliente Educalizando'}</p><p className="truncate text-xs text-slate-500">{item.customer_email || 'Conta identificada'}</p><p className="mt-1 truncate text-[11px] font-bold text-blue-700">{item.title}</p></div></div>)}</div></section>;
}
