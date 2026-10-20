const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: name => mocks[name] || require(name), console, Request, ...globals });
  return exports;
}
const areas = load('src/lib/account-area.ts');
let store = null, dbError = null, signedOut = 0, syncs = 0;
let user = { id: 'creator-id', email: 'example@example.com', user_metadata: { role: 'creator' } };
const client = {
  from(table) {
    assert.equal(table, 'stores');
    return { select: () => ({ eq: (field, id) => {
      assert.equal(field, 'creator_id'); assert.equal(id, user.id);
      return { limit: () => ({ maybeSingle: async () => ({ data: store, error: dbError }) }) };
    } }) };
  },
  auth: { signInWithPassword: async () => ({ data: { user, session: { access_token: 'test-only', refresh_token: 'test-only' } }, error: null }), getUser: async () => ({ data: { user } }) },
};
const storage = new Map();
const student = load('src/lib/student-service.ts', {
  './supabase': { supabase: client, allowsLocalDevelopmentFallback: () => false, signOutUser: async () => { signedOut++; storage.delete('educalizando_student_session'); } },
  './student-purchase-service': {}, './evolution-api': {}, './account-area': areas,
}, {
  process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co' } },
  window: {}, localStorage: { setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) },
  fetch: async () => { syncs++; return { ok: true }; },
});
const login = () => student.signInStudent({ email: user.email, password: 'test-only' });
(async () => {
  for (const metadata of [{ role: 'creator' }, { role: 'seller' }, { role: 'admin' }, { is_creator: true }]) {
    user.user_metadata = metadata;
    await assert.rejects(login(), /conta é de criador/);
    assert.equal(await student.getCurrentStudentSession(), null);
  }
  assert.equal(syncs, 0, 'Rejected creator passwords never synchronize a customer session');
  user.user_metadata = { role: 'student' }; store = { id: 'owned-store' };
  await assert.rejects(login(), /conta é de criador/, 'Legacy creator ownership takes precedence over student metadata');
  store = null; dbError = { code: 'unavailable' };
  await assert.rejects(login(), /verificar o tipo/);
  assert.equal(syncs, 0);
  assert.equal(signedOut, 6, 'Every rejected password login rolls back the Auth session');
  dbError = null;
  await login();
  assert.equal(syncs, 1);
  assert.equal((await student.getCurrentStudentSession()).id, user.id);
  assert(storage.has('educalizando_student_session'));
  // The server boundary covers URL navigation and non-password authentication too.
  let serverUser = null;
  const layout = load('src/app/aluno/(protected)/layout.tsx', {
    '@/lib/api-auth': { getRequestUser: async () => serverUser },
    '@/lib/supabase': { supabaseAdmin: client }, '@/lib/account-area': areas,
    'next/navigation': { redirect: path => { throw new Error('REDIRECT:' + path); } },
  }).default;
  await assert.rejects(() => layout({ children: 'private' }), /REDIRECT:\/cliente\/login/);
  serverUser = user; user.user_metadata = { role: 'creator' };
  await assert.rejects(() => layout({ children: 'private' }), /REDIRECT:\/dashboard/);
  user.user_metadata = {}; store = { id: 'legacy-store' };
  await assert.rejects(() => layout({ children: 'private' }), /REDIRECT:\/dashboard/);
  store = null; assert(await layout({ children: 'private' }));
  dbError = { code: 'unavailable' };
  await assert.rejects(() => layout({ children: 'private' }), /verificar o tipo/);
  console.log('PASS account separation: creator, seller, admin, legacy store owner, session rollback, database outage, valid customer and server route boundary.');
})().catch(error => { console.error(error); process.exitCode = 1; });
