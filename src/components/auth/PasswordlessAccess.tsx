'use client';
import { useEffect, useState } from 'react';
import { authCapabilities } from '@/lib/auth-capabilities';
import { supabase } from '@/lib/supabase';
import { syncAuthSession } from '@/lib/auth-session';
import { safeAuthDestination } from '@/lib/auth-navigation';
import { ChevronDown, Mail } from 'lucide-react';

export default function PasswordlessAccess({ destination = '/entrar' }: { destination?: string }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<'login' | 'confirmation'>('login');
  const [google, setGoogle] = useState(false);
  useEffect(() => { void authCapabilities().then(settings => setGoogle(settings.google)); }, []);
  async function send() {
    setBusy(true); setMessage('');
    try {
      const redirect = new URL('/auth/confirmar', window.location.origin);
      redirect.searchParams.set('next', safeAuthDestination(destination));
      const result = mode === 'confirmation'
        ? await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirect.toString() } })
        : await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: redirect.toString() } });
      if (result.error) throw result.error;
      setSent(true); setMessage('Se a conta estiver disponível, você receberá um e-mail. Confira também o spam.');
    } catch { setMessage('Não foi possível enviar agora. Confira o e-mail e tente novamente em alguns instantes.'); }
    finally { setBusy(false); }
  }
  async function verify() {
    setBusy(true); setMessage('');
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: mode === 'confirmation' ? 'signup' : 'email' });
      if (error) throw error;
      const session = await syncAuthSession();
      const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assurance.error) throw assurance.error;
      if (assurance.data.nextLevel === 'aal2' && assurance.data.currentLevel !== 'aal2') {
        window.location.assign(`/seguranca?next=${encodeURIComponent(safeAuthDestination(destination))}`);
        return;
      }
      const response = await fetch('/api/auth/complete', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } });
      if (!response.ok) throw new Error('Não foi possível concluir seu cadastro.');
      window.location.assign(safeAuthDestination(destination));
    } catch { setMessage('Código inválido ou vencido. Solicite um novo e-mail.'); }
    finally { setBusy(false); }
  }
  return <details className="group rounded-2xl border border-slate-100 bg-slate-50/70 transition open:border-blue-100 open:bg-white">
    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-semibold text-slate-600 transition hover:text-blue-800 [&::-webkit-details-marker]:hidden"><span className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" />Outras formas de acessar</span><ChevronDown className="h-4 w-4 transition group-open:rotate-180" /></summary>
    <div className="space-y-3 border-t border-slate-100 p-4">
      {google && mode === 'login' && <button type="button" className="rounded-lg border px-4 py-3 text-blue-700 disabled:opacity-50" disabled={busy} onClick={async () => {
        setBusy(true); setMessage('');
        const redirect = new URL('/auth/confirmar', window.location.origin); redirect.searchParams.set('next', safeAuthDestination(destination));
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirect.toString() } });
        if (error) { setMessage('O acesso com Google não está disponível agora. Use o e-mail para continuar.'); setBusy(false); }
      }}>Entrar com Google</button>}
      <label className="block text-sm">O que deseja fazer?
        <select value={mode} onChange={e => { setMode(e.target.value as typeof mode); setSent(false); }} className="mt-1 block w-full rounded-lg border p-3">
          <option value="login">Entrar com link ou código</option><option value="confirmation">Reenviar confirmação de cadastro</option>
        </select>
      </label>
      <label className="block text-sm">E-mail<input type="email" autoComplete="email" value={email} onChange={e => { setEmail(e.target.value); setSent(false); }} className="mt-1 w-full rounded-lg border p-3" /></label>
      <button type="button" disabled={busy || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)} onClick={send} className="rounded-lg bg-blue-700 px-4 py-3 text-white disabled:opacity-50">{busy ? 'Aguarde…' : sent ? 'Reenviar e-mail' : 'Enviar e-mail'}</button>
      {sent && <><label className="block text-sm">Código recebido<input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" className="mt-1 w-full rounded-lg border p-3" /></label><button type="button" disabled={busy || code.length !== 6} onClick={verify} className="rounded-lg bg-blue-700 px-4 py-3 text-white disabled:opacity-50">Confirmar código</button></>}
      <p role="status" className="text-sm text-slate-600">{message}</p>
    </div>
  </details>;
}
