import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin as db } from '@/lib/supabase';
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' } });
export async function GET(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) return json({ error: 'Entre com a conta do criador.' }, 401);
    const params = new URL(request.url).searchParams;
    const days = Number(params.get('days') || 30), scope = params.get('scope') || 'all';
    if (![7, 30, 90].includes(days) || !['all', 'catalog', 'filters'].includes(scope)) return json({ error: 'Escolha um período e um tipo válidos.' }, 400);
    const { data: store, error: storeError } = await db.from('stores').select('id,nome_loja').eq('creator_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (storeError) throw storeError;
    if (!store) return json({ error: 'Crie sua loja para acessar o relatório.' }, 404);
    const { data, error } = await db.rpc('report_store_search_gaps', { p_store_id: store.id, p_days: days, p_scope: scope });
    if (error) {
      if (['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error.code)) return json({ available: false, store, days });
      throw error;
    }
    return json({ available: true, store, days, ...data });
  } catch { return json({ error: 'Não foi possível carregar as buscas agora. Tente novamente.' }, 503); }
}
