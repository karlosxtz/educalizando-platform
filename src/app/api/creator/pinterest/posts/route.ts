import { supabaseAdmin as db } from '@/lib/supabase';
import { consumeRequestRateLimit } from '@/lib/request-rate-limit';
import { pinterestContext, pinterestBody, pinterestJson, pinterestFailure, PinterestInputError, readPinterestConnection } from '@/lib/pinterest-store';
import { pinterestConfig } from '@/lib/pinterest-security';
import { pinterestPin, pinterestUuid } from '@/lib/pinterest-contract';
export async function POST(request: Request) {
  try {
    const { store } = await pinterestContext(request);
    const limit = await consumeRequestRateLimit(request, { namespace: 'pinterest-enqueue:' + store.id, limit: 10, windowMs: 60000 });
    if (!limit.allowed) throw new PinterestInputError('Aguarde um minuto antes de continuar.', 429);
    const body = await pinterestBody(request);
    if (!pinterestConfig()) throw new PinterestInputError('O Pinterest aguarda ativação.', 503);
    if (!pinterestUuid(body.productId)) throw new PinterestInputError('Escolha um material.');
    const connection = await readPinterestConnection(store.id);
    if (!connection?.board_id) throw new PinterestInputError('Conecte a conta e escolha uma pasta primeiro.');
    const { data: product, error } = await db.from('products').select('id,slug,titulo,descricao,capa_url').eq('id', body.productId).eq('store_id', store.id).eq('status', 'publicado').is('excluido_em', null).maybeSingle();
    if (error) throw error; if (!product) throw new PinterestInputError('Material publicado não encontrado nesta loja.', 404);
    try { pinterestPin(product, store, connection.board_id, connection.campaign_links); } catch (cause) { throw new PinterestInputError(cause instanceof Error ? cause.message : 'Confira a capa do produto.'); }
    const { data: existing, error: readError } = await db.from('creator_pinterest_jobs').select('id,status').eq('store_id', store.id).eq('product_id', product.id).maybeSingle();
    if (readError) throw readError;
    if (existing && !['failed', 'cancelled'].includes(existing.status)) throw new PinterestInputError(existing.status === 'published' ? 'Este material já foi publicado no Pinterest.' : existing.status === 'uncertain' ? 'Confira o Pinterest: o resultado anterior não foi confirmado. Não repetiremos o envio para evitar duplicatas.' : 'Este material já está na fila de publicação.', 409);
    const values = { connection_id: connection.id, board_id: connection.board_id, title: product.titulo, source: 'manual', status: 'queued', error_message: null, attempts: 0, next_attempt_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    const result = existing ? await db.from('creator_pinterest_jobs').update(values).eq('id', existing.id).eq('store_id', store.id).in('status', ['failed', 'cancelled']).select('id').maybeSingle() : await db.from('creator_pinterest_jobs').insert({ ...values, store_id: store.id, product_id: product.id }).select('id').single();
    if (result.error?.code === '23505' || !result.error && !result.data) throw new PinterestInputError('Este material já entrou na fila. Atualize o histórico.', 409);
    if (result.error) throw result.error;
    return pinterestJson({ queued: true });
  } catch (error) { return pinterestFailure(error); }
}
