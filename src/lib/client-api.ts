import { supabase } from './supabase';

/** Platform credentials never leave same-origin API routes. */
export async function authenticatedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  if (!url.startsWith('/api/') || url.includes('\\')) throw new Error('Endereço da API inválido.');
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = attempt ? await supabase.auth.refreshSession() : await supabase.auth.getSession();
    const token = result.data.session?.access_token;
    if (!token || result.error) throw new Error('Sua sessão expirou. Entre novamente para continuar.');
    const headers = new Headers(init.headers);
    headers.set('Authorization', 'Bearer ' + token);
    const response = await fetch(url, { ...init, headers, credentials: 'same-origin', cache: 'no-store', redirect: 'error' });
    if (response.status !== 401 || attempt) return response;
    await response.body?.cancel();
  }
  throw new Error('Sua sessão expirou. Entre novamente para continuar.');
}
