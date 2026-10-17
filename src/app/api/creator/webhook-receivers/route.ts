import { z } from 'zod';
import { supabaseAdmin as db } from '@/lib/supabase';
import { consumeRequestRateLimit, rateLimitResponse } from '@/lib/request-rate-limit';
import { encryptWebhookSecret } from '@/lib/store-webhook-security';
import { INBOUND_PERMISSIONS, InboundInputError, type InboundPermission, type InboundReceiver } from '@/lib/store-webhook-inbound-contract';
import { creatorInboundStore, inboundFailure, inboundHash, inboundJson, inboundToken, inboundUuid, readInboundJson, receiverUrl } from '@/lib/store-webhook-inbound-server';

export const dynamic = 'force-dynamic';
const permissionNames = Object.keys(INBOUND_PERMISSIONS) as [InboundPermission, ...InboundPermission[]];
const config = z.object({ name: z.string().trim().min(1).max(100), permissions: z.array(z.enum(permissionNames)).min(1).max(6) });
async function context(request: Request, mutate = false) {
  const store = await creatorInboundStore(request);
  if (!store) return { response: inboundJson({ error: 'Entre com a conta do criador.' }, 401) };
  if (mutate) { const limit = await consumeRequestRateLimit(request, { namespace: 'receiver-config:' + store.id, limit: 20, windowMs: 60000 }); if (!limit.allowed) return { response: rateLimitResponse(limit) }; }
  return { store };
}
function safeReceiver(row: InboundReceiver) { return { id: row.id, name: row.name, enabled: row.enabled, permissions: row.permissions, created_at: row.created_at, url: receiverUrl(row) }; }
function permissionList(values: InboundPermission[]) {
  const permissions = [...new Set(['events.receive' as InboundPermission, ...values])];
  if (permissions.includes('access.manage') && !permissions.includes('orders.write')) throw new InboundInputError('Para liberar materiais, habilite também o registro de vendas externas.');
  return permissions;
}
export async function GET(request: Request) {
  try {
    const auth = await context(request); if (auth.response) return auth.response; const store = auth.store!;
    const queries = await Promise.all([
      db.from('store_webhook_receivers').select('*').eq('store_id', store.id).is('archived_at', null).order('created_at', { ascending: false }),
      db.from('store_webhook_received_events').select('id,receiver_id,external_id,type,is_test,status,result,error_code,attempts,created_at').eq('store_id', store.id).order('created_at', { ascending: false }).limit(50),
      db.from('store_external_contacts').select('id,name,email,phone,marketing_consent,updated_at,receiver_id').eq('store_id', store.id).order('updated_at', { ascending: false }).limit(50),
      db.from('store_external_orders').select('id,external_id,status,email,customer_name,total_amount,currency,updated_at,receiver_id').eq('store_id', store.id).order('updated_at', { ascending: false }).limit(50),
    ]);
    const error = queries.find(query => query.error)?.error;
    if (error) { if (['42P01', 'PGRST205'].includes(error.code)) return inboundJson({ available: false, receivers: [], events: [], contacts: [], orders: [] }); throw error; }
    return inboundJson({ available: true, receivers: (queries[0].data || []).map(row => safeReceiver(row as InboundReceiver)), events: queries[1].data || [], contacts: queries[2].data || [], orders: queries[3].data || [] });
  } catch (error) { return inboundFailure(error); }
}
export async function POST(request: Request) {
  try {
    const auth = await context(request, true); if (auth.response) return auth.response; const store = auth.store!;
    const raw = await readInboundJson(request, 16384) as Record<string, unknown>;
    if (raw?.action === 'details') {
      if (!inboundUuid(raw.id)) throw new InboundInputError('Recebimento inválido.');
      const { data, error } = await db.from('store_webhook_received_events').select('id,type,data,result,status,error_code,created_at').eq('id', raw.id).eq('store_id', store.id).maybeSingle();
      if (error) throw error; return data ? inboundJson({ event: data }) : inboundJson({ error: 'Recebimento não encontrado.' }, 404);
    }
    if (raw?.action === 'retry') {
      if (!inboundUuid(raw.id)) throw new InboundInputError('Recebimento inválido.');
      const { data: event, error } = await db.from('store_webhook_received_events').select('*').eq('id', raw.id).eq('store_id', store.id).eq('status', 'failed').maybeSingle();
      if (error) throw error; if (!event) return inboundJson({ error: 'Recebimento não encontrado ou não está com falha.' }, 404);
      const { data: current, error: receiverError } = await db.from('store_webhook_receivers').select('*').eq('id', event.receiver_id).eq('store_id', store.id).eq('enabled', true).is('archived_at', null).maybeSingle();
      if (receiverError) throw receiverError; if (!current) throw new InboundInputError('Ative a conexão antes de tentar novamente.');
      if (event.attempts >= 8) { const { error: resetError } = await db.from('store_webhook_received_events').update({ attempts: 0 }).eq('id', event.id).eq('store_id', store.id).eq('status', 'failed'); if (resetError) throw resetError; }
      const { data: result, error: retryError } = await db.rpc('receive_store_webhook', { p_receiver: current.id, p_token_hash: current.token_hash, p_event_id: event.external_id, p_type: event.type, p_occurred: event.occurred_at, p_data: event.data, p_hash: event.payload_hash, p_test: event.is_test });
      if (retryError) throw retryError; return result?.success ? inboundJson(result) : inboundJson({ ...result, error: 'A ação não foi aplicada. Confira as permissões, os materiais e os dados do recebimento antes de tentar novamente.' }, 409);
    }
    const parsed = config.safeParse(raw); if (!parsed.success) throw new InboundInputError('Informe um nome e selecione permissões válidas.');
    const token = inboundToken();
    const { data, error } = await db.from('store_webhook_receivers').insert({ store_id: store.id, name: parsed.data.name, permissions: permissionList(parsed.data.permissions), token_hash: inboundHash(token), token_encrypted: encryptWebhookSecret(token, store.id) }).select('*').single();
    if (error) { if (error.code === '23514') throw new InboundInputError('Cada loja pode ter até 10 endereços de recebimento ativos ou pausados.'); throw error; }
    return inboundJson({ receiver: safeReceiver(data as InboundReceiver) }, 201);
  } catch (error) { return inboundFailure(error); }
}
export async function PATCH(request: Request) {
  try {
    const auth = await context(request, true); if (auth.response) return auth.response; const store = auth.store!;
    const raw = await readInboundJson(request, 16384) as Record<string, unknown>; if (!inboundUuid(raw?.id)) throw new InboundInputError('Conexão inválida.');
    const update: Record<string, unknown> = {};
    if ('name' in raw || 'permissions' in raw) { const parsed = config.safeParse(raw); if (!parsed.success) throw new InboundInputError('Confira o nome e as permissões.'); update.name = parsed.data.name; update.permissions = permissionList(parsed.data.permissions); }
    if (typeof raw.enabled === 'boolean') update.enabled = raw.enabled;
    if (raw.rotate === true) { const token = inboundToken(); update.token_hash = inboundHash(token); update.token_encrypted = encryptWebhookSecret(token, store.id); }
    if (!Object.keys(update).length) throw new InboundInputError('Selecione uma alteração.');
    const { data, error } = await db.from('store_webhook_receivers').update(update).eq('id', raw.id).eq('store_id', store.id).is('archived_at', null).select('*').maybeSingle();
    if (error) throw error; return data ? inboundJson({ receiver: safeReceiver(data as InboundReceiver) }) : inboundJson({ error: 'Conexão não encontrada.' }, 404);
  } catch (error) { return inboundFailure(error); }
}
export async function DELETE(request: Request) {
  try {
    const auth = await context(request, true); if (auth.response) return auth.response;
    const raw = await readInboundJson(request, 16384) as Record<string, unknown>; if (!inboundUuid(raw?.id)) throw new InboundInputError('Conexão inválida.');
    const { count, error: orderError } = await db.from('store_external_orders').select('id', { count: 'exact', head: true }).eq('receiver_id', raw.id).eq('store_id', auth.store!.id);
    if (orderError) throw orderError;
    if (count) return inboundJson({ error: 'Esta conexão tem vendas externas vinculadas. Use Pausar para preservar o acompanhamento e permitir a reativação.' }, 409);
    const { data, error } = await db.from('store_webhook_receivers').update({ enabled: false, archived_at: new Date().toISOString() }).eq('id', raw.id).eq('store_id', auth.store!.id).is('archived_at', null).select('id');
    if (error) throw error; return data?.length ? inboundJson({ archived: true }) : inboundJson({ error: 'Conexão não encontrada.' }, 404);
  } catch (error) { return inboundFailure(error); }
}
