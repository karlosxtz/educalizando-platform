import { supabaseAdmin as db } from '@/lib/supabase';
import { consumeRequestRateLimit, rateLimitResponse } from '@/lib/request-rate-limit';
import { safeGapQuery } from '@/lib/store-search-gaps';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin');
    if (!origin || origin !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') return json({ recorded: false }, 403);
    if (!request.headers.get('content-type')?.includes('application/json')) return json({ recorded: false }, 415);
    // Keep the intake small even for chunked requests.
    const reader = request.body?.getReader(); if (!reader) return json({ recorded: false }, 400);
    let raw = '', size = 0; const decoder = new TextDecoder();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => { void reader.cancel().catch(() => {}); reject(new Error('Read timeout')); }, 10000); });
    try {
      while (true) { const part = await Promise.race([reader.read(), timeout]); if (part.done) break; size += part.value.byteLength; if (size > 2048) { await reader.cancel(); return json({ recorded: false }, 413); } raw += decoder.decode(part.value, { stream: true }); }
      raw += decoder.decode();
    } finally { if (timer) clearTimeout(timer); reader.releaseLock(); }
    const body = JSON.parse(raw), safe = safeGapQuery(body.query);
    const filters = body.filters;
    if (!safe || !uuid(body.id) || !uuid(body.storeId) || !['catalog', 'filters'].includes(body.scope) || !filters || !['all', 'new', 'popular', 'plr'].includes(filters.collection) || !['category', 'education'].every(key => filters[key] === 'all' || uuid(filters[key]))) return json({ recorded: false }, 400);
    const identityRequest = new Request(request.url, { headers: { 'x-real-ip': request.headers.get('cf-connecting-ip') || 'unknown' } });
    const limit = await consumeRequestRateLimit(identityRequest, { namespace: 'store-search-gaps', limit: 20, windowMs: 60000 });
    if (!limit.allowed) return rateLimitResponse(limit);
    const { data: store, error: storeError } = await db.from('stores').select('id').eq('id', body.storeId).maybeSingle();
    if (storeError) throw storeError;
    if (!store) return json({ recorded: false }, 404);
    const { error } = await db.from('store_search_gaps').insert({ id: body.id, store_id: store.id, query: safe.query, normalized_query: safe.normalized, scope: body.scope, category_id: filters.category === 'all' ? null : filters.category, education_level_id: filters.education === 'all' ? null : filters.education, collection: filters.collection });
    if (error?.code === '23505') return json({ recorded: false, duplicate: true });
    if (error) return json({ recorded: false }, 202);
    return json({ recorded: true }, 201);
  } catch { return json({ recorded: false }, 400); }
}
