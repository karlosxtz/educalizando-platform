const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies = {}, globals = {}) {
  const output = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, { exports: output, URL, URLSearchParams, Event, ...globals, require: name => dependencies[name] || require(name) });
  return output;
}
const store = load('src/lib/store-analytics-events.ts');
const { createPlatformMetrics, isMetricsPage, isPurchaseConfirmation, metricsPageContext, PLATFORM_GA4_ID } = load('src/lib/platform-analytics.ts', { './store-analytics-events': store });
// Exercise the deployed header configuration, not just SDK mocks: a blocked tag cannot measure anything.
const config = load('next.config.ts', {}, { process: { env: { NODE_ENV: 'production' } } }).default;
config.headers().then(rules => {
  const policy = rules.find(rule => rule.source === '/(.*)').headers.find(header => header.key === 'Content-Security-Policy').value;
  function permits(name, address) {
    const origin = new URL(address).origin;
    const directives = policy.split(';').map(part => part.trim().split(/\s+/));
    const values = directives.find(part => part[0] === name).slice(1);
    return values.some(value => value === origin || (value.startsWith('https://*.') && new URL(address).hostname.endsWith('.' + value.slice('https://*.'.length))));
  }
  assert(permits('script-src', `https://www.googletagmanager.com/gtag/js?id=${PLATFORM_GA4_ID}`));
  assert(permits('connect-src', 'https://www.google-analytics.com/g/collect'));
  assert(permits('connect-src', 'https://region1.google-analytics.com/g/collect'));
  assert(!permits('script-src', 'https://arbitrary.example/script.js'));
  assert(!permits('connect-src', 'https://google-analytics.com.evil.example/g/collect'));
  assert(!policy.includes('unsafe-eval'));
  console.log('PASS production CSP: consented Google tag and collection allowed; arbitrary hosts and eval remain blocked.');
});
for (const path of ['/', '/produto/material-real', '/loja/loja-real', '/categorias/historia', '/materiais-didaticos']) assert(isMetricsPage(path));
for (const path of ['/ofertas', '/calendario', '/calendario/dia-da-arvore', '/glossario', '/glossario/alfabetizacao', '/atividades-por-ano', '/encontrar-material', '/comparar', '/kit/776a7499-2e18-45be-842f-55faf28ef4ef']) {
  assert(isMetricsPage(path), `Página pública elegível: ${path}`);
  const sent = [];
  const publicMetrics = createPlatformMetrics(() => ({ gtag: (...args) => sent.push(args) }));
  publicMetrics.page(path, ''); publicMetrics.ready(); assert.equal(sent.length, 0, 'Não medir sem consentimento');
  publicMetrics.consent('accepted'); publicMetrics.page(path, '');
  assert.equal(sent.length, 1); assert.equal(sent[0][1], 'page_view');
  assert.equal(sent[0][2].page_location, 'https://www.educalizando.com.br' + path);
  publicMetrics.consent('rejected'); publicMetrics.page('/', ''); assert.equal(sent.length, 1);
}
for (const path of ['/encontrar-material', '/comparar']) {
  const safe = metricsPageContext(path, '', '?objetivo=informacao_privada&itens=id-privado&email=privado@example.test&token=chave-privada');
  assert(!JSON.stringify(safe).includes('privad'));
}
for (const path of ['/admin', '/dashboard', '/aluno', '/api/catalog', '/login', '/busca?q=email', '/loja/loja-real/checkout', '/produto/real?email=private']) assert(!isMetricsPage(path));
assert(isPurchaseConfirmation('/loja/loja-real/checkout/sucesso/order-123'));
assert(!isMetricsPage('/loja/loja-real/checkout/sucesso/order-123'));
const context = metricsPageContext('/produto/material-real', 'https://www.google.com/search?q=private', '?utm_source=google&utm_medium=cpc&utm_campaign=campanha_real&email=private&token=secret');
assert.equal(context.page_location, 'https://www.educalizando.com.br/produto/material-real');
assert.equal(context.page_referrer, 'https://www.google.com');
assert.equal(context.campaign_source, 'google');
assert(!JSON.stringify(context).includes('private') && !JSON.stringify(context).includes('secret'));
assert.equal(metricsPageContext('/', '', '?utm_campaign=user@example.test').campaign_name, undefined);
assert.equal(metricsPageContext('/', '', '?utm_campaign=contato5511999999999').campaign_name, undefined);
assert.equal(metricsPageContext('/dashboard/pedido/private', 'javascript:alert(1)').page_location, 'https://www.educalizando.com.br');
let calls = [];
const metrics = createPlatformMetrics(() => ({ gtag: (...a) => calls.push(a) }));
const paid = { event: 'Purchase', storeId: 'store-real', transactionId: 'paid-order', value: 9, currency: 'BRL', buyer_email: 'private@example.test' };
metrics.page('/', ''); metrics.event(paid, '/'); metrics.ready(); assert.equal(calls.length, 0);
metrics.consent('accepted'); metrics.page('/', 'https://google.com/search?q=secret'); metrics.page('/', '');
assert.equal(calls.length, 1, 'One page_view for a route, without automatic duplicate');
metrics.page('/materiais-didaticos', ''); metrics.page('/', ''); assert.equal(calls.length, 3, 'Back navigation remains measurable');
metrics.event(paid, '/dashboard'); assert.equal(calls.length, 3);
metrics.page('/loja/loja-real/checkout/sucesso/paid-order', '');
metrics.event(paid, '/loja/loja-real/checkout/sucesso/paid-order');
metrics.event(paid, '/loja/loja-real/checkout/sucesso/paid-order');
assert.equal(calls.length, 4); assert.equal(calls[3][1], 'purchase');
assert.equal(calls[3][2].transaction_id, 'paid-order'); assert.equal(calls[3][2].value, 9);
assert.equal(calls[3][2].page_location, 'https://www.educalizando.com.br');
assert.equal(calls[3][2].items, undefined, 'Do not invent paid line items');
assert(calls.every(call => call[2].send_to === PLATFORM_GA4_ID));
assert(!JSON.stringify(calls).includes('private@example') && !JSON.stringify(calls).includes('secret'));
metrics.consent('rejected'); metrics.page('/blog', ''); metrics.event({ ...paid, transactionId: 'other-order' }, '/'); assert.equal(calls.length, 4);
const lateCalls = [];
const late = createPlatformMetrics(() => ({ gtag: (...a) => lateCalls.push(a) }));
late.consent('accepted'); late.page('/', ''); assert.equal(lateCalls.length, 0); late.ready(); assert.equal(lateCalls.length, 1);
const withdrawn = createPlatformMetrics(() => ({ gtag: (...a) => lateCalls.push(a) }));
withdrawn.consent('accepted'); withdrawn.page('/', ''); withdrawn.consent('rejected'); withdrawn.ready(); assert.equal(lateCalls.length, 1);
console.log('PASS platform analytics: independent consent, private routes, safe URLs, explicit destination, late SDK, withdrawal and paid-event deduplication.');

