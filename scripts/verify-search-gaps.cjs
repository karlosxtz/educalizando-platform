const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
const React = require('react'), { renderToStaticMarkup } = require('react-dom/server');
function load(file, mocks = {}, globals = {}) {
  const exports = {};
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const localRequire = name => Object.hasOwn(mocks, name) ? mocks[name] : name.startsWith('.') ? load(path.resolve(path.dirname(file), name + '.ts'), mocks, globals) : require(name);
  vm.runInNewContext(output, { exports, require: localRequire, Response, Request, URL, Date, Intl, TextDecoder, setTimeout, clearTimeout, AbortController, console, ...globals }); return exports;
}
const helpers = load('src/lib/store-search-gaps.ts');
assert.equal(helpers.safeGapQuery('  Alfabetização  ').normalized, 'alfabetizacao');
for (const value of ['ab', '', '123', 'contato@example.com', '5511999999999', 'https://example.com', '<script>', 'senha:abc', 'CPF 123.456.789-01']) assert.equal(helpers.safeGapQuery(value), null, value);
assert.ok(helpers.safeGapQuery('atividade para 3 ano'));
const product = { titulo: 'Dia da Árvore', descricao: 'Natureza e cuidado', tags: ['preservação'], seasonal_tags: ['Meio Ambiente'] };
for (const term of ['arvore', 'NATUREZA', 'preservacao', 'meio ambiente', '']) assert.equal(helpers.matchesStoreSearch(product, term), true);
assert.equal(helpers.matchesStoreSearch(product, 'matemática'), false);

async function apiChecks() {
  let logged = true, storeError = null, rpcError = null, insertError = null, calls = [];
  const db = {
    from(table) { const chain = { select(value) { calls.push([table, 'select', value]); return this; }, eq(...args) { calls.push([table, 'eq', ...args]); return this; }, order() { return this; }, limit() { return this; }, async maybeSingle() { return { data: { id: '00000000-0000-0000-0000-000000000001', nome_loja: 'Minha Loja' }, error: storeError }; }, async insert(data) { calls.push([table, 'insert', data]); return { error: insertError }; } }; return chain; },
    async rpc(name, args) { calls.push([name, args]); return { data: { total: 0, terms: [] }, error: rpcError }; },
  };
  const mocks = { '@/lib/supabase': { supabaseAdmin: db }, '@/lib/api-auth': { getRequestUser: async () => logged ? { id: 'creator' } : null }, '@/lib/store-search-gaps': helpers, '@/lib/request-rate-limit': { consumeRequestRateLimit: async () => ({ allowed: true }), rateLimitResponse: () => new Response('', { status: 429 }) } };
  const { GET } = load('src/app/api/creator/search-gaps/route.ts', mocks);
  let response = await GET(new Request('https://site.test/api/creator/search-gaps?storeId=foreign'));
  assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /no-store/);
  assert.ok(calls.some(call => call.join('|') === 'stores|eq|creator_id|creator'));
  assert.equal(calls.find(call => call[0] === 'report_store_search_gaps')[1].p_store_id, '00000000-0000-0000-0000-000000000001');
  calls = []; logged = false; assert.equal((await GET(new Request('https://site.test/api/creator/search-gaps'))).status, 401); assert.equal(calls.length, 0); logged = true;
  assert.equal((await GET(new Request('https://site.test/api/creator/search-gaps?days=999'))).status, 400);
  rpcError = { code: 'PGRST202' }; assert.equal((await (await GET(new Request('https://site.test/api/creator/search-gaps'))).json()).available, false);
  rpcError = { code: 'XX000' }; assert.equal((await GET(new Request('https://site.test/api/creator/search-gaps'))).status, 503); rpcError = null;
  const { POST } = load('src/app/api/store-search-gaps/route.ts', mocks);
  const body = { id: '10000000-0000-0000-0000-000000000001', storeId: '00000000-0000-0000-0000-000000000001', query: 'Alfabetização', scope: 'catalog', filters: { category: 'all', education: 'all', collection: 'all' } };
  const request = (value = body, origin = 'https://site.test') => new Request('https://site.test/api/store-search-gaps', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(value) });
  calls = []; assert.equal((await POST(request())).status, 201);
  const inserted = calls.find(call => call[0] === 'store_search_gaps')[2];
  assert.equal(inserted.normalized_query, 'alfabetizacao'); assert.equal(inserted.query, 'alfabetização'); assert.ok(!('ip' in inserted));
  assert.equal((await POST(request(body, 'https://foreign.test'))).status, 403);
  assert.equal((await POST(request({ ...body, query: 'meuemail@example.com' }))).status, 400);
  assert.equal((await POST(request({ ...body, padding: 'x'.repeat(3000) }))).status, 413);
  insertError = { code: '23505' }; assert.equal((await (await POST(request())).json()).duplicate, true);
  insertError = { code: '42P01' }; assert.equal((await (await POST(request())).json()).recorded, false);
}

