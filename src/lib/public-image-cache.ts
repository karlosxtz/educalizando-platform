import { after } from 'next/server';

/** Used only after a route validates the public bucket and key prefix.
 * No private downloads, authorization headers, or error responses enter this cache. */
export function publicImageCache(request: Request, bucket: string, key: string) {
  const cache = typeof caches === 'undefined' ? undefined : (caches as CacheStorage & { default?: Cache }).default;
  const url = new URL(request.url);
  url.search = new URLSearchParams({ bucket, key }).toString();
  const cacheKey = new Request(url, { method: 'GET' });
  return {
    async match(): Promise<Response | undefined> {
      if (!cache) return undefined;
      try {
        const response = await cache.match(cacheKey);
        if (!response) return undefined;
        const hit = new Response(response.body, response);
        hit.headers.set('X-Public-Image-Cache', 'HIT');
        return hit;
      } catch { return undefined; }
    },
    store(response: Response) {
      response.headers.set('X-Public-Image-Cache', cache ? 'MISS' : 'BYPASS');
      if (!cache || response.status !== 200 || !response.headers.get('Content-Type')?.startsWith('image/')) return;
      const copy = response.clone();
      after(async () => {
        try { await cache.put(cacheKey, copy); }
        catch { console.warn('[public-image-cache] Não foi possível armazenar a imagem pública.'); }
      });
    },
  };
}
