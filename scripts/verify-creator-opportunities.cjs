const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
const React = require('react'), { renderToStaticMarkup } = require('react-dom/server');
function load(file, mocks = {}) {
  const exports = {};
  const localRequire = name => Object.hasOwn(mocks, name) ? mocks[name] : name.startsWith('.') ? load(path.resolve(path.dirname(file), name + '.ts'), mocks) : require(name);
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(output, { exports, require: localRequire, Response, Request, URL, Date, Intl, Set, console }); return exports;
}
const { buildCreatorOpportunities, opportunityToday } = load('src/lib/creator-opportunities.ts');
const now = new Date('2026-10-16T12:00:00Z');
const product = (id, titulo, seasonal_tags = [], status = 'publicado', tags = []) => ({ id, titulo, seasonal_tags, status, tags });
const input = [product('a', 'Kit da Reforma Protestante'), product('b', 'Outro título', ['Dia da Consciência Negra']), product('c', 'Atividades de matemática'), product('d', 'Livro de Natal', [], 'rascunho'), product('e', 'Árvore genealógica')];
const before = JSON.stringify(input);
const items = buildCreatorOpportunities(input, now, 21);
const reform = items.find(item => item.event.slug === 'dia-da-reforma-protestante');
assert.equal(reform.daysUntil, 15); assert.equal(new Date(reform.start).toISOString(), '2026-10-10T00:00:00.000Z');
assert.equal(reform.matches.length, 1); assert.equal(reform.matches[0].product.id, 'a'); assert.equal(reform.matches[0].confirmed, false);
assert.equal(items.find(item => item.event.slug === 'dia-da-consciencia-negra').matches[0].confirmed, true);
assert.ok(!items.some(item => item.matches.some(match => ['c', 'e'].includes(match.product.id))), 'Unrelated general products must not match every date');
assert.equal(items.find(item => item.event.slug === 'natal').matches[0].product.status, 'rascunho');
assert.equal(JSON.stringify(input), before, 'Planning never mutates catalog');
assert.equal(buildCreatorOpportunities([], new Date('2026-10-31T03:00:00Z'))[0].daysUntil, 0);
assert.equal(new Date(opportunityToday(new Date('2026-11-01T02:30:00Z'))).toISOString(), '2026-10-31T00:00:00.000Z');
assert.equal(new Date(buildCreatorOpportunities([], new Date('2026-12-31T15:00:00Z'))[0].date).getUTCFullYear(), 2027);
assert.equal(new Date(buildCreatorOpportunities([], now, 45).find(item => item.event.slug === reform.event.slug).start).toISOString(), '2026-09-16T00:00:00.000Z');
const helpers = load('src/lib/creator-opportunities.ts');
const Card = load('src/app/dashboard/oportunidades/OpportunityCard.tsx', {
  '@/lib/creator-opportunities': helpers,
  'next/link': { default: props => React.createElement('a', props, props.children) },
}).default;
let copied = '';
const card = Card({ opportunity: reform, onCopy: text => { copied = text; } });
function findButton(element) {
  if (!element || typeof element !== 'object') return null;
  if (element.type === 'button') return element;
  return React.Children.toArray(element.props?.children).map(findButton).find(Boolean);
}
findButton(card).props.onClick();
assert.match(copied, /Kit da Reforma Protestante/); assert.match(copied, /10 de out/);
const html = renderToStaticMarkup(card);
assert.match(html, /Revisar material/); assert.match(html, /dashboard\/ia\?produto=a/); assert.match(html, /Confira|confira/);
const draftHtml = renderToStaticMarkup(React.createElement(Card, { opportunity: items.find(item => item.event.slug === 'natal'), onCopy() {} }));
assert.match(draftHtml, /publique antes de divulgar/); assert.ok(!draftHtml.includes('dashboard/ia?produto=d'));
const emptyHtml = renderToStaticMarkup(React.createElement(Card, { opportunity: buildCreatorOpportunities([], now)[0], onCopy() {} }));
assert.match(emptyHtml, /Nenhum material relacionado foi identificado/);

async function routeChecks() {
  let signedIn = true, calls = [], rows = Array.from({ length: 201 }, (_, i) => product(String(i), 'Title'));
  const db = { from(table) { const chain = { select(value) { calls.push([table, 'select', value]); return this; }, eq(...args) { calls.push([table, 'eq', ...args]); return this; }, is(...args) { calls.push([table, 'is', ...args]); return this; }, gt(...args) { calls.push([table, 'gt', ...args]); return this; }, order() { return this; }, limit() { return this; }, maybeSingle: async () => ({ data: { id: 'own-store', nome_loja: 'Minha loja', slug: 'minha-loja' }, error: null }), then(resolve, reject) { return Promise.resolve({ data: rows, error: null }).then(resolve, reject); } }; return chain; } };
  const { GET } = load('src/app/api/creator/opportunities/route.ts', { '@/lib/api-auth': { getRequestUser: async () => signedIn ? { id: 'owner' } : null }, '@/lib/supabase': { supabaseAdmin: db } });
  const response = await GET(new Request('https://example.com/api/creator/opportunities?storeId=foreign'));
  assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /no-store/);
  const data = await response.json(); assert.equal(data.products.length, 200); assert.equal(data.next, '199');
  assert.ok(calls.some(row => row.join('|') === 'stores|eq|creator_id|owner'));
  assert.ok(calls.some(row => row.join('|') === 'products|eq|store_id|own-store'));
  assert.ok(calls.some(row => row.join('|') === 'products|is|excluido_em|'));
  assert.ok(!calls.some(row => row.includes('foreign')));
  assert.ok(!calls.find(row => row[0] === 'products' && row[1] === 'select')[2].includes('arquivo'), 'No delivery URLs returned');
  calls = []; signedIn = false;
  assert.equal((await GET(new Request('https://example.com/api/creator/opportunities'))).status, 401); assert.equal(calls.length, 0);
  signedIn = true; assert.equal((await GET(new Request('https://example.com/api/creator/opportunities?after=invalid'))).status, 400);
  rows = []; calls = [];
  const cursor = '00000000-0000-0000-0000-000000000001';
  const empty = await GET(new Request('https://example.com/api/creator/opportunities?after=' + cursor));
  assert.equal((await empty.json()).next, null); assert.ok(calls.some(row => row.join('|') === 'products|gt|id|' + cursor));
}
routeChecks().then(() => console.log('PASS: calendar matching, São Paulo date boundaries, year rollover, lead times, no catalog mutations, owner-only API, private cache and pagination.')).catch(error => { console.error(error); process.exitCode = 1; });
