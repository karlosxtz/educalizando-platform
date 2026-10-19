'use client';
import { supabase } from './supabase';
import { readApiJson } from './api-response';

export async function customerApi(path: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('Entre na sua conta para continuar.');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${data.session.access_token}`);
  if (init.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(path, { ...init, headers, cache: 'no-store', signal: init.signal || AbortSignal.timeout(20000) });
  const body = await readApiJson(response);
  if (!response.ok) throw new Error(body.error || 'Não foi possível concluir agora. Tente novamente.');
  return body;
}
