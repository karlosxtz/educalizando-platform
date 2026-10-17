import 'server-only';
import { supabaseAdmin as db } from './supabase';
import { credentialsFromIntegration, importWooProduct, safeWooError, wooImportUuid, wooRequest, type WooProduct } from './woocommerce-service';
import { wooProductPage } from './woo-catalog-page';
import { mirrorWooDelivery, mirrorWooPublicMedia } from './woocommerce-media';
type Asset = { kind: 'image' | 'delivery'; url: string; index: number; name?: string };
type Job = { id: string; store_id: string; integration_id: string; mode: string; status: string; page: number; last_seen_id: number; queue: number[]; cursor: number; source_done: boolean; product_id: string | null; assets: Asset[]; asset_cursor: number; processed: number; failed: number; skipped: number; discovered: number; warnings: number; issues: { product: number; stage: string; message: string }[]; step_attempts: number; lease_token: string; cutoff: string };
export const wooJobColumns = 'id,mode,status,page,processed,failed,skipped,discovered,warnings,issues,last_error,created_at,updated_at,next_attempt_at';
const check = (result: { error: unknown }) => { if (result.error) throw result.error; };
export async function processWooImport(storeId?: string, jobId?: string) {
  const { data, error } = await db.rpc('claim_woo_import', { p_store: storeId || null, p_job: jobId || null });
  if (error) { if (['42P01', 'PGRST202'].includes(error.code)) return { available: false }; throw error; }
  const job = data?.[0] as Job | undefined; if (!job) return { busy: true };
  const receipt = async (changes: Record<string, unknown>) => {
    const result = await db.from('woocommerce_import_jobs').update({ ...changes, lease_token: null, lease_until: null, updated_at: new Date().toISOString() }).eq('id', job.id).eq('store_id', job.store_id).in('status', ['running', 'paused', 'queued']).eq('lease_token', job.lease_token).select('id');
    check(result); return Boolean(result.data?.length);
  };
  const finishProduct = (changes: Record<string, unknown> = {}) => receipt({ cursor: job.cursor + 1, product_id: null, assets: [], asset_cursor: 0, processed: Number(job.processed) + 1, step_attempts: 0, last_error: null, ...changes });
  const issue = async (message: string) => {
    const issues = [...job.issues, { product: job.queue[job.cursor] || 0, stage: job.product_id ? job.assets[job.asset_cursor]?.kind || 'produto' : 'produto', message }].slice(-20);
    if (job.product_id) return receipt({ asset_cursor: job.asset_cursor + 1, warnings: Number(job.warnings) + 1, issues, step_attempts: 0, last_error: message });
    if (job.cursor < job.queue.length) return receipt({ cursor: job.cursor + 1, failed: Number(job.failed) + 1, issues, step_attempts: 0, last_error: message });
    return receipt({ status: 'paused', issues, last_error: message, step_attempts: 0 });
  };
  try {
    if (job.step_attempts > 3) { await issue('Esta etapa não terminou após três tentativas. Confira o item e os limites da hospedagem.'); return { progressed: true }; }
    const { data: integration, error: integrationError } = await db.from('woocommerce_integrations').select('*').eq('id', job.integration_id).eq('store_id', job.store_id).eq('status', 'active').maybeSingle();
    if (integrationError) throw integrationError; if (!integration) { await receipt({ status: 'paused', last_error: 'A integração foi pausada ou desconectada.' }); return { progressed: true }; }
    if (job.product_id) {
      const { data: editable, error: editableError } = await db.from('products').select('import_incomplete').eq('id', job.product_id).eq('store_id', job.store_id).maybeSingle(); if (editableError) throw editableError;
      if (!editable?.import_incomplete) { await finishProduct(); return { progressed: true }; }
      const asset = job.assets[job.asset_cursor];
      if (!asset) { await finishProduct(); return { progressed: true }; }
      // One remote asset per invocation, instead of every image/file in one long request.
      if (asset.kind === 'image') {
        const mirrored = await mirrorWooPublicMedia(asset.url, integration.id + '/jobs/' + job.id, job.queue[job.cursor], asset.index);
        check(await db.rpc('apply_woo_import_asset', { p_store: job.store_id, p_product: job.product_id, p_asset_id: wooImportUuid(job.product_id + ':image:' + asset.index), p_kind: 'image', p_index: asset.index, p_asset: mirrored, p_job: job.id, p_lease: job.lease_token }));
      } else {
        const file = await mirrorWooDelivery(asset.url, asset.name || 'Arquivo', integration.id + '/jobs/' + job.id, job.queue[job.cursor], asset.index);
        check(await db.rpc('apply_woo_import_asset', { p_store: job.store_id, p_product: job.product_id, p_asset_id: wooImportUuid(job.product_id + ':file:' + asset.index), p_kind: 'delivery', p_index: asset.index, p_asset: file, p_job: job.id, p_lease: job.lease_token }));
      }
      await receipt({ asset_cursor: job.asset_cursor + 1, step_attempts: 0, last_error: null }); return { progressed: true };
    }
    if (job.cursor >= job.queue.length) {
      if (job.source_done || job.mode === 'selected') {
        const completed = await receipt({ status: 'completed', step_attempts: 0, last_error: null });
        if (completed) await db.from('woocommerce_integrations').update({ last_sync_at: new Date().toISOString(), last_error: job.failed || job.warnings ? `${job.failed} produto(s) com falha e ${job.warnings} aviso(s) de arquivo. Confira a importação.` : null }).eq('id', integration.id).eq('store_id', job.store_id);
        return { progressed: true };
      }
      const page = await wooProductPage(integration, job.page, job.cutoff, true);
      const ids = page.map(item => item.id);
      if (ids.some((id, index) => !Number.isSafeInteger(id) || id <= (index ? ids[index - 1] : Number(job.last_seen_id || 0)))) throw new Error('O WooCommerce repetiu ou desordenou a página de produtos. Confira plugins de cache e a paginação da REST API antes de retomar.');
      const { data: mapped, error: mapError } = ids.length ? await db.from('woocommerce_product_mappings').select('woo_product_id').eq('integration_id', integration.id).in('woo_product_id', ids) : { data: [], error: null };
      if (mapError) throw mapError;
      const existing = new Set((mapped || []).map(row => Number(row.woo_product_id)));
      await receipt({ queue: ids.filter(id => !existing.has(id)), cursor: 0, page: job.page + 1, last_seen_id: ids.at(-1) || job.last_seen_id || 0, source_done: page.length < 50, discovered: Number(job.discovered) + ids.length, skipped: Number(job.skipped) + existing.size, step_attempts: 0, last_error: null }); return { progressed: true };
    }
    const item = await wooRequest<WooProduct>(credentialsFromIntegration(integration), 'products/' + job.queue[job.cursor]);
    if (item.id !== job.queue[job.cursor]) throw new Error('A loja retornou um produto diferente do solicitado.');
    const productId = await importWooProduct(integration, item, { metadataOnly: true });
    const { data: product, error: productError } = await db.from('products').select('import_incomplete').eq('id', productId).eq('store_id', job.store_id).maybeSingle(); if (productError) throw productError;
    if (!product?.import_incomplete) { await finishProduct(); return { progressed: true }; }
    const embedded = [...(item.description || '').matchAll(/<img\b[^>]*?\ssrc=['"](https:\/\/[^'"]+)['"]/gi)].map(match => match[1]);
    const images = [...new Set([...(item.images || []).flatMap(image => image.src ? [image.src] : []), ...embedded])].slice(0, 10);
    const assets: Asset[] = [...images.map((url, index) => ({ kind: 'image' as const, url, index })), ...(item.downloads || []).filter(file => file.file).slice(0, 10).map((file, index) => ({ kind: 'delivery' as const, url: file.file!, name: file.name, index }))];
    await receipt({ product_id: productId, assets, asset_cursor: 0, step_attempts: 0, last_error: null }); return { progressed: true };
  } catch (error) {
    const message = safeWooError(error);
    if ([401, 403].includes((error as { status?: number }).status || 0) && !job.product_id) await receipt({ status: 'paused', last_error: message, step_attempts: 0 });
    else if (job.step_attempts >= 3) await issue(message);
    else await receipt({ last_error: message, next_attempt_at: new Date(Date.now() + job.step_attempts * 5000).toISOString() });
    return { retrying: true };
  }
}
