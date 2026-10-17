import 'server-only';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { getRequestUser } from './api-auth';
import { supabaseAdmin as db } from './supabase';
import { decryptWebhookSecret } from './store-webhook-security';
import { InboundInputError, type InboundReceiver } from './store-webhook-inbound-contract';
import { publicSiteOrigin } from './public-links';

export const inboundJson = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow' } });
export const inboundToken = () => 'whin_' + randomBytes(32).toString('base64url');
export const inboundHash = (value: string) => createHash('sha256').update(value).digest('hex');
export const inboundUuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export function receiverUrl(receiver: InboundReceiver) { return publicSiteOrigin() + '/api/webhooks/receive/' + receiver.id + '/' + decryptWebhookSecret(receiver.token_encrypted, receiver.store_id); }
export async function creatorInboundStore(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return null;
  const user = await getRequestUser(request); if (!user) return null;
  const { data, error } = await db.from('stores').select('id,nome_loja').eq('creator_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}
export async function authenticatedReceiver(id: string, token: string) {
  if (!inboundUuid(id) || !/^whin_[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const { data, error } = await db.from('store_webhook_receivers').select('*').eq('id', id).is('archived_at', null).maybeSingle();
  if (error) throw error;
  if (!data || !data.enabled || !timingSafeEqual(Buffer.from(data.token_hash, 'hex'), Buffer.from(inboundHash(token), 'hex'))) return null;
  return data as InboundReceiver;
}
export async function readInboundJson(request: Request, limit = 65536): Promise<unknown> {
  if (Number(request.headers.get('content-length')) > limit) throw new InboundInputError('Envie no máximo ' + Math.floor(limit / 1024) + ' KB de dados por requisição.', 413);
  const reader = request.body?.getReader(); if (!reader) throw new InboundInputError('Envie os dados em JSON.');
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => { void reader.cancel().catch(() => {}); reject(new InboundInputError('O envio dos dados excedeu o tempo disponível.', 408)); }, 10000); });
  try {
    const chunks: Uint8Array[] = []; let length = 0;
    while (true) { const part = await Promise.race([reader.read(), timeout]); if (part.done) break; length += part.value.byteLength; if (length > limit) { await reader.cancel(); throw new InboundInputError('Os dados excedem o tamanho permitido.', 413); } chunks.push(part.value); }
    const bytes = new Uint8Array(length); let position = 0; for (const chunk of chunks) { bytes.set(chunk, position); position += chunk.byteLength; }
    try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { throw new InboundInputError('Envie um JSON válido.'); }
  } finally { if (timer) clearTimeout(timer); }
}
export function inboundFailure(error: unknown) {
  if (error instanceof InboundInputError) return inboundJson({ error: error.message }, error.status);
  if ((error as {code?:string})?.code === '23503') return inboundJson({ error: 'Existem registros vinculados a esta conexão. Use Pausar para manter o acompanhamento.' }, 409);
  return inboundJson({ error: 'Não foi possível concluir agora. Tente novamente com o mesmo identificador do evento.' }, 503);
}
