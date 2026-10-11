'use client';

import { useState } from 'react';
import { resetPasswordForEmail } from '@/lib/supabase';

export default function PasswordRecovery() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  return <details className="rounded-xl border border-blue-100 bg-blue-50 p-4">
    <summary className="cursor-pointer text-sm font-bold text-blue-700">Esqueci minha senha</summary>
    <form className="mt-4 space-y-3" onSubmit={async event => {
      event.preventDefault(); setBusy(true); setMessage('');
      try {
        await resetPasswordForEmail(email.trim());
        setMessage('Se houver uma conta com esse e-mail, você receberá um link para criar uma nova senha. Confira também o spam.');
      } catch { setMessage('Não foi possível enviar agora. Tente novamente em alguns instantes.'); }
      finally { setBusy(false); }
    }}>
      <p className="text-sm text-slate-600">Informe o e-mail da sua conta para receber o link de recuperação.</p>
      <label className="block text-sm font-semibold text-slate-700">E-mail para recuperar a senha
        <input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white p-3" />
      </label>
      <button type="submit" disabled={busy} className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Enviando…' : 'Enviar link de recuperação'}</button>
      <p role="status" aria-live="polite" className="text-sm text-slate-700">{message}</p>
    </form>
  </details>;
}
