'use client';
import { useEffect, useState } from 'react';
import { Loader2, Power } from 'lucide-react';
export default function ExclusiveRequestsSetting() {
  const [enabled, setEnabled] = useState(false); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  useEffect(() => { fetch('/api/exclusive-material/settings').then(async response => { const data = await response.json(); if (response.ok) setEnabled(Boolean(data.enabled)); }).finally(() => setLoading(false)); }, []);
  const change = async () => { const next = !enabled; setSaving(true); const response = await fetch('/api/exclusive-material/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: next }) }); if (response.ok) setEnabled(next); setSaving(false); };
  return <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-slate-950">Aceitar solicitações de materiais exclusivos</p><p className="mt-1 text-sm text-slate-600">Quando ativado, o botão aparecerá na sua loja pública. Você pode desativar quando não quiser receber novos pedidos.</p></div><button type="button" disabled={loading || saving} onClick={change} className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black text-white disabled:opacity-60 ${enabled ? 'bg-emerald-600' : 'bg-slate-600'}`}>{loading || saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Power className="h-4 w-4"/>}{enabled ? 'Solicitações ativas' : 'Ativar solicitações'}</button></div>;
}
