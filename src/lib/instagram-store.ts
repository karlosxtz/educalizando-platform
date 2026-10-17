import 'server-only';
import { getRequestUser } from './api-auth';
import { supabaseAdmin as db } from './supabase';
import { SITE_URL } from './seo';
import { decryptInstagramToken, encryptInstagramToken, instagramConfig } from './instagram-security';
import { InstagramProviderError, refreshInstagramToken } from './instagram-provider';

export const instagramJson = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
export class InstagramInputError extends Error { constructor(message: string, public status = 400) { super(message); } }
export async function instagramContext(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== SITE_URL) throw new InstagramInputError('Origem não permitida.', 403);
  const user = await getRequestUser(request);
  if (!user) throw new InstagramInputError('Entre com a conta do criador.', 401);
  const { data: store, error } = await db.from('stores').select('id,creator_id,slug,nome_loja').eq('creator_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  if (!store) throw new InstagramInputError('Loja não encontrada.', 404);
  return { user, store };
}
export function instagramFailure(error: unknown) {
  if (error instanceof InstagramInputError) return instagramJson({ error: error.message }, error.status);
  if (error instanceof InstagramProviderError) return instagramJson({ error: error.message }, error.code === 190 ? 409 : 503);
  const code = (error as { code?: string })?.code;
  const migrationRequired = code === '42P01' || code === 'PGRST205';
  return instagramJson({ error: migrationRequired ? 'A integração aguarda a ativação das tabelas pela Educalizando.' : 'Não foi possível concluir a operação. Tente novamente em instantes.', migrationRequired }, 503);
}
export async function instagramBody(request: Request): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader(); if (!reader) throw new InstagramInputError('Informe os dados.');
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const part = await reader.read(); if (part.done) break;
    size += part.value.byteLength; if (size > 12000) { await reader.cancel(); throw new InstagramInputError('Solicitação muito grande.', 413); }
    chunks.push(part.value);
  }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { const body = JSON.parse(new TextDecoder().decode(bytes)); if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error(); return body; }
  catch { throw new InstagramInputError('Solicitação inválida.'); }
}
export type InstagramConnection = { id: string; store_id: string; instagram_user_id: string; username: string; account_type: string; token_encrypted: string; expires_at: string; updated_at: string };
export async function readInstagramConnection(storeId: string, id?: string): Promise<InstagramConnection | null> {
  let query = db.from('creator_instagram_connections').select('*').eq('store_id', storeId);
  if (id) query = query.eq('id', id);
  const { data, error } = await query.maybeSingle(); if (error) throw error;
  return data;
}
export async function usableInstagramToken(connection: InstagramConnection) {
  if (!instagramConfig()) throw new InstagramInputError('A publicação direta ainda não foi ativada na Educalizando.', 503);
  const remaining = Date.parse(connection.expires_at) - Date.now();
  if (remaining <= 0) throw new InstagramInputError('A conexão expirou. Conecte o Instagram novamente.', 409);
  const token = decryptInstagramToken(connection.token_encrypted, connection.store_id);
  if (remaining > 7 * 86400000 || Date.now() - Date.parse(connection.updated_at) < 86400000) return token;
  const fresh = await refreshInstagramToken(token);
  const { data, error } = await db.from('creator_instagram_connections').update({ token_encrypted: encryptInstagramToken(fresh.token, connection.store_id), expires_at: fresh.expiresAt, updated_at: new Date().toISOString() }).eq('id', connection.id).eq('store_id', connection.store_id).select('id').maybeSingle();
  if (error) throw error; if (!data) throw new InstagramInputError('A conexão mudou. Conecte novamente.', 409);
  return fresh.token;
}
