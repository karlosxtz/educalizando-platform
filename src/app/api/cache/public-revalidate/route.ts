import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { invalidatePublicCatalog } from '@/lib/public-cache-invalidation';
import { consumeRequestRateLimit, rateLimitResponse } from '@/lib/request-rate-limit';

export async function POST(request: Request) {
  const headers = { 'Cache-Control': 'private, no-store' };
  const user = await getRequestUser(request);
  if (!user) return Response.json({ error: 'Acesso negado.' }, { status: 401, headers });
  const rateHeaders = new Headers(request.headers);
  if (request.headers.has('cf-connecting-ip')) {
    rateHeaders.delete('x-vercel-forwarded-for');
    rateHeaders.set('x-forwarded-for', request.headers.get('cf-connecting-ip')!);
  }
  const limit = await consumeRequestRateLimit(new Request(request.url, { method: request.method, headers: rateHeaders }), { namespace: 'public-cache-revalidation', limit: 60, windowMs: 3_600_000 });
  if (!limit.allowed) return rateLimitResponse(limit);
  const body = await request.json().catch(() => null);
  if (!body || typeof body.storeId !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.storeId)) {
    return Response.json({ error: 'Loja inválida.' }, { status: 400, headers });
  }
  const { data, error } = await supabaseAdmin.from('stores').select('id').eq('id', body.storeId).eq('creator_id', user.id).maybeSingle();
  if (error) return Response.json({ error: 'Não foi possível verificar a loja.' }, { status: 503, headers });
  if (!data) return Response.json({ error: 'Acesso negado.' }, { status: 403, headers });
  try {
    if (!await invalidatePublicCatalog()) throw new Error('Cache indisponível');
    return Response.json({ success: true }, { headers });
  } catch {
    return Response.json({ error: 'Cadastro preservado; atualização pública pendente.' }, { status: 503, headers });
  }
}
