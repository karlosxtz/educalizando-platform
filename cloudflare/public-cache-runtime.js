import { env } from 'cloudflare:workers';
import { _drainPendingRevalidations } from 'next/cache';
import { PUBLIC_CACHE_REVISION_KEY } from './cache-revision.js';

// Vinext revalidateTag/revalidatePath return void and enqueue their KV writes.
// This adapter is deliberately tied to the installed Vinext runtime, not Next.
export async function flushPublicRevalidations() {
  await _drainPendingRevalidations();
}

export async function rotatePublicCacheRevision(wait = ms => new Promise(resolve => setTimeout(resolve, ms))) {
  if (!env.VINEXT_KV_CACHE) throw new Error('Cache público compartilhado indisponível.');
  const revision = `${Date.now()}:${crypto.randomUUID()}`;
  try { await env.VINEXT_KV_CACHE.put(PUBLIC_CACHE_REVISION_KEY, revision); }
  catch (error) {
    // KV limits writes to one key per second. A single bounded retry handles
    // ordinary concurrent saves without an unbounded bill/retry loop.
    if (!/429|rate.?limit|too many/i.test(String(error))) throw error;
    await wait(1100);
    await env.VINEXT_KV_CACHE.put(PUBLIC_CACHE_REVISION_KEY, revision);
  }
}
