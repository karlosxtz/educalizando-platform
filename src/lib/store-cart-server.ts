import 'server-only';
import { supabaseAdmin as db } from './supabase';
import { getRequestUser } from './api-auth';
export const cartJson = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex' } });
export const cartUuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export function cartOrigin(request: Request) { return request.headers.get('origin') === new URL(request.url).origin; }
export async function cartBody(request: Request) {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new Error('JSON required');
  const reader = request.body?.getReader(); if (!reader) throw new Error('Empty body');
  let timer: ReturnType<typeof setTimeout> | undefined, size = 0, raw = '';
  const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => { void reader.cancel().catch(() => {}); reject(new Error('Timeout')); }, 10000); });
  try { const decoder = new TextDecoder(); while (true) { const part = await Promise.race([reader.read(), timeout]); if (part.done) break; size += part.value.byteLength; if (size > 12000) { await reader.cancel(); throw new Error('Too large'); } raw += decoder.decode(part.value, { stream: true }); } return JSON.parse(raw + decoder.decode()); }
  finally { if (timer) clearTimeout(timer); reader.releaseLock(); }
}
export async function cartOwner(request: Request) {
  const user = await getRequestUser(request); if (!user) return null;
  const { data, error } = await db.from('stores').select('id,slug,nome_loja').eq('creator_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error; return data;
}
export type ResolvedCartItem = { productId: string; quantity: number; title: string; price: number; isPlr: boolean; type: string; kind: 'product' | 'kit'; storeId: string; origin: 'store'; id: string };
export async function resolveStoreCart(storeId: string, requested: unknown): Promise<ResolvedCartItem[]> {
  if (!Array.isArray(requested) || requested.length > 20) throw new Error('Invalid items');
  if (!requested.length) return [];
  const seen = new Set<string>();
  for (const item of requested) {
    if (!item || !cartUuid(item.productId) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10 || (item.kind && !['kit', 'product'].includes(item.kind)) || (item.isPlr !== undefined && typeof item.isPlr !== 'boolean')) throw new Error('Invalid item');
    const key = item.productId + (item.isPlr ? '_plr' : ''); if (seen.has(key)) throw new Error('Repeated item'); seen.add(key);
    if (item.kind === 'kit' && (item.isPlr || requested.length !== 1 || item.quantity !== 1)) throw new Error('Invalid kit');
  }
  const kits = requested[0].kind === 'kit';
  const { data, error } = await db.from(kits ? 'kits' : 'products').select(kits ? 'id,titulo,preco_kit,status,store_id' : 'id,titulo,preco,preco_plr,is_plr,tipo,status,store_id').eq('store_id', storeId).eq('status', 'publicado').is('excluido_em', null).in('id', [...new Set(requested.map(item => item.productId))]);
  if (error) throw error;
  const records = (data || []) as unknown as { id: string; titulo: string; preco?: number; preco_plr?: number; preco_kit?: number; is_plr?: boolean; tipo?: string }[];
  return requested.map(item => {
    const record = records.find(record => record.id === item.productId); if (!record || (item.isPlr && !record.is_plr)) throw new Error('Unavailable item');
    const price = Number(kits ? record.preco_kit : item.isPlr ? record.preco_plr : record.preco);
    if (!Number.isFinite(price) || price <= 0) throw new Error('Unavailable price');
    return { productId: record.id, quantity: item.quantity, title: record.titulo, price, isPlr: item.isPlr === true, kind: kits ? 'kit' : 'product', type: kits ? 'kit' : record.tipo || 'material', storeId, origin: 'store', id: record.id + (item.isPlr ? '_plr' : '') };
  });
}
/** Optional recovery failures must never prevent an authenticated, validated checkout. */
export async function linkStoreCartOrder(storeId: string, browser: unknown, orderId: string, request: Request, slug: string) {
  if (!cartUuid(browser)) return;
  try {
    const ref = new URL(request.headers.get('referer') || 'https://invalid.local');
    if (ref.origin !== new URL(request.url).origin || ref.pathname !== '/loja/' + encodeURIComponent(slug) + '/checkout' || ref.searchParams.get('origem') === 'marketplace') return;
    await db.rpc('link_store_cart_order', { p_store: storeId, p_browser: browser, p_order: orderId });
  } catch { /* Missing migration / unavailable analytics cannot block payment. */ }
}
