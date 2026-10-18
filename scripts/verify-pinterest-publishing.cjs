const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText,
    { exports, require: name => name === 'server-only' ? {} : mocks[name] || require(name), URL, URLSearchParams, Request, Response, Headers, AbortSignal, Buffer, console, ...globals });
  return exports;
}
async function main() {
  const seo = { SITE_URL: 'https://www.educalizando.com.br' };
  const contract = load('src/lib/pinterest-contract.ts', { './seo': seo, './product-description': load('src/lib/product-description.ts'), './public-image-url': load('src/lib/public-image-url.ts') });
  const env = { PINTEREST_ENABLED: 'true', PINTEREST_APP_ID: '12345', PINTEREST_APP_SECRET: 'test-secret', PINTEREST_TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 8).toString('base64') };
  const security = load('src/lib/pinterest-security.ts', { './seo': seo, './pinterest-contract': contract }, { process: { env } });
  const disabled = load('src/lib/pinterest-security.ts', { './seo': seo, './pinterest-contract': contract }, { process: { env: {} } });
  assert.equal(disabled.pinterestConfig(), null);
  assert.equal(security.pinterestConfig().sandbox, true);
  const state = security.newPinterestState(); assert(security.validPinterestState(state, state));
  assert(!security.validPinterestState(state, 'é'.repeat(43))); assert(!security.validPinterestState(state, undefined));
  const oauth = new URL(security.pinterestAuthorizationUrl(state));
  assert.equal(oauth.searchParams.get('redirect_uri'), seo.SITE_URL + '/api/creator/pinterest/callback');
  assert(!oauth.href.includes('test-secret'));
  const encrypted = security.encryptPinterest('private-test-token', 'store-a');
  assert.equal(security.decryptPinterest(encrypted, 'store-a'), 'private-test-token');
  assert.throws(() => security.decryptPinterest(encrypted, 'store-b'));
  let tenantFilters = [], user = null;
  const contextDb = { from(table) {
    assert.equal(table, 'stores');
    return { select() { return this; }, eq(key, value) { tenantFilters.push([key, value]); return this; }, order() { return this; }, limit() { return this; }, maybeSingle: async () => ({ data: { id: 'store-a' }, error: null }) };
  } };
  const context = load('src/lib/pinterest-store.ts', { './supabase': { supabaseAdmin: contextDb }, './api-auth': { getRequestUser: async () => user }, './seo': seo, './pinterest-security': security, './pinterest-provider': {} });
  await assert.rejects(context.pinterestContext(new Request(seo.SITE_URL + '/api/creator/pinterest')), error => error.status === 401);
  assert.equal(tenantFilters.length, 0);
  user = { id: 'creator-a' };
  await assert.rejects(context.pinterestContext(new Request(seo.SITE_URL + '/api/creator/pinterest', { headers: { Origin: 'https://evil.example' } })), error => error.status === 403);
  await context.pinterestContext(new Request(seo.SITE_URL + '/api/creator/pinterest'));
  assert.deepEqual(tenantFilters, [['creator_id', 'creator-a']]);
  const cover = 'https://arquivos.educalizando.com.br/public-images/uploads/capa.jpg';
  for (const bad of ['https://evil.example/capa.jpg', 'https://arquivos.educalizando.com.br/private-files/material.pdf', cover + '?token=secret', 'http://arquivos.educalizando.com.br/public-images/uploads/capa.jpg', '/api/storage/download?key=private']) assert.equal(contract.pinterestImage(bad), null);
  const product = { id: '22222222-2222-4222-8222-222222222222', titulo: 'Atividades sobre o Egito', slug: 'egito', descricao: '<p>Recorte e montagem.</p>', capa_url: cover, status: 'publicado', excluido_em: null, store_id: 'store-a' };
  const store = { slug: 'minha-loja', nome_loja: 'Minha Loja' };
  const payload = contract.pinterestPin(product, store, '123', true);
  assert.equal(payload.link, seo.SITE_URL + '/loja/minha-loja/produto/egito?utm_source=pinterest&utm_medium=organic&utm_campaign=materiais');
  assert.equal(payload.media_source.url, cover); assert(!payload.description.includes('<p>'));
  assert(contract.pinterestText('palavra '.repeat(100), 100).length <= 100);
  let fetchResponse = new Response('{}', { status: 200 }), remoteCalls = [], rejectFetch = false;
  const provider = load('src/lib/pinterest-provider.ts', { './pinterest-security': security, './pinterest-contract': contract }, { fetch: async (url, init) => { remoteCalls.push({ url, init }); if (rejectFetch) throw new Error('timeout'); return fetchResponse.clone(); } });
  rejectFetch = true;
  await assert.rejects(provider.pinterestRequest('/pins', 'token', payload), error => error.uncertain === true);
  await assert.rejects(provider.pinterestRequest('/boards', 'token'), error => error.uncertain === false);
  rejectFetch = false; fetchResponse = new Response('{}', { status: 503 });
  await assert.rejects(provider.pinterestRequest('/pins', 'token', payload), error => error.uncertain === true);
  fetchResponse = new Response('{}', { status: 429 });
  await assert.rejects(provider.pinterestRequest('/pins', 'token', payload), error => error.uncertain === false && error.status === 429);
  const connection = { id: 'connection-a', store_id: 'store-a', auto_publish: true, campaign_links: true };
  let currentConnection = connection, sent = 0, remoteError = null;
  const job = { id: 'job-a', store_id: 'store-a', product_id: product.id, connection_id: connection.id, source: 'automatic', board_id: '123', status: 'processing', attempts: 1 };
  const tables = { products: [product], stores: [{ ...store, id: 'store-a' }], creator_pinterest_jobs: [job] };
  const db = { from(table) {
    let filters = [], changes;
    const query = { select() { return this; }, eq(key, value) { filters.push(row => row[key] === value); return this; }, update(value) { changes = value; return this; }, maybeSingle() { const rows = tables[table].filter(row => filters.every(filter => filter(row))); return Promise.resolve({ data: rows[0] || null, error: null }); }, then(resolve, reject) { const rows = tables[table].filter(row => filters.every(filter => filter(row))); if (changes) rows.forEach(row => Object.assign(row, changes)); return Promise.resolve({ data: rows, error: null }).then(resolve, reject); } }; return query;
  } };
  class InputError extends Error {}
  const publishing = load('src/lib/pinterest-publishing.ts', { './supabase': { supabaseAdmin: db }, './pinterest-security': security, './pinterest-contract': contract,
    './pinterest-store': { readPinterestConnection: async () => currentConnection, usablePinterestToken: async () => 'token', PinterestInputError: InputError },
    './pinterest-provider': { PinterestProviderError: provider.PinterestProviderError, pinterestRequest: async () => { sent++; if (remoteError) throw remoteError; return { id: '777' }; } } });
  await publishing.publishPinterestJob(job); assert.equal(job.status, 'published'); assert.equal(job.pin_id, '777'); assert.equal(sent, 1);
  job.status = 'processing'; currentConnection = { ...connection, id: 'other-connection' };
  await publishing.publishPinterestJob(job); assert.equal(job.status, 'cancelled'); assert.equal(sent, 1);
  job.status = 'processing'; currentConnection = { ...connection, auto_publish: false };
  await publishing.publishPinterestJob(job); assert.equal(job.status, 'cancelled'); assert.equal(sent, 1);
  job.status = 'processing'; currentConnection = connection; product.store_id = 'store-b';
  await publishing.publishPinterestJob(job); assert.equal(job.status, 'cancelled'); assert.equal(sent, 1); product.store_id = 'store-a';
  job.status = 'processing'; product.status = 'rascunho';
  await publishing.publishPinterestJob(job); assert.equal(job.status, 'cancelled'); assert.equal(sent, 1); product.status = 'publicado';
  job.status = 'processing'; remoteError = new provider.PinterestProviderError(0, true);
  await publishing.publishPinterestJob(job); assert.equal(job.status, 'uncertain'); assert.equal(sent, 2);
  job.status = 'processing'; remoteError = new provider.PinterestProviderError(429);
  await publishing.publishPinterestJob(job); assert.equal(job.status, 'queued'); assert(Date.parse(job.next_attempt_at) > Date.now());
  console.log('PASS Pinterest: autenticação/origem, OAuth, cifra por loja, capas públicas, link canônico, isolamento, opt-in, rascunhos, troca de conexão e falha ambígua sem reenvio.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
