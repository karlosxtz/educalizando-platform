'use client';
import { useEffect, useState } from 'react';
import { authCapabilities } from '@/lib/auth-capabilities';
import { supabase } from '@/lib/supabase';
import { syncAuthSession } from '@/lib/auth-session';
import { safeAuthDestination } from '@/lib/auth-navigation';
import { ChevronDown, Mail, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';

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
      setCode(''); setSent(true); setMessage('Se a conta estiver disponível, você receberá um e-mail. Confira também o spam.');
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
  const field = 'mt-2 block min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50';
  const action = 'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#103e75] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40';
  return <details className="group rounded-2xl border border-slate-100 bg-slate-50/70 transition open:border-blue-100 open:bg-white">
    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-semibold text-slate-600 transition hover:text-blue-800 [&::-webkit-details-marker]:hidden"><span className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" />Outras formas de acessar</span><ChevronDown className="h-4 w-4 transition group-open:rotate-180" /></summary>
    <div className="space-y-5 border-t border-slate-100 p-4 sm:p-5">
      {google && mode === 'login' && <button type="button" className="rounded-lg border px-4 py-3 text-blue-700 disabled:opacity-50" disabled={busy} onClick={async () => {
        setBusy(true); setMessage('');
        const redirect = new URL('/auth/confirmar', window.location.origin); redirect.searchParams.set('next', safeAuthDestination(destination));
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirect.toString() } });
        if (error) { setMessage('O acesso com Google não está disponível agora. Use o e-mail para continuar.'); setBusy(false); }
      }}>Entrar com Google</button>}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1" aria-label="Forma de acesso">
        {([['login', 'Entrar sem senha'], ['confirmation', 'Confirmar cadastro']] as const).map(([value, label]) => <button key={value} type="button" disabled={busy} aria-pressed={mode === value} onClick={() => { setMode(value); setSent(false); setCode(''); setMessage(''); }} className={`min-h-11 rounded-lg px-2 py-2 text-xs font-bold transition ${mode === value ? 'bg-white text-[#103e75] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{label}</button>)}
      </div>
      <div className="flex items-start gap-3"><div className="rounded-xl bg-blue-50 p-2.5 text-blue-800">{mode === 'login' ? <KeyRound className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}</div><div><h3 className="text-sm font-bold text-slate-900">{mode === 'login' ? 'Um código. Seu acesso.' : 'Conclua seu cadastro'}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{mode === 'login' ? 'Receba um link e um código por e-mail para entrar sem sua senha.' : 'Criou uma conta e ainda não confirmou o e-mail? Peça uma nova confirmação aqui.'}</p></div></div>
      <label className="block text-xs font-semibold text-slate-600">E-mail da conta<input type="email" autoComplete="email" placeholder="seuemail@exemplo.com" value={email} disabled={busy} onChange={e => { setEmail(e.target.value); setSent(false); setCode(''); setMessage(''); }} className={field} /></label>
      <button type="button" disabled={busy || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)} onClick={send} className={action}><Mail className="h-4 w-4" />{busy ? 'Aguarde…' : sent ? 'Reenviar e-mail' : mode === 'login' ? 'Receber meu acesso' : 'Reenviar confirmação'}</button>
      {sent && <div className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/40 p-4"><label className="block text-xs font-semibold text-slate-600">Código recebido<input value={code} disabled={busy} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} inputMode="numeric" autoComplete="one-time-code" placeholder="Cole o código completo" className={`${field} text-center font-mono text-lg tracking-[0.12em]`} /></label><p className="text-xs leading-5 text-slate-500">Digite ou cole todos os dígitos do e-mail. Você também pode entrar pelo link enviado.</p><button type="button" disabled={busy || code.length < 6} onClick={verify} className={action}>Confirmar código<ArrowRight className="h-4 w-4" /></button></div>}
      {message && <p role="status" aria-live="polite" className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">{message}</p>}
    </div>
  </details>;
}
