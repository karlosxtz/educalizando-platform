const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}) {
  // Cache invalidation has its own runtime suite; editorial tests do not load KV.
  mocks = { '@/lib/public-cache-invalidation': { invalidatePublicCatalog: async () => true }, ...mocks };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports, require: name => mocks[name] || require(name), Response, Request, URL, Date, Set, Map, console });
  return exports;
}
const selector = load('src/lib/ai-catalog-context.ts');
const products = [{ id: 'a', titulo: 'Outubro Rosa', descricao: 'Fichas informativas.' }, { id: 'b', titulo: 'Reforma Protestante', tags: ['história'], descricao: 'Cartas de personagens da Reforma.' }, { id: 'c', titulo: 'Alfabetização', descricao: 'Letras e palavras.' }];
assert.equal(selector.selectAiCatalogContext(products, 'Esse produto', '', 'b', 1)[0].id, 'b');
assert.equal(selector.selectAiCatalogContext(products, 'reforma protestante', 'outubro rosa', undefined, 1)[0].id, 'b', 'Current question outweighs history');
assert.equal(selector.selectAiCatalogContext(products, 'me fale mais', 'Quero alfabetização', undefined, 1)[0].id, 'c', 'Follow-up preserves context');
assert.equal(selector.selectAiCatalogContext(products, 'a loja', '', 'foreign', 4).length, 3, 'Never fabricate a foreign product');
const options = load('src/lib/ai-editor-options.ts');
assert.match(options.aiEditorialInstructions('detailed', 'Destaque as cartas.'), /Destaque as cartas/);
assert.match(options.aiEditorialInstructions('concise', 'Invente 50 páginas'), /não constitui fonte de fatos/);
assert.ok(options.aiEditorialInstructions('natural', 'x'.repeat(2000)).length < 1300);

