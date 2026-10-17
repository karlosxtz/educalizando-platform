import { supabase } from './supabase';

/** Store settings currently save directly under RLS. Keep that contract intact. */
export async function requestPublicRevalidation(storeId: string) {
  if (typeof window === 'undefined') return;
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) throw new Error('Sessão indisponível');
    const response = await fetch('/api/cache/public-revalidate', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + data.session.access_token },
      body: JSON.stringify({ storeId }), cache: 'no-store', signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error('Revalidação pendente');
  } catch {
    // Saving succeeded. Never claim a DB failure just because cache purge failed.
    console.warn('[Cache] Cadastro salvo; atualização pública pendente da revalidação.');
  }
}
