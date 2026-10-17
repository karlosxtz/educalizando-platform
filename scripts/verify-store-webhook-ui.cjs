const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function loadUi(filename, react = React, cache = new Map()) {
  const file = path.resolve(filename);
  if (cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file, exports);
  const localRequire = name => {
    if (name === 'react') return react;
    if (name === '@/lib/client-api') return { authenticatedFetch() { throw new Error('No HTTP permitted in UI rendering'); } };
    if (name === '@/lib/store-webhook-contract') return loadUi('src/lib/store-webhook-contract.ts', react, cache);
    if (name === '@/lib/store-webhook-inbound-contract') return loadUi('src/lib/store-webhook-inbound-contract.ts', react, cache);
    if (name.startsWith('.')) {
      const target = path.resolve(path.dirname(file), name);
      const found = ['.tsx', '.ts'].map(ext => target + ext).find(candidate => fs.existsSync(candidate));
      if (found) return loadUi(found, react, cache);
    }
    return require(name);
  };
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  vm.runInNewContext(output, { exports, require: localRequire, Response, Request, URL, AbortSignal, Date, Set, Map, console }, { filename: file });
  return exports;
}
function visit(element, predicate) {
  if (!element || typeof element !== 'object') return [];
  return [...(predicate(element) ? [element] : []), ...React.Children.toArray(element.props?.children).flatMap(child => visit(child, predicate))];
}
function verify() {
  const Form = loadUi('src/app/dashboard/webhooks/WebhookSetupForm.tsx').default;
  const History = loadUi('src/app/dashboard/webhooks/WebhookHistory.tsx').default;
  const defaults = { name: '', provider: 'generic', url: '', apiToken: '', events: ['order.paid'], includeCustomer: false };
  let next;
  const tree = Form({ form: defaults, setForm: value => { next = value; }, busy: false, onSubmit() {}, onCancel() {} });
  const presets = visit(tree, node => node.type === 'button' && node.props['aria-pressed'] !== undefined);
  assert.equal(presets.length, 2);
  presets[0].props.onClick(); assert.ok(next.events.includes('order.paid') && next.events.includes('order.refunded'), 'Sales preset includes payment lifecycle');
  presets[1].props.onClick(); assert.ok(next.events.length >= 4 && next.events.every(type => type.startsWith('product.')), 'Catalog preset changes actual form state');
  const genericHtml = renderToStaticMarkup(React.createElement(Form, { form: defaults, setForm() {}, busy: false, onSubmit() {}, onCancel() {} }));
  assert.match(genericHtml, /Endereço de destino/); assert.match(genericHtml, /Salvar e ativar integração/);
  const utmHtml = renderToStaticMarkup(React.createElement(Form, { form: { ...defaults, provider: 'utmify' }, setForm() {}, busy: false, onSubmit() {}, onCancel() {} }));
  assert.match(utmHtml, /type="password"/); assert.ok(!utmHtml.includes('type="url"'), 'UTMify does not ask beginners for a webhook URL');
  const historyHtml = renderToStaticMarkup(React.createElement(History, { endpoints: [], busy: false, loading: false, onRefresh() {}, onProcess() {}, onRetry() {}, deliveries: [
    { id: 'test', endpoint_id: 'e', status: 'delivered', attempts: 1, created_at: '2026-10-16T12:00:00Z', event: { type: 'order.paid', is_test: true } },
    { id: 'real', endpoint_id: 'e', status: 'failed', attempts: 8, http_status: 401, created_at: '2026-10-16T12:00:00Z', event: { type: 'order.paid', is_test: false } },
  ] }));
  assert.match(historyHtml, /Teste de conexão/); assert.equal((historyHtml.match(/Pagamento confirmado/g) || []).length, 1, 'A fictitious UTMify paid event is not presented as a real payment');
  assert.match(historyHtml, /O destino recusou o acesso/); assert.match(historyHtml, /Recebido pelo destino/);
  console.log('PASS: real React rendering, functional event presets, UTMify credential form and clear distinction between test delivery and actual payment. No network requests.');
}
if (require.main === module) verify();
module.exports = { loadUi };