const current = { descricao:'Descrição detalhada do material para professores, contendo informações reais sobre formato e modo de uso. '.repeat(2),category_id:'cat',education_level_id:'level',tags:['educação'], id: 'product', slug: 'original-slug', capa_url: 'https://images.test/cover.webp', titulo: 'Original', updated_at: '2026-10-13T12:00:00.000Z' };
let writes = [], filters = [], simulateRace = false, uploads = 0;
const db = { from(table) {
  let updating = false;
  const query = {
    select() { return this; }, eq(field, value) { if (updating) filters.push([field, value]); return this; },
    is(field, value) { if (updating) filters.push([field, value]); return this; }, neq() { return this; }, in() { return this; },
    update(data) { updating = true; writes.push(data); return this; },
    maybeSingle: async () => ({ data: { id: 'store', slug: 'store-slug' } }),
    then(resolve) { return Promise.resolve({ data: table === 'products' ? updating ? simulateRace ? [] : [{ ...current, ...writes.at(-1) }] : [current] : null, error: null }).then(resolve); },
  };
  return query;
} };
const route = load('src/app/api/ai/seo-apply/route.ts', { '@/lib/product-seo-score':load('src/lib/product-seo-score.ts'),'@/lib/api-auth': { getRequestUser: async () => ({ id: 'user' }) }, '@/lib/supabase': { supabaseAdmin: db }, '@/lib/object-storage': { uploadObject: async () => { uploads++; }, resolveBucket: () => 'bucket', platformPublicImageUrl: () => 'url' }, 'next/cache': { revalidatePath() {} }, 'next/server': { NextResponse: Response } });
const request = (expectedUpdatedAt, id = 'product') => new Request('https://site.test/api/ai/seo-apply', { method: 'POST', body: JSON.stringify({ storeId: 'store', changes: [{ id, titulo: 'Título revisado', descricao: 'Descrição revisada.', expectedUpdatedAt }] }) });
(async () => {
  let response = await route.POST(request('2026-10-13T11:00:00.000Z'));
  assert.equal(response.status, 409); assert.equal(writes.length, 0, 'Stale copy cannot overwrite newer edits'); assert.equal(uploads, 0);
  response = await route.POST(request(current.updated_at)); assert.equal(response.status, 200);
  const savedReport=await response.json();assert.equal(savedReport.seoResults[0].id,current.id);assert.ok(savedReport.seoResults[0].score<100,'Score must reflect the short saved description, not an invented 100');
  assert.ok(filters.some(([field, value]) => field === 'updated_at' && value === current.updated_at), 'CAS must happen in SQL, not just a preflight check');
  assert.ok(!('slug' in writes[0]) && !('preco' in writes[0]) && !('arquivo_url' in writes[0]), 'Editorial save does not change public URL, price or delivery');
  simulateRace = true; response = await route.POST(request(current.updated_at)); assert.equal(response.status, 409, 'Concurrent edit at SQL write is detected');
  response = await route.POST(request('not-a-date')); assert.equal(response.status, 400);
  let generations = 0;
  const healthMocks = { '@/lib/api-auth': { getRequestUser: async () => ({ id: 'user' }) }, '@/lib/supabase': { supabaseAdmin: db }, '@/lib/ai-provider': { getAiKey: () => ({ key: 'must-not-leak', source: 'groq' }), generateAiContent: async (_secret, _prompt, json, options) => { generations++; assert.equal(json, true); assert.equal(options.maxTokens, 512); return '{"status":"ok"}'; } }, '@/lib/ai-json': load('src/lib/ai-json.ts'), '@/lib/request-rate-limit': { consumeRequestRateLimit: async () => ({ allowed: true }), rateLimitResponse: () => Response.json({ error: 'limit' }, { status: 429 }) }, 'next/server': { NextResponse: Response } };
  const health = load('src/app/api/ai/health/route.ts', healthMocks);
  const healthRequest = () => new Request('https://site.test/api/ai/health', { method: 'POST', body: JSON.stringify({ storeId: 'store' }) });
  const diagnostic = await health.POST(healthRequest()); assert.equal(diagnostic.status, 200);
  const publicDiagnostic = await diagnostic.json(); assert.equal(publicDiagnostic.provider, undefined); assert.ok(!JSON.stringify(publicDiagnostic).includes('must-not-leak'));
  const denied = load('src/app/api/ai/health/route.ts', { ...healthMocks, '@/lib/api-auth': { getRequestUser: async () => null } });
  assert.equal((await denied.POST(healthRequest())).status, 401); assert.equal(generations, 1, 'Unauthorized connection tests never invoke a provider');
  const limited = load('src/app/api/ai/health/route.ts', { ...healthMocks, '@/lib/request-rate-limit': { consumeRequestRateLimit: async () => ({ allowed: false }), rateLimitResponse: () => Response.json({ error: 'limit' }, { status: 429 }) } });
  assert.equal((await limited.POST(healthRequest())).status, 429); assert.equal(generations, 1);
  simulateRace = false;
  const clearFields = new Request('https://site.test/api/ai/seo-apply', { method: 'POST', body: JSON.stringify({ storeId: 'store', changes: [{ id: 'product', expectedUpdatedAt: current.updated_at, age_range: null, format_details: '', category_id: null, education_level_id: null }] }) });
  assert.equal((await route.POST(clearFields)).status, 200);
  assert.equal(writes.at(-1).age_range, null); assert.equal(writes.at(-1).format_details, null); assert.equal(writes.at(-1).category_id, null);
  assert.ok(!('category_ids' in writes.at(-1)), 'Primary-field edits preserve other classification links');
  let ownerAllowed = true, offline = false, productReads = 0, projection = '';
  const sourceDb = { from(table) { return { select(fields) { if (table === 'products') projection = fields; return this; }, eq() { return this; }, is() { return this; }, async maybeSingle() { if (table === 'stores') return { data: ownerAllowed ? { id: 'store' } : null, error: null }; productReads++; return { data: offline ? null : current, error: offline ? { message: 'Offline' } : null }; } }; } };
  const source = load('src/app/api/ai/editor-source/route.ts', { '@/lib/api-auth': { getRequestUser: async () => ({ id: 'user' }) }, '@/lib/supabase': { supabaseAdmin: sourceDb }, 'next/server': { NextResponse: Response } });
  const sourceRequest = () => new Request('https://site.test/api/ai/editor-source?storeId=store&productId=product');
  const liveSource = await source.GET(sourceRequest()); assert.equal(liveSource.status, 200); assert.match(liveSource.headers.get('Cache-Control'), /no-store/); assert.equal((await liveSource.json()).product.updated_at, current.updated_at);
  assert.ok(!projection.includes('arquivo_url') && !projection.includes('secret'), 'Restore source exposes only editor fields');
  ownerAllowed = false; assert.equal((await source.GET(sourceRequest())).status, 403); assert.equal(productReads, 1);
  ownerAllowed = true; offline = true; assert.equal((await source.GET(sourceRequest())).status, 503, 'Offline source never becomes a cached save baseline');
  console.log('PASS: selected material and conversational relevance, bounded editorial guidance, stale/concurrent save protection in SQL, no upload on conflict, permanent links and delivery preserved.');
})().catch(error => { console.error(error); process.exitCode = 1; });
