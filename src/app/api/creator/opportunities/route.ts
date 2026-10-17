import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin as db } from '@/lib/supabase';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' } });
export async function GET(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) return json({ error: 'Entre com sua conta para ver as oportunidades da loja.' }, 401);
    const after = new URL(request.url).searchParams.get('after');
    if (after && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(after)) return json({ error: 'Página inválida.' }, 400);
    const { data: store, error: storeError } = await db.from('stores').select('id,nome_loja,slug').eq('creator_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (storeError) throw storeError;
    if (!store) return json({ error: 'Crie sua loja para acessar o calendário.' }, 404);
    let query = db.from('products').select('id,titulo,status,seasonal_tags,tags').eq('store_id', store.id).is('excluido_em', null).order('id').limit(201);
    if (after) query = query.gt('id', after);
    const { data, error } = await query;
    if (error) throw error;
    const products = (data || []).slice(0, 200);
    return json({ store, products, next: (data || []).length > 200 ? products.at(-1)?.id : null });
  } catch {
    return json({ error: 'Não foi possível carregar os materiais. Tente novamente.' }, 503);
  }
}
