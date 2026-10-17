import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const config = JSON.parse(fs.readFileSync('.cloudflare/output/v0/workers/default/wrangler.deploy.json', 'utf8'));
const builtWorker = fs.readFileSync(path.resolve('.cloudflare/output/v0/workers/default', config.main), 'utf8');
assert.match(builtWorker, /["'`]public, max-age=0, no-cache, must-revalidate["'`]/,
  'Published artifact must contain the non-cacheable transition policy, not just cached HTML policy');
assert.equal(config.assets.run_worker_first, false);
assert.equal(config.assets.binding, 'ASSETS');
assert.equal(config.kv_namespaces.length, 1);
assert.equal(config.kv_namespaces[0].binding, 'VINEXT_KV_CACHE');
for (const name of ['images', 'r2_buckets', 'd1_databases', 'durable_objects']) assert.equal(config[name], undefined);
assert.match(fs.readFileSync('.cloudflare/output/v0/workers/default/assets/_headers', 'utf8'), /max-age=31536000, immutable/);
const target = '.cloudflare/cost-worker-contract.mjs';
await build({ entryPoints: ['cloudflare/worker.js'], bundle: true, platform: 'node', format: 'esm', outfile: target,
  plugins: [{ name: 'no-production-services', setup(b) {
    b.onResolve({ filter: /^vinext\/server\/fetch-handler$/ }, () => ({ path: 'app', namespace: 'fixture' }));
    b.onResolve({ filter: /(?:woo-import-queue|store-webhook-delivery)\.ts$/ }, () => ({ path: 'scheduled', namespace: 'fixture' }));
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ loader: 'js', contents: args.path === 'app'
      ? `export default { async fetch() { globalThis.renderCalls++; return new Response('<h1>Público</h1>', { headers: { 'Content-Type': 'text/html', 'X-Educalizando-Public-Document': '1' } }); } };`
      : `export async function processWooImport(){};export async function dispatchStoreWebhooks(){return {schemaReady:true,receiptErrors:0}};` }));
  } }],
});
globalThis.renderCalls = 0;
const entries = new Map(), tasks = [];
globalThis.caches = { default: {
  match: async key => entries.get(key.url)?.clone(),
  put: async (key, response) => entries.set(key.url, new Response(await response.arrayBuffer(), response)),
} };
let revision = 'initial', kvReads = 0, assets = 0;
const env = { VINEXT_KV_CACHE: { get: async () => { kvReads++; return revision; } },
  ASSETS: { fetch: async () => { assets++; return new Response('static'); } } };
const ctx = { waitUntil: task => tasks.push(task) };
const { default: worker } = await import(pathToFileURL(path.resolve(target)).href);
const get = (path, headers) => worker.fetch(new Request('https://www.educalizando.com.br' + path, { headers }), env, ctx);
assert.equal((await get('/_next/static/chunks/hash.js')).status, 200);
assert.equal(assets, 1); assert.equal(kvReads, 0); assert.equal(globalThis.renderCalls, 0);
assert.equal((await get('/.env')).status, 404); assert.equal(globalThis.renderCalls, 0);
const image = await get('/media/catalogo/uploads/test.webp');
assert.equal(image.status, 301); assert.equal(await image.text(), ''); assert.equal(kvReads, 0);
const first = await get('/');
assert.equal(first.headers.get('X-Educalizando-Page-Cache'), 'MISS');
assert.match(first.headers.get('Cache-Control'), /s-maxage=3600/);
assert.match(first.headers.get('Cache-Control'), /stale-while-revalidate=300/);
assert.equal(first.headers.get('Cloudflare-CDN-Cache-Control'), 'no-store');
await first.text(); await Promise.all(tasks.splice(0));
const calls = globalThis.renderCalls;
assert.equal((await get('/')).headers.get('X-Educalizando-Page-Cache'), 'HIT');
assert.equal(globalThis.renderCalls, calls);
revision = 'after-save';
assert.equal((await get('/')).headers.get('X-Educalizando-Page-Cache'), 'MISS');
await Promise.all(tasks.splice(0));
for (const [pathname, headers] of [['/', { Cookie: 'session=private' }], ['/', { RSC: '1' }], ['/api/example', {}], ['/loja/store/checkout', {}], ['/dashboard', {}], ['/aluno', {}], ['/login', {}]]) {
  const before = kvReads, response = await get(pathname, headers);
  assert.match(response.headers.get('Cache-Control'), /private, no-store/);
  assert.equal(response.headers.get('X-Educalizando-Page-Cache'), null);
  assert.equal(kvReads, before, 'No additional KV control lookup for private requests');
}
console.log('PASS contrato do build: assets-first, mesmo KV, nenhum Images/R2/D1/DO, imagens sem bytes no Worker, HTML MISS/HIT/invalidação, áreas privadas sem cache/KV adicional.');
