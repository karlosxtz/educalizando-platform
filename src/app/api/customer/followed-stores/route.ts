import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { consumeRequestRateLimit, rateLimitResponse } from '@/lib/request-rate-limit';
import { isUuid as uuid } from '@/lib/conversion-events';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization, Cookie' } });
const storeFields = 'id,nome_loja,slug,logo_url,descricao';

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return json({ error: 'Entre na sua conta para seguir lojas.' }, 401);
  const params = new URL(request.url).searchParams;
  const storeId = params.get('storeId');
  if (storeId && !uuid(storeId)) return json({ error: 'Loja inválida.' }, 400);
  const offset = Math.max(0, Math.min(100000, Number(params.get('offset')) || 0));
  let query = supabaseAdmin.from('store_followers').select(`store_id,notifications_enabled,created_at,store:stores(${storeFields})`).eq('user_id', user.id);
  if (storeId) query = query.eq('store_id', storeId);
  const { data, error } = await query.order('created_at', { ascending: false }).range(offset, offset + 99);
  if (error) return json({ error: 'Lojas seguidas indisponíveis. Tente novamente em instantes.' }, 503);
  const follows = data || [];
  if (storeId) return json({ following: follows.length > 0, notifications: follows[0]?.notifications_enabled === true });
  const enabled = follows.filter(row => row.notifications_enabled);
  let news: unknown[] = [];
  if (enabled.length) {
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const result = await supabaseAdmin.from('products')
      .select('id,store_id,titulo,slug,capa_url,preco,is_free,tipo,created_at,store:stores!products_store_id_fkey(id,nome_loja,slug,logo_url)')
      .in('store_id', enabled.map(row => row.store_id)).eq('status', 'publicado').is('excluido_em', null)
      .gte('created_at', since).order('created_at', { ascending: false }).limit(100);
    if (result.error) return json({ error: 'Não foi possível carregar as novidades agora.' }, 503);
    const dates = new Map(enabled.map(row => [row.store_id, row.created_at]));
    news = (result.data || []).filter(product => product.created_at >= (dates.get(product.store_id) || since)).slice(0, 24);
  }
  return json({ follows, news, hasMore: follows.length === 100 });
}

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return json({ error: 'Entre na sua conta para seguir lojas.' }, 401);
  const limit = await consumeRequestRateLimit(request, { namespace: `store-follow:${user.id}`, limit: 40, windowMs: 60000 });
  if (!limit.allowed) return rateLimitResponse(limit);
  const body = await request.json().catch(() => null);
  if (!uuid(body?.storeId) || typeof body?.following !== 'boolean' || (body.notifications !== undefined && typeof body.notifications !== 'boolean')) return json({ error: 'Dados inválidos.' }, 400);
  const { data: store } = await supabaseAdmin.from('stores').select('id').eq('id', body.storeId).maybeSingle();
  if (!store) return json({ error: 'Loja não encontrada.' }, 404);
  const result = body.following
    ? await supabaseAdmin.from('store_followers').upsert({ user_id: user.id, store_id: store.id, notifications_enabled: body.notifications === true }, { onConflict: 'user_id,store_id' })
    : await supabaseAdmin.from('store_followers').delete().eq('user_id', user.id).eq('store_id', store.id);
  if (result.error) return json({ error: 'Não foi possível salvar sua escolha agora.' }, 503);
  return json({ following: body.following, notifications: body.following && body.notifications === true });
}
