import app from 'vinext/server/fetch-handler';
import { canonicalHostRedirect } from '../src/lib/canonical-host.ts';
import { applyResponseCachePolicy } from './response-cache-policy.js';
import { publicImageRedirect } from '../src/lib/public-image-url.ts';
import { fetchPublicPage, publicPageCacheKey } from './public-page-cache.js';
import { readPublicCacheRevision } from './cache-revision.js';
import { rejectScannerRequest } from './traffic-guard.js';
import { catalogImageResponse } from './catalog-image-cache.js';
export * from 'vinext/server/fetch-handler';

export default {
  ...app,
  async scheduled(_controller, _env, ctx) {
    ctx.waitUntil(import('../src/lib/woo-import-queue.ts').then(module => module.processWooImport()).catch(() => console.error('woo_import_queue_unavailable')));
    ctx.waitUntil(import('../src/lib/store-webhook-delivery.ts').then(module => module.dispatchStoreWebhooks()).then(result => {
      if (!result.schemaReady || result.receiptErrors) console.error('store_webhook_queue_attention');
    }).catch(() => console.error('store_webhook_queue_unavailable')));
  },
  async fetch(request, env, ctx) {
    const canonical = canonicalHostRedirect(request);
    if (canonical) return canonical;
    const rejected = rejectScannerRequest(request);
    if (rejected) return rejected;
    if (new URL(request.url).pathname.startsWith('/_next/static/')) return env.ASSETS.fetch(request);
    const catalogImage = await catalogImageResponse(request, ctx);
    if (catalogImage) return catalogImage;
    const image = publicImageRedirect(request);
    const revision = !image && publicPageCacheKey(request) ? await readPublicCacheRevision(env.VINEXT_KV_CACHE) : null;
    return applyResponseCachePolicy(request, image || await fetchPublicPage(request, ctx, () => app.fetch(request, env, ctx), undefined, revision));
  },
};
