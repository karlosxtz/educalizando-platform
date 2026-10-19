const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}, globals = {}) {
  const output = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports: output, require: name => name === 'server-only' ? {} : mocks[name] || require(name), Request, Response, Headers, URL, URLSearchParams, AbortSignal, console, ...globals });
  return output;
}
const uid = '11111111-1111-4111-8111-111111111111';
const store = '22222222-2222-4222-8222-222222222222';
const product = '33333333-3333-4333-8333-333333333333';
const other = '44444444-4444-4444-8444-444444444444';
const conversion = load('src/lib/conversion-events.ts');
const event = { storeId: store, productId: product, stage: 'view' };
for (const body of [null, {}, { sessionId: uid, events: [event] }, { consent: true, sessionId: 'bad', events: [event] }, { consent: true, sessionId: uid, events: [{ ...event, stage: 'purchase' }] }, { consent: true, sessionId: uid, events: Array(21).fill(event) }]) assert.equal(conversion.cleanConversionBatch(body), null);
const cleaned = conversion.cleanConversionBatch({ consent: true, sessionId: uid, buyer_email: 'private@example.test', events: [event, { ...event, buyer_email: 'private@example.test' }] });
assert.equal(cleaned.events.length, 1); assert(!JSON.stringify(cleaned).includes('private'));

function database(results) {
  const calls = []; const writes = [];
  return { calls, writes, from(table) {
    calls.push({ table, filters: [] }); const call = calls[calls.length - 1];
    const query = {};
    for (const method of ['select', 'eq', 'in', 'is', 'order', 'range', 'limit', 'gte', 'lt', 'or']) query[method] = (...args) => { call.filters.push([method, ...args]); return query; };
    for (const method of ['upsert', 'insert', 'delete']) query[method] = (...args) => { writes.push({ table, method, args }); return query; };
    const result = () => results[table] || { data: [], error: null };
    query.then = (resolve, reject) => Promise.resolve(result()).then(resolve, reject);
    query.maybeSingle = query.single = () => Promise.resolve(result());
    return query;
  } };
}
const allowed = { consumeRequestRateLimit: async () => ({ allowed: true }), rateLimitResponse: () => new Response(null, { status: 429 }) };
const bodyRequest = (path, body) => new Request('https://www.educalizando.com.br' + path, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });

