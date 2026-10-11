'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { syncAuthSession } from '@/lib/auth-session';
import { safeAuthDestination } from '@/lib/auth-navigation';
import { authCapabilities } from '@/lib/auth-capabilities';
import { ArrowLeft, ShieldCheck, LockKeyhole, Mail, Smartphone, Fingerprint, Loader2 } from 'lucide-react';

type Factor = { id: string; status: string; friendly_name?: string };
export default function SecurityPage() {
  const [user, setUser] = useState<User | null>(null);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrollment, setEnrollment] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [nonce, setNonce] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phonePending, setPhonePending] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [verified, setVerified] = useState(false);
  const [capabilities, setCapabilities] = useState({ google: false, phone: false });
  useEffect(() => { void authCapabilities().then(setCapabilities); }, []);
  async function refresh() {
    const identity = await supabase.auth.getUser();
    if (identity.error || !identity.data.user) { setLoaded(true); return; }
    setUser(identity.data.user);
    const list = await supabase.auth.mfa.listFactors();
    if (list.error) throw list.error;
    setFactors(list.data.totp);
    const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance.error) throw assurance.error;
    setVerified(assurance.data.currentLevel === 'aal2');
    setLoaded(true);
  }
  useEffect(() => { void refresh().catch(() => { setMessage('Não foi possível carregar sua conta.'); setLoaded(true); }); }, []);
  async function run(action: () => Promise<void>) {
    setBusy(true); setMessage('');
    try { await action(); await refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível concluir a operação.'); }
    finally { setBusy(false); }
  }
  async function verifyFactor(id: string) {
    const result = await supabase.auth.mfa.challengeAndVerify({ factorId: id, code });
    if (result.error) throw result.error;
    await syncAuthSession(); setCode(''); setEnrollment(null); setVerified(true);
    setMessage('Identidade confirmada. Sua conta está protegida.');
  }
  const active = factors.filter(f => f.status === 'verified');
  const input = 'mt-2 block min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 disabled:opacity-50';
  const button = 'inline-flex min-h-12 items-center justify-center rounded-xl bg-[#103e75] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-40';
  const panel = 'min-w-0 space-y-5 rounded-[1.5rem] border border-slate-200/80 bg-white p-5 text-sm text-slate-600 shadow-[0_8px_32px_-20px_rgba(15,23,42,0.22)] sm:p-7';
  if (!loaded) return <main className="flex min-h-[70vh] items-center justify-center gap-3 text-sm text-slate-500" role="status"><Loader2 className="h-5 w-5 animate-spin" />Carregando sua segurança…</main>;
  if (!user) return <main className="mx-auto my-16 max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><ShieldCheck className="mx-auto mb-5 h-10 w-10 text-blue-700" /><h1 className="text-2xl font-bold">Segurança da conta</h1><p className="my-4 text-sm text-slate-500">Entre para gerenciar seus dados de acesso.</p><Link href="/entrar" className={button}>Entre para continuar</Link></main>;
  const accountUrl = user.user_metadata?.role === 'creator' ? '/dashboard/conta' : '/cliente/conta';
  return <main className="mx-auto max-w-6xl px-4 py-6 font-sans sm:px-8 sm:py-10">
    <div className="mb-8 flex items-center justify-between gap-4"><Link href={accountUrl} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-800"><ArrowLeft className="h-4 w-4" />Voltar à minha conta</Link><Link href="/"><img src="/branding/logo-educalizando.png?v=3" alt="Educalizando" className="h-9 w-auto" /></Link></div>
    <header className="mb-8 overflow-hidden rounded-[1.75rem] bg-[#0c3261] p-6 text-white shadow-lg shadow-blue-950/10 sm:p-9">
      <div className="flex flex-wrap items-center justify-between gap-6"><div><span className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-200"><ShieldCheck className="h-4 w-4" />Seu acesso, protegido</span><h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Segurança da conta</h1><p className="mt-3 max-w-lg text-sm leading-6 text-blue-100">Controle como você entra, atualize seus dados e adicione uma camada de proteção.</p></div><div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4"><p className="text-xs text-blue-200">Conta conectada</p><p className="mt-1 max-w-full break-all text-sm font-semibold">{user.email}</p></div></div>
    </header>
    <p role="status" aria-live="polite" className="mb-6 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-5 py-4 text-sm leading-6 text-blue-900"><ShieldCheck className="h-5 w-5 shrink-0" />{message || 'Você decide como proteger sua conta. Suas alterações são confirmadas com segurança.'}</p>
    <div className="grid items-start gap-6 lg:grid-cols-2">
    <section className={`${panel} lg:col-span-2`}><div className="flex flex-wrap items-center justify-between gap-4"><SecurityTitle icon={ShieldCheck} title="Autenticação em duas etapas" description="Uma confirmação extra para manter sua conta protegida." /><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${active.length ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{active.length ? 'Proteção ativa' : 'Disponível para ativar'}</span></div><p>Use um aplicativo autenticador para gerar o código de acesso.</p>
      {!active.length && !enrollment && <button disabled={busy} className={button} onClick={() => run(async () => {
        // Uma tentativa interrompida não deve bloquear um novo cadastro do fator.
        for (const factor of factors.filter(f => f.status !== 'verified')) { const removed = await supabase.auth.mfa.unenroll({ factorId: factor.id }); if (removed.error) throw removed.error; }
        const result = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Educalizando' });
        if (result.error) throw result.error;
        setEnrollment({ id: result.data.id, qr: result.data.totp.qr_code, secret: result.data.totp.secret });
      })}>Ativar duas etapas</button>}
      {enrollment && <><img src={enrollment.qr} alt="QR Code para cadastrar a Educalizando no aplicativo autenticador" className="h-52 w-52 rounded-2xl border border-slate-100 bg-white p-3" /><p className="break-all text-sm">Chave para cadastro manual: <strong>{enrollment.secret}</strong></p><p>Só será ativado depois de confirmar o código do aplicativo.</p></>}
      {(enrollment || active.length > 0) && <><label className="block">Código do aplicativo<input className={input} value={code} inputMode="numeric" autoComplete="one-time-code" onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} /></label>
        <button className={button} disabled={busy || code.length !== 6} onClick={() => run(async () => {
          await verifyFactor(enrollment?.id || active[0].id);
          const next = new URL(window.location.href).searchParams.get('next');
          if (next) window.location.assign(safeAuthDestination(next));
        })}>Confirmar código</button></>}
      {active.map(f => <div key={f.id} className="flex flex-wrap items-center gap-3"><span>Proteção ativa: {f.friendly_name || 'Aplicativo autenticador'}</span><button className="text-red-700 underline disabled:opacity-50" disabled={busy || !verified} onClick={() => run(async () => { const result = await supabase.auth.mfa.unenroll({ factorId: f.id }); if (result.error) throw result.error; await syncAuthSession(); setMessage('Autenticação em duas etapas removida.'); })}>Remover proteção</button></div>)}
      {active.length > 0 && !verified && <p className="text-sm">Confirme seu código antes de alterar os dados de acesso.</p>}
    </section>
    <fieldset disabled={busy || (active.length > 0 && !verified)} className={panel}><legend className="sr-only">Trocar senha</legend><SecurityTitle icon={LockKeyhole} title="Trocar senha" description="Escolha uma nova senha e confirme pelo seu e-mail." />
      <label className="block">Nova senha<input type="password" autoComplete="new-password" className={input} value={password} onChange={e => setPassword(e.target.value)} /></label>
      <label className="block">Repita a nova senha<input type="password" autoComplete="new-password" className={input} value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
      <button type="button" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-blue-800 transition hover:bg-blue-50" onClick={() => run(async () => { const result = await supabase.auth.reauthenticate(); if (result.error) throw result.error; setMessage('Código de confirmação enviado ao e-mail da sua conta.'); })}>Enviar código de confirmação por e-mail</button>
      <label className="block">Código de confirmação do e-mail<input className={input} value={nonce} inputMode="numeric" autoComplete="one-time-code" onChange={e => setNonce(e.target.value.replace(/\D/g, '').slice(0, 6))} /></label>
      <button className={button} onClick={() => run(async () => { if (password.length < 8 || password !== confirmation) throw new Error('Use pelo menos 8 caracteres e repita a mesma senha.'); if (nonce.length !== 6) throw new Error('Envie e informe o código de confirmação do e-mail.'); const result = await supabase.auth.updateUser({ password, nonce }); if (result.error) throw result.error; setPassword(''); setConfirmation(''); setNonce(''); await syncAuthSession(); setMessage('Senha alterada com sucesso.'); })}>Salvar nova senha</button>
    </fieldset>
    <fieldset disabled={busy || (active.length > 0 && !verified)} className={panel}><legend className="sr-only">Trocar e-mail</legend><SecurityTitle icon={Mail} title="Trocar e-mail" description="Mantenha seu endereço de acesso atualizado." /><label className="block">Novo e-mail<input type="email" autoComplete="email" className={input} value={email} onChange={e => setEmail(e.target.value)} /></label><button className={button} onClick={() => run(async () => { if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Informe um e-mail válido.'); const result = await supabase.auth.updateUser({ email }, { emailRedirectTo: `${window.location.origin}/auth/confirmar` }); if (result.error) throw result.error; setEmail(''); setMessage('Confirme a alteração nos e-mails enviados. Seu endereço só será atualizado após a confirmação.'); })}>Solicitar alteração</button></fieldset>
    {capabilities.phone && (
    <fieldset disabled={busy || (active.length > 0 && !verified)} className={panel}><legend className="sr-only">Telefone de autenticação</legend><SecurityTitle icon={Smartphone} title="Telefone de autenticação" description="Confirme sua identidade pelo telefone." /><p className="text-sm">Este telefone confirma sua identidade por SMS. O WhatsApp de contato da loja é configurado separadamente.</p><label className="block">Telefone com código do país<input type="tel" placeholder="+5511999999999" className={input} value={phone} onChange={e => { setPhone(e.target.value); setPhonePending(false); }} /></label><button className={button} onClick={() => run(async () => { if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new Error('Informe o telefone com + e código do país.'); const result = await supabase.auth.updateUser({ phone }); if (result.error) throw new Error('Não foi possível enviar o SMS. O serviço de SMS precisa estar configurado no Supabase.'); setPhonePending(true); setMessage('Confirme o código recebido por SMS.'); })}>Enviar SMS</button>{phonePending && <><label className="block">Código do SMS<input className={input} value={phoneCode} onChange={e => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" /></label><button disabled={phoneCode.length !== 6} className={button} onClick={() => run(async () => { const result = await supabase.auth.verifyOtp({ phone, token: phoneCode, type: 'phone_change' }); if (result.error) throw result.error; setPhonePending(false); setPhoneCode(''); setMessage('Telefone confirmado.'); })}>Confirmar telefone</button></>}</fieldset>
    )}
    <fieldset disabled={busy || (active.length > 0 && !verified)} className={panel}><legend className="sr-only">Métodos de login</legend><SecurityTitle icon={Fingerprint} title="Métodos de login" description="Gerencie as formas de entrar na plataforma." />{user.identities?.map(identity => <div key={identity.identity_id} className="flex flex-wrap items-center gap-3"><span>{identity.provider === 'email' ? 'E-mail' : identity.provider}</span>{identity.provider !== 'email' && <button className="text-red-700 underline" disabled={(user.identities?.length || 0) < 2} onClick={() => run(async () => { const result = await supabase.auth.unlinkIdentity(identity); if (result.error) throw result.error; setMessage('Método de login removido.'); })}>Remover</button>}</div>)}{capabilities.google && !user.identities?.some(i => i.provider === 'google') && <button className={button} onClick={() => run(async () => { const result = await supabase.auth.linkIdentity({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/confirmar?next=/seguranca` } }); if (result.error) throw new Error('Não foi possível conectar o Google agora. Tente novamente mais tarde.'); })}>Conectar conta Google</button>}</fieldset>
    </div>
    <p className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400"><LockKeyhole className="h-3.5 w-3.5" />Nunca compartilhe senhas ou códigos de confirmação.</p>
  </main>;
}

function SecurityTitle({ icon: Icon, title, description }: { icon: typeof ShieldCheck; title: string; description: string }) {
  return <div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#103e75]"><Icon className="h-5 w-5" /></div><div><h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div></div>;
}
