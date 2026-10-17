const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, overrides = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require, Headers, Response, Error, ...overrides });
  return exports;
}
(async () => {
  const { readApiJson } = load('src/lib/api-response.ts');
  for (const [status, body, expected] of [[413, 'Payload Too Large', /tamanho/], [503, '<html>Cloudflare error</html>', /temporariamente/], [401, '', /sessão/], [429, 'Too Many Requests', /tentativas/]]) {
    await assert.rejects(readApiJson(new Response(body, { status })), expected);
  }
  assert.equal((await readApiJson(Response.json({ success: true }))).success, true);
  assert.equal((await readApiJson(Response.json({ error: 'Nome obrigatório.' }, { status: 400 }))).error, 'Nome obrigatório.');
  await assert.rejects(readApiJson(Response.json(null)), /inesperada/);
  let refreshes = 0, calls = 0;
  const client = load('src/lib/client-api.ts', {
    require: name => name === './supabase' ? { supabase: { auth: {
      getSession: async () => ({ data: { session: { access_token: 'old' } } }),
      refreshSession: async () => { refreshes++; return { data: { session: { access_token: 'renewed' } } }; },
    } } } : require(name),
    fetch: async (url, options) => {
      assert.match(url, /^\/api\//);
      assert.equal(options.headers.get('Authorization'), calls ? 'Bearer renewed' : 'Bearer old');
      assert.equal(options.cache, 'no-store');
      assert.equal(options.redirect, 'error');
      return Response.json({}, { status: calls++ ? 200 : 401 });
    },
  });
  assert.equal((await client.authenticatedFetch('/api/creator-clubs', { method: 'PUT', body: '{"name":"Teste"}' })).status, 200);
  assert.equal(refreshes, 1);
  assert.equal(calls, 2);
  for (const url of ['https://evil.example/api/', '//evil.example/api/', '/api/\\evil']) await assert.rejects(client.authenticatedFetch(url), /inválido/);
  console.log('PASS: non-JSON gateway errors, authenticated club requests, automatic session renewal, credentials constrained to platform APIs.');
})().catch(error => { console.error(error); process.exitCode = 1; });
