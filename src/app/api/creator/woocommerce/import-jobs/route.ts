import { supabaseAdmin as db } from '@/lib/supabase';
import { wooCreator, wooJson, enqueueWooImport } from '@/lib/woo-import-jobs';
import { processWooImport, wooJobColumns } from '@/lib/woo-import-queue';
const uuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
export async function GET(request: Request) {
  try {
    const ctx = await wooCreator(request); if (!ctx) return wooJson({ error: 'Entre com a conta do criador.' }, 401);
    const { data, error } = await db.from('woocommerce_import_jobs').select(wooJobColumns).eq('store_id', ctx.store.id).order('created_at', { ascending: false }).limit(3);
    if (error) { if (['42P01', 'PGRST205'].includes(error.code)) return wooJson({ available: false, jobs: [] }); throw error; }
    return wooJson({ available: true, jobs: data || [] });
  } catch { return wooJson({ error: 'Não foi possível consultar a importação.' }, 503); }
}
export async function POST(request: Request) {
  try {
    if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) return wooJson({ error: 'Origem inválida.' }, 403);
    const ctx = await wooCreator(request); if (!ctx) return wooJson({ error: 'Entre com sua conta.' }, 401);
    const raw = await request.text(); if (raw.length > 16000) return wooJson({ error: 'Seleção muito grande. Use Importar todo o catálogo.' }, 413);
    const body = JSON.parse(raw);
    if (!ctx.integration) return wooJson({ error: 'Conecte uma loja WooCommerce primeiro.' }, 409);
    if (body.action === 'create') {
      if (ctx.integration.status !== 'active' || !ctx.integration.sync_products_from_woo) return wooJson({ error: 'Ative a importação Woo → Educalizando antes de iniciar.' }, 409);
      if (!['all', 'selected'].includes(body.mode)) return wooJson({ error: 'Escolha a importação desejada.' }, 400);
      const ids = Array.isArray(body.ids) ? [...new Set(body.ids)] : [];
      if (body.mode === 'selected' && (!ids.length || ids.length > 1000 || ids.some(id => !Number.isSafeInteger(id) || Number(id) <= 0))) return wooJson({ error: 'Selecione produtos válidos ou use Importar todo o catálogo.' }, 400);
      const job = await enqueueWooImport(ctx.integration, body.mode, ids as number[]); return wooJson({ job }, 201);
    }
    if (!uuid(body.id)) return wooJson({ error: 'Importação inválida.' }, 400);
    const { data: job, error } = await db.from('woocommerce_import_jobs').select('id,status,integration_id').eq('id', body.id).eq('store_id', ctx.store.id).maybeSingle();
    if (error) throw error; if (!job) return wooJson({ error: 'Importação não encontrada.' }, 404);
    let waitMs = 750;
    if (body.action === 'step') { if (job.status === 'running' || job.status === 'queued') { const progress = await processWooImport(ctx.store.id, job.id); if ('busy' in progress || 'retrying' in progress) waitMs = 5000; } }
    else if (['pause', 'resume', 'cancel'].includes(body.action)) {
      if (!['queued', 'running', 'paused'].includes(job.status)) return wooJson({ error: 'Essa importação já terminou.' }, 409);
      const status = body.action === 'pause' ? 'paused' : body.action === 'resume' ? 'queued' : 'cancelled';
      const changes: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
      // Pausing never steals an active lease. An in-flight operation may finish safely.
      if (body.action === 'resume') { changes.next_attempt_at = new Date().toISOString(); changes.step_attempts = 0; }
      const { error: updateError } = await db.from('woocommerce_import_jobs').update(changes).eq('id', job.id).eq('store_id', ctx.store.id).in('status', ['queued', 'running', 'paused']); if (updateError) throw updateError;
    } else return wooJson({ error: 'Ação inválida.' }, 400);
    const { data: latest, error: latestError } = await db.from('woocommerce_import_jobs').select(wooJobColumns).eq('id', job.id).eq('store_id', ctx.store.id).single(); if (latestError) throw latestError;
    return wooJson({ job: latest, waitMs });
  } catch (error) { return wooJson({ error: error instanceof Error ? error.message : 'Não foi possível continuar.' }, 503); }
}
