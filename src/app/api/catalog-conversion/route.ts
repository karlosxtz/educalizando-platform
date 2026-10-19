import { supabaseAdmin } from '@/lib/supabase';
import { cleanConversionBatch } from '@/lib/conversion-events';
import { consumeRequestRateLimit, rateLimitResponse } from '@/lib/request-rate-limit';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') || 0) > 10000) return json({ recorded: false }, 413);
  const text = await request.text();
  if (text.length > 10000) return json({ recorded: false }, 413);
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { return json({ recorded: false }, 400); }
  const batch = cleanConversionBatch(parsed);
  if (!batch) return json({ recorded: false }, 400);
  const rate = await consumeRequestRateLimit(request, { namespace: 'catalog-conversion', limit: 60, windowMs: 60000 });
  if (!rate.allowed) return rateLimitResponse(rate);
  const { data, error } = await supabaseAdmin.from('products').select('id,store_id').in('id', batch.events.map(event => event.productId)).eq('status', 'publicado').is('excluido_em', null);
  if (error) return json({ recorded: false }, 503);
  const ownership = new Map((data || []).map(product => [product.id, product.store_id]));
  const rows = batch.events.filter(event => ownership.get(event.productId) === event.storeId).map(event => ({ store_id: event.storeId, product_id: event.productId, stage: event.stage, session_id: batch.sessionId }));
  if (!rows.length) return json({ recorded: false }, 400);
  const result = await supabaseAdmin.from('store_conversion_events').upsert(rows, { onConflict: 'store_id,product_id,session_id,stage,event_day', ignoreDuplicates: true });
  return json({ recorded: !result.error }, result.error ? 503 : 200);
}
