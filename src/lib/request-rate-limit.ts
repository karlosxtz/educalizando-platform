import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';

type RateLimitEntry = { count: number; resetAt: number };
type RateLimitStore = Map<string, RateLimitEntry>;

const globalRateLimit = globalThis as typeof globalThis & { __educalizandoRateLimits?: RateLimitStore };
const store = globalRateLimit.__educalizandoRateLimits || new Map<string, RateLimitEntry>();
globalRateLimit.__educalizandoRateLimits = store;

export type RateLimitOptions = { namespace: string; limit: number; windowMs: number };
export type RateLimitResult = { allowed: boolean; limit: number; remaining: number; retryAfterSeconds: number };

function requestIdentity(request: Request) {
  const forwarded = request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || '';
  const ip = forwarded.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  return createHash('sha256').update(ip).digest('hex').slice(0, 24);
}

function prune(now: number) {
  if (store.size < 5_000) return;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
  while (store.size >= 5_000) store.delete(store.keys().next().value!);
}

export function consumeRequestRateLimit(request: Request, options: RateLimitOptions, now = Date.now()): RateLimitResult {
  prune(now);
  const key = `${options.namespace}:${requestIdentity(request)}`;
  const current = store.get(key);
  const entry = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + options.windowMs }
    : current;
  entry.count += 1;
  store.set(key, entry);

  return {
    allowed: entry.count <= options.limit,
    limit: options.limit,
    remaining: Math.max(0, options.limit - entry.count),
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

export function rateLimitResponse(result: RateLimitResult) {
  return NextResponse.json({ error: 'Muitas tentativas. Aguarde um pouco e tente novamente.' }, {
    status: 429,
    headers: {
      'Retry-After': String(result.retryAfterSeconds),
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': String(result.remaining),
      'Cache-Control': 'no-store',
    },
  });
}
