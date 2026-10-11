'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { syncAuthSession } from '@/lib/auth-session';
import { safeAuthDestination } from '@/lib/auth-navigation';

export default function ConfirmAuthPage() {
  const started = useRef(false);
  const [message, setMessage] = useState('Confirmando seu acesso…');
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      try {
        const url = new URL(window.location.href);
        const hash = new URLSearchParams(url.hash.slice(1));
        if (url.searchParams.has('error') || hash.has('error')) throw new Error('Este link não é mais válido. Solicite outro e-mail.');
        const code = url.searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
        const session = await syncAuthSession();
        window.history.replaceState(null, '', '/auth/confirmar');
        const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (assurance.error) throw assurance.error;
        if (assurance.data.nextLevel === 'aal2' && assurance.data.currentLevel !== 'aal2') {
          window.location.replace(`/seguranca?next=${encodeURIComponent(safeAuthDestination(url.searchParams.get('next'), '/entrar'))}`);
          return;
        }
        const response = await fetch('/api/auth/complete', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } });
        if (!response.ok) throw new Error('Seu acesso foi confirmado, mas não foi possível concluir o cadastro. Tente entrar novamente.');
        const payload = await response.json();
        window.location.replace(safeAuthDestination(url.searchParams.get('next'), payload.destination));
      } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível confirmar seu acesso. Solicite um novo link.'); }
    })();
  }, []);
  return <main className="mx-auto max-w-lg p-6"><h1 className="text-2xl font-bold">Acesso à Educalizando</h1><p role="status" className="my-6">{message}</p><Link href="/entrar" className="text-blue-700 underline">Voltar ao login</Link></main>;
}
