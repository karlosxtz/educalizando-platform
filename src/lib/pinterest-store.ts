import 'server-only';
import { supabaseAdmin as db } from './supabase';
import { getRequestUser } from './api-auth';
import { SITE_URL } from './seo';
import { pinterestConfig, decryptPinterest, encryptPinterest } from './pinterest-security';
import { PinterestProviderError, pinterestTokens } from './pinterest-provider';
export const pinterestJson = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
export class PinterestInputError extends Error { constructor(message: string, public status = 400) { super(message); } }
export function pinterestFailure(error: unknown) {
  if (error instanceof PinterestInputError) return pinterestJson({ error: error.message }, error.status);
  if (error instanceof PinterestProviderError) return pinterestJson({ error: error.message }, 503);
  const migrationRequired = ['42P01', 'PGRST205', 'PGRST202'].includes((error as { code?: string })?.code || '');
  return pinterestJson({ error: migrationRequired ? 'O Pinterest aguarda a ativação das tabelas pela Educalizando.' : 'Não foi possível concluir a operação. Tente novamente em instantes.', migrationRequired }, 503);
}
export async function pinterestContext(request: Request) {
  if (request.headers.get('origin') && request.headers.get('origin') !== SITE_URL) throw new PinterestInputError('Origem não permitida.', 403);
  const user = await getRequestUser(request); if (!user) throw new PinterestInputError('Entre com sua conta de criador.', 401);
  const { data: store, error } = await db.from('stores').select('id,slug,nome_loja').eq('creator_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error; if (!store) throw new PinterestInputError('Loja não encontrada.', 404);
  return { user, store };
}
export async function pinterestBody(request: Request): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader(); if (!reader) throw new PinterestInputError('Informe os dados.');
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) { const part = await reader.read(); if (part.done) break; size += part.value.byteLength; if (size > 8000) { await reader.cancel(); throw new PinterestInputError('Solicitação muito grande.', 413); } chunks.push(part.value); }
  try { const data = JSON.parse(Buffer.concat(chunks).toString('utf8')); if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error(); return data; } catch { throw new PinterestInputError('Solicitação inválida.'); }
}
export type PinterestConnection = { id: string; store_id: string; username: string; token_encrypted: string; refresh_encrypted: string; expires_at: string; sandbox: boolean; auto_publish: boolean; campaign_links: boolean; board_id: string | null; board_name: string | null };
export async function readPinterestConnection(storeId: string): Promise<PinterestConnection | null> {
  const { data, error } = await db.from('creator_pinterest_connections').select('*').eq('store_id', storeId).maybeSingle(); if (error) throw error; return data;
}
export async function usablePinterestToken(connection: PinterestConnection) {
  const config = pinterestConfig(); if (!config || config.sandbox !== connection.sandbox) throw new PinterestInputError('Conecte o Pinterest novamente após a ativação do aplicativo.', 409);
  if (Date.parse(connection.expires_at) > Date.now() + 86400000) return decryptPinterest(connection.token_encrypted, connection.store_id);
  const lock = new Date(Date.now() + 60000).toISOString();
  const { data: claimed, error } = await db.from('creator_pinterest_connections').update({ refresh_lock_until: lock }).eq('store_id', connection.store_id).eq('id', connection.id).or(`refresh_lock_until.is.null,refresh_lock_until.lt.${new Date().toISOString()}`).select('id').maybeSingle();
  if (error) throw error; if (!claimed) throw new PinterestInputError('A conexão está sendo atualizada. Tente novamente em instantes.', 409);
  try {
    // Re-read after the lock; another request may just have refreshed the token.
    const latest = await readPinterestConnection(connection.store_id);
    if (!latest || latest.id !== connection.id) throw new PinterestInputError('A conexão mudou. Conecte novamente.', 409);
    if (Date.parse(latest.expires_at) > Date.now() + 86400000) return decryptPinterest(latest.token_encrypted, latest.store_id);
    const fresh = await pinterestTokens(decryptPinterest(latest.refresh_encrypted, latest.store_id), true);
    const { data, error: saveError } = await db.from('creator_pinterest_connections').update({ token_encrypted: encryptPinterest(fresh.token, latest.store_id), refresh_encrypted: encryptPinterest(fresh.refresh, latest.store_id), expires_at: fresh.expiresAt, updated_at: new Date().toISOString() }).eq('id', latest.id).eq('store_id', latest.store_id).eq('refresh_lock_until', lock).select('id').maybeSingle();
    if (saveError) throw saveError; if (!data) throw new PinterestInputError('Reconecte o Pinterest.', 409);
    return fresh.token;
  } finally { await db.from('creator_pinterest_connections').update({ refresh_lock_until: null }).eq('id', connection.id).eq('store_id', connection.store_id).eq('refresh_lock_until', lock); }
}
