const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');
function load(file, mocks = {}, extras = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports, require: name => Object.hasOwn(mocks, name) ? mocks[name] : require(name), Buffer, crypto, Response, Request, URL, TextDecoder, Uint8Array, AbortSignal, Date, Set, Map, console, process, ...extras });
  return exports;
}
const contract = load('src/lib/store-webhook-contract.ts');
let addresses = [{ address: '1.1.1.1' }];
const security = load('src/lib/store-webhook-security.ts', { 'server-only': {}, './financial-configuration': { getConfiguredCryptoSecret: () => 'strong-local-test-key-12345678901234567890' }, './remote-addresses': { resolveRemoteAddresses: async () => addresses } });
const payload = load('src/lib/store-webhook-payload.ts', { './store-webhook-contract': contract });
const store = '11111111-1111-4111-8111-111111111111', foreign = '22222222-2222-4222-8222-222222222222';
const epId = '33333333-3333-4333-8333-333333333333';
const ep = { id: epId, store_id: store, name: 'Integration', provider: 'generic', url: 'https://receiver.example/webhook', events: ['order.paid'], version: 1, enabled: true, include_customer: false, secret_encrypted: security.encryptWebhookSecret('signing-test', store), token_encrypted: null };
const event = { id: 'event', store_id: store, type: 'order.paid', entity_id: 'order-a', created_at: '2026-10-16T12:00:00Z', data: { id: 'order-a', payment_method: 'pix', status: 'paid', total_amount: 10.25, creator_net_amount: 8.2, paid_at: '2026-10-16T12:00:00Z', created_at: '2026-10-16T11:00:00Z', tracking_parameters: { utm_source: 'test', ignored: 'never-forward' } } };
const details = { customer: { name: 'Test', email: 'test@example.invalid', phone: null, document: null }, items: [{ id: 'p', name: 'Material', quantity: 1, priceInCents: 1025 }] };
let tables = {}, receipts = [], calls = [], httpStatus = 200, lease = 1;
function queryDb(table) {
  let changes, inserted, filters = [], columns = '*';
  const query = {
    select(value) { columns = value; return this; },
    eq(key, value) { filters.push([key, value]); return this; },
    order() { return this; }, limit() { return this; },
    update(value) { changes = value; return this; },
    insert(value) { inserted = value; return this; },
    delete() { changes = { deleted: true }; return this; },
    result(single) {
      if (changes) { receipts.push({ table, changes, filters }); return { data: [{ id: 'saved' }], error: null }; }
      if (inserted) { tables[table].push({ ...inserted, id: epId }); }
      let values = (tables[table] || []).filter(row => filters.every(([k, v]) => k === 'creator_id' ? v === 'creator' : row[k] === v));
      if (columns !== '*') values = values.map(row => Object.fromEntries(columns.split(',').map(key => [key, row[key]])));
      return { data: single ? values[0] || null : values, error: null, count: values.length };
    },
    maybeSingle: async function () { return this.result(true); },
    single: async function () { return this.result(true); },
    then(resolve) { return Promise.resolve(this.result(false)).then(resolve); },
  };
  return query;
}
let row = { id: 'delivery', store_id: store, endpoint_id: epId, event_id: event.id, endpoint_version: 1, attempts: 1, lease_token: 'lease-' + lease };
const db = { from: queryDb, rpc: async (_name, args) => { assert.equal(args.p_store, store); return { data: [row], error: null }; } };
const engine = load('src/lib/store-webhook-delivery.ts', { 'server-only': {}, './supabase': { supabaseAdmin: db }, './store-webhook-payload': payload, './store-webhook-security': security }, { fetch: async (url, init) => { calls.push({ url, init }); return new Response(null, { status: httpStatus }); } });
function reset() {
  tables = { stores: [{ id: store, creator_id: 'creator', nome_loja: 'Loja' }], store_webhook_endpoints: [ep], store_webhook_events: [event], orders: [{ id: 'order-a', store_id: store, buyer_name: details.customer.name, buyer_email: details.customer.email }], order_items: [{ order_id: 'order-a', store_id: store, product_id: 'p', product_title: 'Material', quantity: 1, unit_price: 10.25 }], store_webhook_deliveries: [] };
  receipts = []; calls = []; httpStatus = 200; row = { ...row, attempts: 1, lease_token: 'lease-' + (++lease) };
}
(async () => {
  assert.equal(security.decryptWebhookSecret(ep.secret_encrypted, store), 'signing-test');
  assert.throws(() => security.decryptWebhookSecret(ep.secret_encrypted, foreign), undefined, 'Encryption is bound to one merchant');
  assert.notEqual(ep.secret_encrypted, security.encryptWebhookSecret('signing-test', store), 'Each encryption uses a unique IV');
  assert.notEqual(security.signStoreWebhook('a', '1', 'key'), security.signStoreWebhook('b', '1', 'key'));
  for (const address of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '172.16.0.1', '192.168.1.1', '100.64.0.1', '::1', '::ffff:127.0.0.1', 'fc00::1', '2001:db8::1']) assert.equal(security.isPublicWebhookIp(address), false, address);
  for (const url of ['http://receiver.example', 'https://localhost/', 'https://127.0.0.1/', 'https://user:pass@receiver.example/', 'https://receiver.example:8080/', 'https://receiver.example/#fragment']) await assert.rejects(security.validateWebhookUrl(url));
  addresses = [{ address: '1.1.1.1' }, { address: '10.0.0.1' }]; await assert.rejects(security.validateWebhookUrl('https://receiver.example'));
  addresses = [{ address: '1.1.1.1' }]; assert.equal(await security.validateWebhookUrl('https://receiver.example'), 'https://receiver.example/');
  assert.equal(JSON.stringify(payload.createStoreWebhookPayload(ep, event, details)).includes('test@example.invalid'), false, 'Buyer is omitted unless explicitly enabled');
  assert.throws(() => payload.createStoreWebhookPayload(ep, { ...event, store_id: foreign }, details), /store_scope_mismatch/);
  const utm = payload.createStoreWebhookPayload({ ...ep, provider: 'utmify', include_customer: true }, event, details);
  assert.equal(utm.status, 'paid'); assert.equal(utm.commission.totalPriceInCents, 1025); assert.equal(utm.commission.userCommissionInCents, 820); assert.equal(utm.commission.gatewayFeeInCents, 205);
  assert.equal(utm.trackingParameters.utm_source, 'test'); assert.equal(utm.trackingParameters.ignored, undefined);
  assert.throws(() => payload.createStoreWebhookPayload({ ...ep, provider: 'utmify', include_customer: true }, { ...event, data: { ...event.data, payment_method: 'unknown' } }, details), /unsupported_payment_method/);
  assert.equal(contract.cleanCheckoutAttribution({ utm_source: ' a\n ', email: 'private', utm_campaign: 'x'.repeat(500) }).utm_source, 'a');
  assert.equal(Object.keys(contract.cleanCheckoutAttribution({ email: 'private', arbitrary: 'no' })).length, 0);
  reset(); let result = await engine.dispatchStoreWebhooks(store);
  assert.equal(result.delivered, 1); assert.equal(calls.length, 1);
  assert.equal(calls[0].init.redirect, 'manual'); assert.equal(calls[0].init.headers['X-Educalizando-Event-Id'], event.id);
  assert.equal(calls[0].init.headers['X-Educalizando-Signature'], security.signStoreWebhook(calls[0].init.body, calls[0].init.headers['X-Educalizando-Timestamp'], 'signing-test'));
  assert.equal(JSON.stringify(calls[0].init.body).includes('test@example.invalid'), false);
  assert.ok(receipts[0].filters.some(([key, value]) => key === 'store_id' && value === store));
  assert.ok(receipts[0].filters.some(([key, value]) => key === 'lease_token' && value === row.lease_token));
  reset(); httpStatus = 429; await engine.dispatchStoreWebhooks(store); assert.equal(receipts[0].changes.status, 'pending');
  reset(); httpStatus = 503; row.attempts = 8; await engine.dispatchStoreWebhooks(store); assert.equal(receipts[0].changes.status, 'failed');
  reset(); httpStatus = 302; await engine.dispatchStoreWebhooks(store); assert.equal(receipts[0].changes.last_error, 'redirect_rejected'); assert.equal(calls.length, 1);
  reset(); httpStatus = 401; await engine.dispatchStoreWebhooks(store); assert.equal(receipts[0].changes.status, 'failed');
  reset(); tables.store_webhook_endpoints = [{ ...ep, version: 2 }]; await engine.dispatchStoreWebhooks(store); assert.equal(calls.length, 0); assert.equal(receipts[0].changes.status, 'cancelled');
  reset(); tables.orders = [{ ...tables.orders[0], store_id: foreign }]; await engine.dispatchStoreWebhooks(store); assert.equal(calls.length, 0, 'Order data is scoped to the owner before an external send');
  reset(); let user = { id: 'creator' };
  const route = load('src/app/api/creator/webhooks/route.ts', { '@/lib/api-auth': { getRequestUser: async () => user }, '@/lib/supabase': { supabaseAdmin: db }, '@/lib/store-webhook-contract': contract, '@/lib/store-webhook-security': security, '@/lib/request-rate-limit': { consumeRequestRateLimit: async () => ({ allowed: true }), rateLimitResponse: () => Response.json({}, { status: 429 }) }, '@/lib/store-webhook-delivery': { dispatchStoreWebhooks: async () => ({ schemaReady: true, processed: 0, delivered: 0 }) } });
  const request = (method, body, origin) => new Request('https://www.educalizando.com.br/api/creator/webhooks', { method, headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  let response = await route.GET(request('GET')); const publicBody = await response.json(); assert.equal(response.status, 200); assert.equal(publicBody.endpoints[0].secret_encrypted, undefined);
  user = null; assert.equal((await route.GET(request('GET'))).status, 401);
  user = { id: 'creator' }; assert.equal((await route.DELETE(request('DELETE', { id: epId }, 'https://attacker.example'))).status, 401);
  assert.equal((await route.PATCH(request('PATCH', { id: foreign, enabled: true }))).status, 404);
  response = await route.POST(request('POST', { provider: 'generic', name: 'Other', store_id: foreign, url: 'https://receiver.example/webhook', events: ['order.paid'] }));
  assert.equal(response.status, 201); const created = await response.json(); assert.ok(created.signingSecret.startsWith('whsec_')); assert.equal(created.endpoint.secret_encrypted, undefined); assert.equal(tables.store_webhook_endpoints.at(-1).store_id, store, 'Untrusted merchant id cannot redirect ownership');
  assert.equal((await route.POST(request('POST', { provider: 'generic', name: 'Bad', url: 'https://receiver.example/webhook', events: ['toString'] }))).status, 400);
  console.log('PASS: webhook encryption, signatures, SSRF validation, private payloads, UTMify amounts, delivery retries, lease receipt checks and creator API ownership. No real HTTP sends.');
})().catch(error => { console.error(error); process.exitCode = 1; });