function hookChecks() {
  let cleanup, timer, sent = [], storage = new Map();
  const ref = { current: [] };
  const react = { useRef: () => ref, useEffect: effect => { cleanup = effect(); } };
  const navigator = { doNotTrack: '0', userAgent: 'normal-browser' };
  const { useSearchGapTracking } = load('src/components/store/useSearchGapTracking.ts', { react, '@/lib/store-search-gaps': helpers }, {
    navigator, document: { visibilityState: 'visible' }, localStorage: { getItem: key => storage.get(key) || null }, sessionStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    crypto: require('node:crypto').webcrypto, fetch: (url, init) => { sent.push(JSON.parse(init.body)); return Promise.resolve(new Response('{}')); },
    setTimeout: callback => { timer = callback; return 1; }, clearTimeout: () => { timer = null; },
  });
  const props = { storeId: 'store', query: 'matemática', resultCount: 0, unfilteredCount: 0, enabled: true, filters: { category: 'all', education: 'all', collection: 'all' } };
  useSearchGapTracking(props); assert.equal(sent.length, 0, 'Wait for typing to settle'); timer(); assert.equal(sent.length, 1); assert.equal(sent[0].scope, 'catalog');
  useSearchGapTracking(props); timer(); assert.equal(sent.length, 1, 'Same query/filter session is deduplicated');
  useSearchGapTracking({ ...props, query: 'ciências', unfilteredCount: 2, filters: { ...props.filters, collection: 'plr' } }); timer(); assert.equal(sent[1].scope, 'filters');
  useSearchGapTracking({ ...props, query: 'geografia' }); cleanup(); assert.equal(timer, null, 'Typing cancels the pending event');
  useSearchGapTracking({ ...props, query: 'história' }); navigator.doNotTrack = '1'; timer(); assert.equal(sent.length, 2); navigator.doNotTrack = '0';
  storage.set('educalizando_metrics_consent_store', 'rejected'); useSearchGapTracking({ ...props, query: 'português' }); timer(); assert.equal(sent.length, 2);
  timer = null; useSearchGapTracking({ ...props, resultCount: 1 }); assert.equal(timer, null);
}
function uiChecks() {
  function render(report) {
    const states = [report, 30, 'all', '', false, '', '', 0];
    const react = { ...React, useState: initial => React.useState(states.length ? states.shift() : initial) };
    const Component = load('src/app/dashboard/buscas-sem-resultado/page.tsx', { react, '@/lib/store-search-gaps': helpers, '@/lib/client-api': {}, '@/lib/api-response': {}, 'next/link': { default: props => React.createElement('a', props, props.children) } }).default;
    return renderToStaticMarkup(React.createElement(Component));
  }
  assert.match(render({ available: false, store: { nome_loja: 'Minha Loja' } }), /Relatório aguardando ativação/);
  assert.match(render({ available: true, total: 0, terms: [], store: { nome_loja: 'Minha Loja' } }), /Nenhuma busca sem resultado registrada/);
  const html = render({ available: true, total: 3, catalog_total: 2, filtered_total: 1, distinct_terms: 1, store: { nome_loja: 'Minha Loja' }, terms: [{ term: 'alfabetização', count: 3, catalog_count: 2, filtered_count: 1, last_seen: '2026-10-16T12:00:00Z' }] });
  assert.match(html, /Copiar tema/); assert.match(html, /Exportar lista exibida/); assert.match(html, /Criar material/); assert.match(html, /não visitantes únicos/);
}
Promise.resolve().then(apiChecks).then(hookChecks).then(uiChecks).then(() => console.log('PASS: search parity, privacy filtering, scoped report API, tiny public intake, migration wait, debounce, session deduplication, DNT/consent and real React report rendering.')).catch(error => { console.error(error); process.exitCode = 1; });
