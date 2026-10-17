export const PUBLIC_CACHE_REVISION_KEY = 'public-html:revision:v1';

/** One existing-KV read per eligible document; never store a counter per visitor. */
export async function readPublicCacheRevision(namespace) {
  if (!namespace) return null;
  try {
    const value = await namespace.get(PUBLIC_CACHE_REVISION_KEY, { cacheTtl: 30 });
    return value || 'initial';
  } catch { return null; }
}
