const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function load(file, mocks, env = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  vm.runInNewContext(source, { exports, require: name => name === 'server-only' ? {} : mocks[name] || require(name), process: { env }, Date, Request, Response, AbortController });
  return exports;
}

async function main() {
  const email = 'review@example.test';
  const now = Date.parse('2026-10-19T12:00:00.000Z');
  const valid = { INSTAGRAM_REVIEW_ENABLED: 'true', INSTAGRAM_REVIEW_ACCOUNT_EMAIL: email, INSTAGRAM_REVIEW_UNTIL: '2027-10-19T12:00:00.000Z' };
  const gate = env => load('src/lib/instagram-review-access.ts', {}, env).instagramReviewEmail(now);
  assert.equal(gate({}), null);
  assert.equal(gate({ ...valid, INSTAGRAM_REVIEW_ENABLED: 'false' }), null);
  assert.equal(gate({ ...valid, INSTAGRAM_REVIEW_ACCOUNT_EMAIL: '*' }), null);
  assert.equal(gate({ ...valid, INSTAGRAM_REVIEW_ACCOUNT_EMAIL: 'not-an-email' }), null);
  assert.equal(gate({ ...valid, INSTAGRAM_REVIEW_UNTIL: 'invalid' }), null);
  assert.equal(gate({ ...valid, INSTAGRAM_REVIEW_UNTIL: '2026-10-19T12:00:00.000Z' }), null);
  assert.equal(gate({ ...valid, INSTAGRAM_REVIEW_UNTIL: '2026-10-18T12:00:00.000Z' }), null);
  assert.equal(gate({ ...valid, INSTAGRAM_REVIEW_UNTIL: '2027-02-30T12:00:00.000Z' }), null);
  assert.equal(gate(valid), email);
  assert.equal(gate({ ...valid, INSTAGRAM_REVIEW_ACCOUNT_EMAIL: ' Review@Example.Test ' }), email);

  let authCalls = 0;
  let identity = null;
  let authFailure = false;
  let allowed = null;
  const ReviewGate = ({ children }) => React.createElement('div', { 'data-review-gate': true }, children);
  const page = load('src/app/dashboard/instagram/page.tsx', {
    'next/link': ({ children }) => React.createElement('a', null, children),
    'lucide-react': { ArrowLeft: () => null, Clock3: () => null, ShieldCheck: () => null },
    '@/components/creator/InstagramReviewGate': ReviewGate,
    '@/lib/instagram-review-access': { instagramReviewEmail: () => allowed },
  });
  const route = load('src/app/api/creator/instagram/review-access/route.ts', {
    '@/lib/api-auth': { getRequestUser: async request => {
      authCalls++;
      assert.equal(request.headers.get('authorization'), 'Bearer review-test-only');
      if (authFailure) throw new Error('identity unavailable');
      return identity;
    } },
    '@/lib/instagram-review-access': { instagramReviewEmail: () => allowed },
  });
  const request = new Request('https://www.educalizando.com.br/api/creator/instagram/review-access', { headers: { Authorization: 'Bearer review-test-only' } });
  const html = async () => renderToStaticMarkup(await page.default());
  assert.equal(page.dynamic, 'force-dynamic');
  assert.match(await html(), /Estamos em análise/);
  assert.doesNotMatch(await html(), /data-review-gate/);
  assert.equal((await route.GET(request)).status, 200);
  assert.equal(authCalls, 0, 'disabled review access must not query authentication');
  allowed = email;
  assert.match(await html(), /data-review-gate/);
  assert.equal((await route.GET(request)).status, 401);
  identity = { email: 'other@example.test', email_confirmed_at: '2026-10-19T12:00:00.000Z' };
  assert.equal((await (await route.GET(request)).json()).allowed, false);
  identity = { email };
  assert.equal((await (await route.GET(request)).json()).allowed, false, 'an unverified email must not open the studio');
  identity = { email: 'REVIEW@EXAMPLE.TEST', email_confirmed_at: '2026-10-19T12:00:00.000Z' };
  const permitted = await route.GET(request);
  assert.equal((await permitted.json()).allowed, true);
  assert.equal(permitted.headers.get('cache-control'), 'private, no-store');
  assert.equal(permitted.headers.get('vary'), 'Authorization, Cookie');
  authFailure = true;
  assert.equal((await route.GET(request)).status, 503);

  let state = false;
  let effect;
  let fetchResult = { allowed: true };
  let pending;
  const Studio = () => null;
  const client = load('src/components/creator/InstagramReviewGate.tsx', {
    react: { useState: () => [state, value => { state = value; }], useEffect: fn => { effect = fn; } },
    './InstagramWorkspace': Studio,
    '@/lib/instagram-client': { instagramFetch: async (path, init) => {
      assert.equal(path, '/api/creator/instagram/review-access');
      assert(init.signal);
      if (pending) return pending;
      if (fetchResult instanceof Error) throw fetchResult;
      return fetchResult;
    } },
  });
  const tick = () => new Promise(resolve => setImmediate(resolve));
  const render = () => client.default({ children: 'review-notice' });
  assert.equal(render(), 'review-notice');
  let cleanup = effect();
  await tick();
  assert.equal(render().type, Studio);
  cleanup();
  state = false;
  fetchResult = { allowed: false };
  render(); cleanup = effect(); await tick();
  assert.equal(render(), 'review-notice'); cleanup();
  fetchResult = new Error('unauthorized');
  render(); cleanup = effect(); await tick();
  assert.equal(render(), 'review-notice'); cleanup();
  let resolvePending;
  pending = new Promise(resolve => { resolvePending = resolve; });
  render(); cleanup = effect(); cleanup();
  resolvePending({ allowed: true }); await tick();
  assert.equal(state, false, 'unmount must not reopen the studio after a delayed response');
  console.log('PASS: review access validates the exact confirmed session on the server, supports Bearer authentication, prevents shared caching and fails closed.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
