import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { isRealSupabaseConfigured, supabaseAdmin } from './supabase';

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

function consumeLocalRateLimit(request: Request, options: RateLimitOptions, now = Date.now()): RateLimitResult {
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

export async function consumeRequestRateLimit(request: Request, options: RateLimitOptions, now = Date.now()): Promise<RateLimitResult> {
  const identity = requestIdentity(request);
  if (isRealSupabaseConfigured()) {
    const { data, error } = await supabaseAdmin.rpc('consume_api_rate_limit', {
      p_key: `${options.namespace}:${identity}`,
      p_limit: options.limit,
      p_window_seconds: Math.max(1, Math.ceil(options.windowMs / 1000)),
    });
    const row = Array.isArray(data) ? data[0] : data;
    if (!error && row) {
      return {
        allowed: Boolean(row.allowed),
        limit: options.limit,
        remaining: Math.max(0, Number(row.remaining) || 0),
        retryAfterSeconds: Math.max(1, Number(row.retry_after_seconds) || 1),
      };
    }
    console.error('[rate-limit] Limite compartilhado indisponível; usando proteção local.', error);
  }
  return consumeLocalRateLimit(request, options, now);
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