let slots = [], cursor = 0, effects = [], sdkCalls = [], microtasks = [], listeners = new Set(), route = '/';
const changed = (before, after) => !before || after.some((value, index) => value !== before[index]);
const hooks = {
  useState: initial => { const index = cursor++; slots[index] ??= { value: initial }; return [slots[index].value, value => { slots[index].value = value; }]; },
  useMemo: (fn, deps) => { const index = cursor++; if (changed(slots[index]?.deps, deps)) slots[index] = { deps, value: fn() }; return slots[index].value; },
  useEffect: (fn, deps) => { const index = cursor++; if (changed(slots[index]?.deps, deps)) { const previous = slots[index]; slots[index] = { deps }; effects.push(() => { previous?.cleanup?.(); slots[index].cleanup = fn(); }); } },
};
const platformExports = load('src/lib/platform-analytics.ts', { './store-analytics-events': store });
let withdrawnCollector = 0;
const sdkBrowser = { location: { search: '?email=private' }, dispatchEvent: () => {}, gtag: (...args) => sdkCalls.push(args), addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn) };
const Component = load('src/components/PlatformAnalytics.tsx', {
  react: hooks, 'next/script': { __esModule: true, default: 'mock-script' }, 'next/navigation': { usePathname: () => route }, '@/lib/platform-analytics': platformExports,
  '@/lib/conversion-client': { recordConversion: () => {}, clearConversionSession: () => { withdrawnCollector++; } }, '@/lib/cart-service': { getCartByStore: () => [] },
}, { window: sdkBrowser, document: { referrer: 'https://google.com/search?q=private' }, queueMicrotask: fn => microtasks.push(fn), localStorage: { getItem: () => { throw Error('blocked'); }, setItem: () => { throw Error('blocked'); } } }).default;
const React = require('react');
function render() { cursor = 0; effects = []; const tree = Component(); effects.forEach(fn => fn()); return tree; }
function nodes(tree) { return React.Children.toArray(tree?.props?.children).flatMap(child => typeof child === 'object' ? [child, ...nodes(child)] : []); }
let tree = render(); tree = render();
assert.equal(nodes(tree).filter(n => n.type === 'mock-script').length, 0);
nodes(tree).find(n => n.type === 'button' && n.props.children === 'Aceitar métricas').props.onClick();
tree = render(); assert.equal(sdkCalls.length, 0);
nodes(tree).filter(n => n.type === 'mock-script' && n.props.onReady).forEach(n => n.props.onReady());
assert.equal(sdkCalls.length, 0); microtasks.splice(0).forEach(fn => fn()); assert.equal(sdkCalls.length, 1);
assert(!JSON.stringify(sdkCalls).includes('private'));
route = '/dashboard'; tree = render();
assert.equal(nodes(tree).filter(n => n.type === 'mock-script').length, 0);
assert.equal(sdkBrowser[`ga-disable-${PLATFORM_GA4_ID}`], true);
listeners.forEach(fn => fn({ detail: paid })); assert.equal(sdkCalls.length, 1);
route = '/'; tree = render();
nodes(tree).find(n => n.type === 'button' && n.props.children === 'Preferências de métricas').props.onClick(); tree = render();
nodes(tree).find(n => n.type === 'button' && n.props.children === 'Recusar métricas').props.onClick(); tree = render();
assert.equal(sdkBrowser[`ga-disable-${PLATFORM_GA4_ID}`], true);
assert.equal(nodes(tree).filter(n => n.type === 'mock-script').length, 0);
assert(withdrawnCollector > 0, 'Withdrawal clears the internal collector');
console.log('PASS platform component: blocked storage, consent before SDK, Vinext callback timing, private navigation and withdrawal.');

const { renderToStaticMarkup } = require('react-dom/server');
const examples = load('src/lib/intent-classroom-examples.ts');
const Guide = load('src/components/seo/IntentClassroomGuide.tsx', { '@/lib/intent-classroom-examples': examples }).default;
assert.equal(Object.keys(examples.INTENT_CLASSROOM_EXAMPLES).length, 8);
const seen = new Set();
for (const slug of Object.keys(examples.INTENT_CLASSROOM_EXAMPLES)) {
  const html = renderToStaticMarkup(React.createElement(Guide, { slug }));
  assert.equal((html.match(/<li /g) || []).length, 3);
  assert.equal((html.match(/<h2 /g) || []).length, 1);
  assert(!html.includes('<h1') && !html.includes('<script'));
  assert(html.includes('não descreve os arquivos de um produto específico'));
  assert(!seen.has(html)); seen.add(html);
}
assert.equal(renderToStaticMarkup(React.createElement(Guide, { slug: 'missing' })), '');
console.log('PASS editorial guides: eight unique server-rendered examples, semantic hierarchy, no new routes or product promises.');