(async () => {
  let user = null;
  const auth = { getRequestUser: async () => user };
  const followsDb = database({ stores: { data: { id: store }, error: null } });
  const follows = load('src/app/api/customer/followed-stores/route.ts', { '@/lib/api-auth': auth, '@/lib/supabase': { supabaseAdmin: followsDb }, '@/lib/request-rate-limit': allowed, '@/lib/conversion-events': conversion });
  assert.equal((await follows.POST(bodyRequest('/api/customer/followed-stores', { storeId: store, following: true }))).status, 401);
  assert.equal(followsDb.calls.length, 0);
  user = { id: uid, email: 'buyer@example.test' };
  const saved = await follows.POST(bodyRequest('/api/customer/followed-stores', { userId: other, storeId: store, following: true }));
  assert.equal(saved.status, 200);
  assert.equal(followsDb.writes[0].args[0].user_id, uid);
  assert.equal(followsDb.writes[0].args[0].notifications_enabled, false);
  await follows.POST(bodyRequest('/api/customer/followed-stores', { storeId: store, following: false }));
  const deletion = followsDb.calls.at(-1);
  assert(deletion.filters.some(([method, field, value]) => method === 'eq' && field === 'user_id' && value === uid));
  assert(deletion.filters.some(([method, field, value]) => method === 'eq' && field === 'store_id' && value === store));

  const ingestDb = database({ products: { data: [{ id: product, store_id: store }], error: null } });
  const ingest = load('src/app/api/catalog-conversion/route.ts', { '@/lib/supabase': { supabaseAdmin: ingestDb }, '@/lib/conversion-events': conversion, '@/lib/request-rate-limit': allowed });
  assert.equal((await ingest.POST(bodyRequest('/api/catalog-conversion', { consent: true, sessionId: uid, events: [{ ...event, storeId: other }] }))).status, 400);
  assert.equal(ingestDb.writes.length, 0);
  assert.equal((await ingest.POST(bodyRequest('/api/catalog-conversion', { consent: true, sessionId: uid, events: [event] }))).status, 200);
  assert.equal(ingestDb.writes[0].args[0][0].store_id, store);
  assert.equal(ingestDb.writes[0].args[0][0].session_id, uid);

  const privateDb = database({ stores: { data: null, error: null } });
  const report = load('src/app/api/dashboard/conversion/route.ts', { '@/lib/api-auth': auth, '@/lib/supabase': { supabaseAdmin: privateDb }, '@/lib/conversion-events': conversion });
  assert.equal((await report.GET(new Request(`https://www.educalizando.com.br/api/dashboard/conversion?storeId=${store}`))).status, 403);
  assert.equal(privateDb.calls.length, 1);
  assert(privateDb.calls[0].filters.some(([method, field, value]) => method === 'eq' && field === 'creator_id' && value === uid));

  for (const scenario of ['not-bought', 'creator', 'bought']) {
    const db = database({ products: { data: { id: product, store_id: store, stores: { creator_id: scenario === 'creator' ? uid : other } }, error: null }, orders: { data: scenario === 'bought' ? [{ id: other }] : [], error: null }, order_items: { data: [{ id: other }], error: null }, reviews: { data: { id: product }, error: null } });
    const write = load('src/lib/product-review-write.ts', { './supabase': { supabaseAdmin: db } }, { process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://configured.supabase.co' } } });
    const result = await write.writeVerifiedProductReview(user, { productId: product, storeId: store, studentId: other, nota: 5, comentario: 'Comentário de teste' });
    assert.equal(result.success, scenario === 'bought');
    if (scenario === 'bought') { assert.equal(db.writes[0].args[0].student_id, uid); assert.equal(db.writes[0].args[0].store_id, store); }
    else assert.equal(db.writes.length, 0);
  }

  const values = new Map(); const sessions = new Map(); const tasks = []; const requests = [];
  const client = load('src/lib/conversion-client.ts', { './platform-analytics': { PLATFORM_CONSENT_KEY: 'consent' }, './conversion-events': conversion }, {
    localStorage: { getItem: key => values.get(key) || null }, sessionStorage: { getItem: key => sessions.get(key), setItem: (key, value) => sessions.set(key, value), removeItem: key => sessions.delete(key) },
    crypto: { randomUUID: () => uid }, setTimeout: task => { tasks.push(task); return 1; }, clearTimeout: () => {},
    fetch: async (...args) => { requests.push(args); return { ok: true }; },
  });
  client.recordConversion(event); assert.equal(tasks.length, 0); assert.equal(sessions.size, 0);
  values.set('consent', 'accepted'); client.recordConversion(event); client.recordConversion(event);
  tasks.shift()(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(requests.length, 1); assert.equal(JSON.parse(requests[0][1].body).events.length, 1);
  client.recordConversion(event); assert.equal(tasks.length, 0);
  client.recordConversion({ ...event, stage: 'cart' }); values.set('consent', 'rejected'); tasks.shift()(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(requests.length, 1); assert.equal(sessions.size, 0);

  const suggestions = load('src/lib/search-suggestions.ts', { './category-service': { INITIAL_GLOBAL_CATEGORIES: [{ nome: 'Alfabetização', slug: 'alfabetizacao' }] }, './school-calendar': { SCHOOL_CALENDAR_TAGS: ['Dia da Árvore'] }, './search-matching': { normalizeSearchText: value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() } });
  assert.equal(suggestions.discoverySuggestions('alfabetizacao')[0].href, '/buscar?categoria=alfabetizacao');
  assert.equal(suggestions.discoverySuggestions('árvore')[0].kind, 'Tema');
  assert.equal(suggestions.discoverySuggestions('a').length, 0);
  console.log('PASS buyer growth: private follows, explicit opt-in, tenant ownership, verified purchase writes, consent gating, deduplication, withdrawal and accent-aware discovery.');
})().catch(error => { console.error(error); process.exitCode = 1; });
