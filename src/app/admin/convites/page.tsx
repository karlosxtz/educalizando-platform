'use client';
import { useState } from 'react';
import Link from 'next/link';
export default function InvitesPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  return <main className="mx-auto max-w-xl space-y-6 p-6"><Link href="/admin" className="text-blue-700">← Voltar ao painel</Link><h1 className="text-2xl font-bold">Convidar para a Educalizando</h1><form className="space-y-4" onSubmit={async e => {
    e.preventDefault(); const form = e.currentTarget; const fields = new FormData(form); setBusy(true); setMessage('');
    try { const response = await fetch('/api/admin/auth-invites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(fields)) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); form.reset(); setMessage('Convite enviado. A pessoa receberá um link para acessar sua conta.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível enviar o convite.'); } finally { setBusy(false); }
  }}><label className="block">Nome<input required name="name" minLength={2} maxLength={120} className="block w-full rounded-lg border p-3" /></label><label className="block">E-mail<input required name="email" type="email" className="block w-full rounded-lg border p-3" /></label><label className="block">Tipo de conta<select name="role" className="block w-full rounded-lg border p-3"><option value="student">Comprador</option><option value="creator">Criador</option></select></label><label className="block">Nome da loja (para criadores)<input name="storeName" maxLength={120} className="block w-full rounded-lg border p-3" /></label><button disabled={busy} className="rounded-lg bg-blue-700 px-5 py-3 text-white disabled:opacity-50">{busy ? 'Enviando…' : 'Enviar convite'}</button><p role="status">{message}</p></form></main>;
}
