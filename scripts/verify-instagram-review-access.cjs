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
  vm.runInNewContext(source, { exports, require: name => name === 'server-only' ? {} : mocks[name] || require(name), process: { env }, Date, Request });
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
  const Studio = () => React.createElement('div', null, 'restricted-review-studio');
  const page = load('src/app/dashboard/instagram/page.tsx', {
    'next/link': ({ children }) => React.createElement('a', null, children),
    'lucide-react': { ArrowLeft: () => null, Clock3: () => null, ShieldCheck: () => null },
    '@/components/creator/InstagramWorkspace': Studio,
    '@/lib/api-auth': { getRequestUser: async request => {
      authCalls++;
      assert.equal(request.url, 'https://www.educalizando.com.br/dashboard/instagram');
      if (authFailure) throw new Error('identity unavailable');
      return identity;
    } },
    '@/lib/instagram-review-access': { instagramReviewEmail: () => allowed },
    '@/lib/seo': { SITE_URL: 'https://www.educalizando.com.br' },
  });
  const html = async () => renderToStaticMarkup(await page.default());
  assert.equal(page.dynamic, 'force-dynamic');
  assert.match(await html(), /Estamos em análise/);
  assert.equal(authCalls, 0, 'disabled review access must not query authentication');
  allowed = email;
  assert.match(await html(), /Estamos em análise/);
  identity = { email: 'other@example.test', email_confirmed_at: '2026-10-19T12:00:00.000Z' };
  assert.match(await html(), /Estamos em análise/);
  identity = { email };
  assert.match(await html(), /Estamos em análise/, 'an unverified email must not open the studio');
  identity = { email: 'REVIEW@EXAMPLE.TEST', email_confirmed_at: '2026-10-19T12:00:00.000Z' };
  assert.match(await html(), /restricted-review-studio/);
  authFailure = true;
  assert.match(await html(), /Estamos em análise/);
  console.log('PASS: review studio requires explicit, unexpired configuration and the exact authenticated user; all other cases keep the notice.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
