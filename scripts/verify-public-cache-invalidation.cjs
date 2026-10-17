const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText, { exports, require: name => mocks[name] || require(name), Request, Response, Headers, crypto: require('node:crypto').webcrypto, console: { warn() {} } });
  return exports;
}
async function main() {
  const calls = [];
  const pending = [];
  let fail = false;
  const invalidation = load('src/lib/public-cache-invalidation.ts', {
    'server-only': {}, 'next/cache': {
      revalidateTag: (tag, profile) => { assert.equal(tag, 'public-catalog'); assert.equal(profile.expire, 0); pending.push(() => calls.push('data')); },
      revalidatePath: (path, type) => { assert.equal(path, '/'); assert.equal(type, 'layout'); pending.push(() => calls.push('framework')); },
    }, '@/lib/public-cache-runtime': {
      flushPublicRevalidations: async () => { for (const task of pending.splice(0)) await Promise.resolve().then(task); },
      rotatePublicCacheRevision: async () => { assert.equal(pending.length, 0); calls.push('edge'); if (fail) throw Error('KV offline'); },
    },
  });
  assert.equal(await invalidation.invalidatePublicCatalog(), true);
  assert.deepEqual(calls, ['data', 'framework', 'edge']);
  fail = true;
  assert.equal(await invalidation.invalidatePublicCatalog(), false, 'Cache outage never claims the already-saved DB update failed');
  let attempts = 0, waited = 0, drained = false;
  const adapter = load('cloudflare/public-cache-runtime.js', {
    'cloudflare:workers': { env: { VINEXT_KV_CACHE: { put: async (key, revision) => {
      assert.equal(key, 'public-html:revision:v1'); assert.match(revision, /^\d+:[\da-f-]+$/);
      if (++attempts === 1) throw Error('429 rate limit');
    } } } },
    'next/cache': { _drainPendingRevalidations: async () => { drained = true; } },
    './cache-revision.js': { PUBLIC_CACHE_REVISION_KEY: 'public-html:revision:v1' },
  });
  await adapter.flushPublicRevalidations(); assert.equal(drained, true);
  await adapter.rotatePublicCacheRevision(async ms => { waited = ms; });
  assert.equal(attempts, 2); assert.equal(waited, 1100);
  let authenticated = true, owner = true, purges = 0, allowed = true;
  const route = load('src/app/api/cache/public-revalidate/route.ts', {
    '@/lib/api-auth': { getRequestUser: async () => authenticated ? { id: 'owner' } : null },
    '@/lib/supabase': { supabaseAdmin: { from(table) {
      assert.equal(table, 'stores'); const filters = {};
      const q = { select: () => q, eq: (key, value) => { filters[key] = value; return q; },
        maybeSingle: async () => { assert.equal(filters.creator_id, 'owner'); return { data: owner ? { id: filters.id } : null, error: null }; } };
      return q;
    } } },
    '@/lib/public-cache-invalidation': { invalidatePublicCatalog: async () => { purges++; return true; } },
    '@/lib/request-rate-limit': { consumeRequestRateLimit: async req => {
      assert.equal(req.headers.get('x-forwarded-for'), '203.0.113.5');
      assert.equal(req.headers.get('x-vercel-forwarded-for'), null);
      return { allowed };
    }, rateLimitResponse: () => new Response(null, { status: 429 }) },
  });
  const request = () => new Request('https://www.educalizando.com.br/api/cache/public-revalidate', { method: 'POST', headers: {
    'Content-Type': 'application/json', 'cf-connecting-ip': '203.0.113.5', 'x-forwarded-for': 'spoofed', 'x-vercel-forwarded-for': 'spoofed',
  }, body: JSON.stringify({ storeId: '11111111-1111-4111-8111-111111111111' }) });
  const success = await route.POST(request());
  assert.equal(success.status, 200, 'Rate-limit identity must not consume the JSON body');
  assert.match(success.headers.get('Cache-Control'), /private, no-store/);
  assert.equal(purges, 1);
  owner = false; assert.equal((await route.POST(request())).status, 403); assert.equal(purges, 1);
  authenticated = false; assert.equal((await route.POST(request())).status, 401); assert.equal(purges, 1);
  authenticated = true; allowed = false; assert.equal((await route.POST(request())).status, 429); assert.equal(purges, 1);
  console.log('PASS invalidação: dados antes do HTML, erro de KV sem falso erro de cadastro, autenticação, tenant, corpo preservado e limite por IP confiável.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
