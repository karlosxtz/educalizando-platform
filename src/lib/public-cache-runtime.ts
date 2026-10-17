/** Node/local builds have no separate Cloudflare edge HTML cache. */
export async function rotatePublicCacheRevision(): Promise<void> {}
export async function flushPublicRevalidations(): Promise<void> {}
