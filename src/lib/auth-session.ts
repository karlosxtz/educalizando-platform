'use client';
import { supabase } from './supabase';

export async function syncAuthSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error('Entre novamente para continuar.');
  const response = await fetch('/api/auth/sync', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: data.session.access_token, refresh_token: data.session.refresh_token }),
  });
  if (!response.ok) throw new Error('Não foi possível validar sua sessão. Tente novamente.');
  await response.json();
  return data.session;
}
