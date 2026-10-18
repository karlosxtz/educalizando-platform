import 'server-only';
import { supabaseAdmin as db } from './supabase';
import { pinterestConfig } from './pinterest-security';
import { pinterestPin, pinterestId } from './pinterest-contract';
import { pinterestRequest, PinterestProviderError } from './pinterest-provider';
import { readPinterestConnection, usablePinterestToken, PinterestInputError } from './pinterest-store';
type QueueJob = { id: string; store_id: string; product_id: string | null; connection_id: string | null; source: string; board_id: string; attempts: number };
async function finish(job: QueueJob, status: string, error_message: string | null, pin_id?: string, next_attempt_at?: string) {
  const { error } = await db.from('creator_pinterest_jobs').update({ status, error_message, ...(pin_id ? { pin_id } : {}), ...(next_attempt_at ? { next_attempt_at } : {}), updated_at: new Date().toISOString() }).eq('id', job.id).eq('store_id', job.store_id).eq('status', 'processing');
  if (error) throw error;
}
export async function publishPinterestJob(job: QueueJob) {
  let sent = false;
  try {
    const connection = await readPinterestConnection(job.store_id);
    if (!connection || connection.id !== job.connection_id || (job.source === 'automatic' && !connection.auto_publish)) { await finish(job, 'cancelled', 'Conexão encerrada ou automação pausada.'); return; }
    const [{ data: product, error }, { data: store, error: storeError }] = await Promise.all([
      db.from('products').select('id,slug,titulo,descricao,capa_url,status,excluido_em').eq('id', job.product_id).eq('store_id', job.store_id).maybeSingle(),
      db.from('stores').select('slug,nome_loja').eq('id', job.store_id).maybeSingle(),
    ]);
    if (error || storeError) throw error || storeError;
    if (!product || product.status !== 'publicado' || product.excluido_em || !store) { await finish(job, 'cancelled', 'O material não está mais publicado.'); return; }
    const body = pinterestPin(product, store, job.board_id, connection.campaign_links);
    const token = await usablePinterestToken(connection);
    // Check the connection and opt-in again immediately before the remote write.
    const current = await readPinterestConnection(job.store_id);
    if (!current || current.id !== job.connection_id || (job.source === 'automatic' && !current.auto_publish)) { await finish(job, 'cancelled', 'Conexão encerrada ou automação pausada.'); return; }
    sent = true;
    const result = await pinterestRequest('/pins', token, body);
    if (!pinterestId(result.id)) throw new PinterestProviderError(200, true);
    await finish(job, 'published', null, result.id);
  } catch (error) {
    const uncertain = error instanceof PinterestProviderError ? error.uncertain : sent;
    const retry = error instanceof PinterestProviderError && error.status === 429 && !uncertain && job.attempts < 6;
    const message = error instanceof PinterestProviderError || error instanceof PinterestInputError ? error.message : error instanceof Error && !sent && error.message.startsWith('Use uma capa') ? error.message : uncertain ? 'Confirmação pendente. Confira o Pinterest; não repetiremos este envio automaticamente.' : 'Não foi possível preparar o Pin. Confira os dados do material e a conexão.';
    await finish(job, uncertain ? 'uncertain' : retry ? 'queued' : 'failed', message, undefined, retry ? new Date(Date.now() + Math.min(3600000, 60000 * 2 ** job.attempts)).toISOString() : undefined);
  }
}
export async function processPinterestQueue() {
  if (!pinterestConfig()) return;
  // Use the existing minute cron. Bounded concurrency and no new KV/R2 bindings.
  for (let index = 0; index < 3; index++) {
    const { data, error } = await db.rpc('claim_creator_pinterest_job');
    if (error) {
      if (['42P01', 'PGRST202', 'PGRST205'].includes(error.code)) return;
      throw new Error('pinterest_queue_unavailable');
    }
    const job = data?.[0] as QueueJob | undefined; if (!job) return;
    await publishPinterestJob(job);
  }
}
