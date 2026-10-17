import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin as db } from '@/lib/supabase';
import { consumeRequestRateLimit, rateLimitResponse } from '@/lib/request-rate-limit';
import { canonicalInboundJson, INBOUND_ACTIONS, InboundInputError, normalizeInboundEvent, redactInboundData } from '@/lib/store-webhook-inbound-contract';
import { authenticatedReceiver, inboundFailure, inboundHash, inboundJson, readInboundJson } from '@/lib/store-webhook-inbound-server';
import { validateWebhookUrl } from '@/lib/store-webhook-security';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ receiverId: string; token: string }> };
async function receiver(request: Request, context: Context) {
  const { receiverId, token } = await context.params;
  const current = await authenticatedReceiver(receiverId, token);
  if (!current) return { response: inboundJson({ error: 'Endereço de recebimento indisponível ou chave inválida.' }, 401) };
  // Fixed request identity creates a per-receiver quota, independent of caller-supplied IP headers.
  const limit = await consumeRequestRateLimit(new Request('https://www.educalizando.com.br/api/webhooks/receive'), { namespace: 'webhook-receiver:' + current.id, limit: 120, windowMs: 60000 });
  if (!limit.allowed) return { response: rateLimitResponse(limit) };
  return { current };
}
export async function GET(request: Request, context: Context) {
  try { const result = await receiver(request, context); return result.response || inboundJson({ ready: true, message: 'Endereço pronto para receber JSON por POST.' }); } catch (error) { return inboundFailure(error); }
}
export async function POST(request: Request, context: Context) {
  try {
    const auth = await receiver(request, context); if (auth.response) return auth.response;
    const current = auth.current!;
    if (!/^application\/(?:[\w.-]+\+)?json\b/i.test(request.headers.get('content-type') || '')) throw new InboundInputError('Use Content-Type: application/json.', 415);
    const raw = await readInboundJson(request);
    // Validate traversal before hashing; generic payloads are recorded without executing guessed actions.
    redactInboundData(raw);
    const headerId = request.headers.get('x-event-id') || request.headers.get('idempotency-key');
    const object = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : null;
    const envelopeKeys = new Set(['id', 'type', 'data', 'occurred_at', 'test']);
    const envelope = object && typeof object.type === 'string' && object.data && typeof object.data === 'object'
      && ((INBOUND_ACTIONS as readonly string[]).includes(object.type) || !Array.isArray(object.data) && Object.keys(object).every(key => envelopeKeys.has(key)))
      ? { ...object, id: object.id || headerId || randomUUID() }
      : { id: headerId || randomUUID(), type: 'custom.received', data: object || { payload: raw } };
    const event = normalizeInboundEvent(envelope);
    if (event.type === 'product.upsert' && event.data.cover_url && !event.test) {
      try { await validateWebhookUrl(String(event.data.cover_url)); } catch { throw new InboundInputError('A capa precisa usar um endereço HTTPS público e acessível.'); }
    }
    const data = redactInboundData(event.data);
    if (Buffer.byteLength(JSON.stringify(data)) > 65536) throw new InboundInputError('Os dados normalizados excedem o tamanho permitido.', 413);
    const { data: result, error } = await db.rpc('receive_store_webhook', { p_receiver: current.id, p_token_hash: current.token_hash, p_event_id: event.id, p_type: event.type, p_occurred: event.occurred_at || null, p_data: data, p_hash: inboundHash(canonicalInboundJson(event)), p_test: event.test });
    if (error) throw error;
    if (!result?.success) {
      const code = result?.error_code;
      return inboundJson({ received: false, event_id: result?.event_id, error: code === '42501' ? 'A ação não está autorizada nas permissões desta conexão.' : code === 'event_id_conflict' ? 'Este identificador já foi usado com outros dados. Use um identificador por evento.' : code === '22023' ? 'Confira os materiais, o pedido e a situação informada. A ação não foi aplicada.' : 'Não foi possível aplicar o aviso. Consulte o histórico e tente novamente com o mesmo identificador.', code }, code === '42501' ? 403 : code === 'event_id_conflict' || code === '22023' ? 409 : 503);
    }
    if (event.type === 'product.upsert' && result.status === 'processed' && !result.duplicate) {
      try {
        const { data: product } = await db.from('products').select('slug,status,stores!inner(slug)').eq('id', result.result?.product_id).eq('store_id', current.store_id).maybeSingle();
        revalidatePath('/dashboard/produtos');
        if (product?.status === 'publicado') {
          const store = product.stores as unknown as { slug: string };
          revalidatePath('/'); revalidatePath('/buscar'); revalidatePath('/loja/' + store.slug);
          revalidatePath('/produto/' + product.slug); revalidatePath('/loja/' + store.slug + '/produto/' + product.slug);
        }
      } catch { /* An acknowledged transaction must not be reported as failed due to cache refresh. */ }
    }
    return inboundJson({ received: true, ...result });
  } catch (error) { return inboundFailure(error); }
}
