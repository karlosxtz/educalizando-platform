'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { syncAuthSession } from '@/lib/auth-session';
import { safeAuthDestination } from '@/lib/auth-navigation';
import { authCapabilities } from '@/lib/auth-capabilities';

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
  const input = 'mt-1 block w-full rounded-xl border border-slate-300 p-3';
  const button = 'rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-50';
  const panel = 'space-y-4 rounded-2xl border bg-white p-5';
  if (!loaded) return <main className="p-6" role="status">Carregando sua segurança…</main>;
  if (!user) return <main className="mx-auto max-w-xl p-6"><h1 className="text-2xl font-bold">Segurança da conta</h1><Link href="/entrar" className="text-blue-700 underline">Entre para continuar</Link></main>;
  return <main className="mx-auto max-w-2xl space-y-6 p-4 sm:p-8">
    <Link href="/entrar" className="text-blue-700">← Voltar à plataforma</Link>
    <h1 className="text-3xl font-bold">Segurança da conta</h1><p>{user.email}</p>
    <p role="status" aria-live="polite" className="rounded-xl bg-blue-50 p-3 text-sm">{message || 'Proteja seu acesso e mantenha seus dados atualizados.'}</p>
    <section className={panel}><h2 className="text-xl font-bold">Autenticação em duas etapas</h2><p>Use um aplicativo autenticador para gerar o código de acesso.</p>
      {!active.length && !enrollment && <button disabled={busy} className={button} onClick={() => run(async () => {
        // Uma tentativa interrompida não deve bloquear um novo cadastro do fator.
        for (const factor of factors.filter(f => f.status !== 'verified')) { const removed = await supabase.auth.mfa.unenroll({ factorId: factor.id }); if (removed.error) throw removed.error; }
        const result = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Educalizando' });
        if (result.error) throw result.error;
        setEnrollment({ id: result.data.id, qr: result.data.totp.qr_code, secret: result.data.totp.secret });
      })}>Ativar duas etapas</button>}
      {enrollment && <><img src={enrollment.qr} alt="QR Code para cadastrar a Educalizando no aplicativo autenticador" className="h-52 w-52" /><p className="break-all text-sm">Chave para cadastro manual: <strong>{enrollment.secret}</strong></p><p>Só será ativado depois de confirmar o código do aplicativo.</p></>}
      {(enrollment || active.length > 0) && <><label className="block">Código do aplicativo<input className={input} value={code} inputMode="numeric" autoComplete="one-time-code" onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} /></label>
        <button className={button} disabled={busy || code.length !== 6} onClick={() => run(async () => {
          await verifyFactor(enrollment?.id || active[0].id);
          const next = new URL(window.location.href).searchParams.get('next');
          if (next) window.location.assign(safeAuthDestination(next));
        })}>Confirmar código</button></>}
      {active.map(f => <div key={f.id} className="flex flex-wrap items-center gap-3"><span>Proteção ativa: {f.friendly_name || 'Aplicativo autenticador'}</span><button className="text-red-700 underline disabled:opacity-50" disabled={busy || !verified} onClick={() => run(async () => { const result = await supabase.auth.mfa.unenroll({ factorId: f.id }); if (result.error) throw result.error; await syncAuthSession(); setMessage('Autenticação em duas etapas removida.'); })}>Remover proteção</button></div>)}
      {active.length > 0 && !verified && <p className="text-sm">Confirme seu código antes de alterar os dados de acesso.</p>}
    </section>
    <fieldset disabled={busy || (active.length > 0 && !verified)} className={panel}><legend className="text-xl font-bold">Trocar senha</legend>
      <label className="block">Nova senha<input type="password" autoComplete="new-password" className={input} value={password} onChange={e => setPassword(e.target.value)} /></label>
      <label className="block">Repita a nova senha<input type="password" autoComplete="new-password" className={input} value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
      <button type="button" className="text-blue-700 underline" onClick={() => run(async () => { const result = await supabase.auth.reauthenticate(); if (result.error) throw result.error; setMessage('Código de confirmação enviado ao e-mail da sua conta.'); })}>Enviar código de confirmação por e-mail</button>
      <label className="block">Código de confirmação do e-mail<input className={input} value={nonce} inputMode="numeric" autoComplete="one-time-code" onChange={e => setNonce(e.target.value.replace(/\D/g, '').slice(0, 6))} /></label>
      <button className={button} onClick={() => run(async () => { if (password.length < 8 || password !== confirmation) throw new Error('Use pelo menos 8 caracteres e repita a mesma senha.'); if (nonce.length !== 6) throw new Error('Envie e informe o código de confirmação do e-mail.'); const result = await supabase.auth.updateUser({ password, nonce }); if (result.error) throw result.error; setPassword(''); setConfirmation(''); setNonce(''); await syncAuthSession(); setMessage('Senha alterada com sucesso.'); })}>Salvar nova senha</button>
    </fieldset>
    <fieldset disabled={busy || (active.length > 0 && !verified)} className={panel}><legend className="text-xl font-bold">Trocar e-mail</legend><label className="block">Novo e-mail<input type="email" autoComplete="email" className={input} value={email} onChange={e => setEmail(e.target.value)} /></label><button className={button} onClick={() => run(async () => { if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Informe um e-mail válido.'); const result = await supabase.auth.updateUser({ email }, { emailRedirectTo: `${window.location.origin}/auth/confirmar` }); if (result.error) throw result.error; setEmail(''); setMessage('Confirme a alteração nos e-mails enviados. Seu endereço só será atualizado após a confirmação.'); })}>Solicitar alteração</button></fieldset>
    {capabilities.phone && (
    <fieldset disabled={busy || (active.length > 0 && !verified)} className={panel}><legend className="text-xl font-bold">Telefone de autenticação</legend><p className="text-sm">Este telefone confirma sua identidade por SMS. O WhatsApp de contato da loja é configurado separadamente.</p><label className="block">Telefone com código do país<input type="tel" placeholder="+5511999999999" className={input} value={phone} onChange={e => { setPhone(e.target.value); setPhonePending(false); }} /></label><button className={button} onClick={() => run(async () => { if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new Error('Informe o telefone com + e código do país.'); const result = await supabase.auth.updateUser({ phone }); if (result.error) throw new Error('Não foi possível enviar o SMS. O serviço de SMS precisa estar configurado no Supabase.'); setPhonePending(true); setMessage('Confirme o código recebido por SMS.'); })}>Enviar SMS</button>{phonePending && <><label className="block">Código do SMS<input className={input} value={phoneCode} onChange={e => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" /></label><button disabled={phoneCode.length !== 6} className={button} onClick={() => run(async () => { const result = await supabase.auth.verifyOtp({ phone, token: phoneCode, type: 'phone_change' }); if (result.error) throw result.error; setPhonePending(false); setPhoneCode(''); setMessage('Telefone confirmado.'); })}>Confirmar telefone</button></>}</fieldset>
    )}
    <fieldset disabled={busy || (active.length > 0 && !verified)} className={panel}><legend className="text-xl font-bold">Métodos de login</legend>{user.identities?.map(identity => <div key={identity.identity_id} className="flex flex-wrap items-center gap-3"><span>{identity.provider === 'email' ? 'E-mail' : identity.provider}</span>{identity.provider !== 'email' && <button className="text-red-700 underline" disabled={(user.identities?.length || 0) < 2} onClick={() => run(async () => { const result = await supabase.auth.unlinkIdentity(identity); if (result.error) throw result.error; setMessage('Método de login removido.'); })}>Remover</button>}</div>)}{capabilities.google && !user.identities?.some(i => i.provider === 'google') && <button className={button} onClick={() => run(async () => { const result = await supabase.auth.linkIdentity({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/confirmar?next=/seguranca` } }); if (result.error) throw new Error('Não foi possível conectar o Google agora. Tente novamente mais tarde.'); })}>Conectar conta Google</button>}</fieldset>
  </main>;
}