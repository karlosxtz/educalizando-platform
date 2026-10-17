/* global EDUCALIZANDO_BUILD_ID */
const version = typeof EDUCALIZANDO_BUILD_ID === 'string' ? EDUCALIZANDO_BUILD_ID : 'local';
const publicPage = /^(?:\/$|\/(?:materiais-didaticos|recursos-pedagogicos|atividades-alfabetizacao|educacao-infantil|planos-de-aula-bncc|atividades-para-imprimir|jogos-pedagogicos|atividades-ensino-fundamental)$|\/lojas$|\/ofertas$|\/produto\/[^/]+$|\/categorias\/[^/]+$|\/kit\/[^/]+$|\/loja\/[^/]+(?:\/(?:produto\/[^/]+|kit\/[^/]+))?$|\/clube\/[^/]+$|\/sitemap[^/]*\.xml$)/;
const variantHeaders = ['RSC', 'Next-Router-State-Tree', 'Next-Router-Prefetch', 'Next-Router-Segment-Prefetch', 'Next-Url', 'Range'];
const pending = new Map();
export const PUBLIC_HTML_TTL = 3600;
export const PUBLIC_HTML_STALE = 300;
export const PUBLIC_REVISION_SETTLE_MS = 120_000;

export function publicPageCacheKey(request, revision = 'initial') {
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.protocol !== 'https:' || url.hostname !== 'www.educalizando.com.br'
    || !publicPage.test(url.pathname) || url.search || request.headers.has('Cookie')
    || request.headers.has('Authorization') || variantHeaders.some(name => request.headers.has(name))
    || request.headers.get('Accept')?.includes('text/x-component')
    || /no-cache|no-store/i.test(request.headers.get('Cache-Control') || '')) return null;
  url.pathname = '/__educalizando_edge/' + version + '/' + encodeURIComponent(revision) + url.pathname;
  return new Request(url.toString(), { method: 'GET' });
}

export function canCachePublicPage(response) {
  return response.status === 200 && !response.headers.has('Set-Cookie')
    && response.headers.get('X-Educalizando-Public-Document') === '1'
    && /(?:text\/html|application\/xml|text\/xml)/i.test(response.headers.get('Content-Type') || '')
    && !response.headers.has('Content-Encoding') && response.headers.get('Vary') !== '*';
}

function marked(response, state) {
  const headers = new Headers(response.headers);
  headers.set('X-Educalizando-Page-Cache', state);
  // Shared HTML is managed by the application cache, whose keys include the
  // catalogue revision. A second independent CDN cache could defeat invalidation.
  headers.set('Cache-Control', `public, max-age=0, no-cache, must-revalidate, s-maxage=${PUBLIC_HTML_TTL}, stale-while-revalidate=${PUBLIC_HTML_STALE}`);
  headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
  headers.set('CDN-Cache-Control', 'no-store');
  headers.delete('X-Educalizando-Cached-At');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function uncachedPublic(response) {
  if (!canCachePublicPage(response)) return response;
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'public, max-age=0, no-cache, must-revalidate');
  headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
  headers.set('CDN-Cache-Control', 'no-store');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export async function fetchPublicPage(request, ctx, render, cache = globalThis.caches?.default, revision = 'initial', now = Date.now) {
  // KV tags and the revision propagate independently across regions. Do not
  // promote an ISR response to a fresh 1h edge entry during that transition.
  const changedAt = Number(/^([0-9]+):/.exec(revision || '')?.[1]);
  if (changedAt && now() - changedAt < PUBLIC_REVISION_SETTLE_MS) return uncachedPublic(await render());
  const key = revision === null ? null : publicPageCacheKey(request, revision);
  if (!key || !cache) {
    const response = await render();
    return publicPageCacheKey(request) ? uncachedPublic(response) : response;
  }
  async function fill() {
    const response = await render();
    if (!canCachePublicPage(response)) return response;
    if ([response.headers.get('X-Vinext-Cache'), response.headers.get('x-nextjs-cache')]
      .some(state => state?.toUpperCase() === 'STALE')) return uncachedPublic(response);
    const copy = response.clone(), headers = new Headers(copy.headers);
    headers.delete('CDN-Cache-Control'); headers.delete('Cloudflare-CDN-Cache-Control'); headers.delete('Vary');
    headers.set('Cache-Control', `public, max-age=${PUBLIC_HTML_TTL + PUBLIC_HTML_STALE}`);
    headers.set('X-Educalizando-Cached-At', String(now()));
    ctx.waitUntil(cache.put(key, new Response(copy.body, { status: copy.status, headers })).catch(() => {}));
    return marked(response, 'MISS');
  }
  try {
    const hit = await cache.match(key);
    if (hit) {
      const age = (now() - Number(hit.headers.get('X-Educalizando-Cached-At') || 0)) / 1000;
      if (age < PUBLIC_HTML_TTL) return marked(hit, 'HIT');
      if (age < PUBLIC_HTML_TTL + PUBLIC_HTML_STALE) {
        if (!pending.has(key.url)) {
          const refresh = fill().then(response => response.body?.cancel()).catch(() => {}).finally(() => pending.delete(key.url));
          pending.set(key.url, refresh); ctx.waitUntil(refresh);
        }
        return marked(hit, 'STALE');
      }
    }
  } catch { /* A cache outage must not take the site offline. */ }
  return fill();
}
