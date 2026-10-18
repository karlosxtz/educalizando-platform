import { isSuperAdmin } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { orderOrigin, orderOriginDayRange } from '@/lib/order-origin';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
export async function GET(request: Request) {
  if (!(await isSuperAdmin(request))) return json({ error: 'Acesso negado.' }, 403);
  const date = new URL(request.url).searchParams.get('date') || new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
  const range = orderOriginDayRange(date);
  if (!range) return json({ error: 'Informe uma data válida.' }, 400);
  try {
    const fields = 'id,store_id,status,created_at,paid_at,total_amount';
    const read = (withTracking: boolean) => supabaseAdmin.from('orders').select(fields + (withTracking ? ',tracking_parameters' : ''), { count: 'exact' }).eq('status', 'paid')
      .gte('created_at', range.start).lt('created_at', range.end).order('created_at', { ascending: false }).limit(100);
    let result = await read(true);
    let trackingAvailable = true;
    if (result.error?.code === '42703' && result.error.message.includes('tracking_parameters')) { trackingAvailable = false; result = await read(false); }
    if (result.error) throw result.error;
    const orders = (result.data || []) as unknown as { id: string; store_id: string; status: string; created_at: string; paid_at: string | null; total_amount: number; tracking_parameters?: unknown }[];
    const ids = [...new Set(orders.map(order => order.store_id).filter(Boolean))];
    const stores = ids.length ? await supabaseAdmin.from('stores').select('id,nome_loja').in('id', ids) : { data: [], error: null };
    if (stores.error) throw stores.error;
    const names = new Map((stores.data || []).map(store => [store.id, store.nome_loja]));
    return json({ date, trackingAvailable, total: result.count || 0, rows: orders.map(order => ({ id: order.id, storeName: names.get(order.store_id) || 'Loja indisponível', createdAt: order.created_at, paidAt: order.paid_at, amount: order.total_amount, origin: orderOrigin(order.tracking_parameters) })) });
  } catch { return json({ error: 'Não foi possível consultar a origem dos pedidos.' }, 503); }
}
