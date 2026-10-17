'use client';
import { supabase } from './supabase';
import { readApiJson } from './api-response';
export async function instagramFetch(path: string, init: RequestInit = {}) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = attempt ? await supabase.auth.refreshSession() : await supabase.auth.getSession();
    const token = result.data.session?.access_token;
    if (!token || result.error) throw new Error('Sua sessão expirou. Entre novamente.');
    const headers = new Headers(init.headers); headers.set('Authorization', 'Bearer ' + token);
    if (init.body) headers.set('Content-Type', 'application/json');
    const response = await fetch(path, { ...init, headers, cache: 'no-store', signal: init.signal || AbortSignal.timeout(30000) });
    if (response.status === 401 && attempt === 0) continue;
    const data = await readApiJson(response);
    if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a operação. Consulte o histórico antes de repetir uma publicação.');
    return data;
  }
  throw new Error('Entre novamente para continuar.');
}
