const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/store-analytics-events.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: exportsObject });
const { trackingIds, cleanTrackingEvent, createStoreTracking } = exportsObject;
const ids = trackingIds('123456789', 'G-TEST1234');
assert.equal(trackingIds("1');alert(1)//", 'bad').meta, null);
assert.equal(trackingIds('123456789', "G-X');alert(1)//").google, null);
const product = { productId: 'real-product', title: 'Título cadastrado', price: 7 };
const purchase = { event: 'Purchase', storeId: 'store-a', transactionId: 'real-order', value: 7, currency: 'BRL', buyer_email: 'never-send@example.test' };
assert.equal(cleanTrackingEvent({ ...purchase, storeId: 'store-b' }, 'store-a'), null);
assert.equal(cleanTrackingEvent({ ...purchase, value: NaN }, 'store-a'), null);
assert.equal(cleanTrackingEvent({ ...purchase, transactionId: '' }, 'store-a'), null);
assert.equal(cleanTrackingEvent({ ...purchase, event: 'toString' }, 'store-a'), null);
assert.equal(cleanTrackingEvent({ ...purchase, product: { ...product, price: -1 } }, 'store-a'), null);
let google = [], meta = [], campaignReads = 0;
const tracking = createStoreTracking('store-a', ids, () => ({ gtag: (...args) => google.push(args), fbq: (...args) => meta.push(args) }), () => {
  campaignReads++; return { utm_source: 'google', utm_medium: 'organic', buyer_email: 'never-send@example.test', utm_arbitrary: 'drop' };
});
tracking.enqueue(purchase);
tracking.ready('google'); tracking.ready('meta');
assert.equal(google.length + meta.length + campaignReads, 0, 'No SDK calls or campaign reads before consent');
tracking.consent('accepted');
assert.equal(google.length, 1); assert.equal(meta.length, 1);
assert.equal(google[0][1], 'purchase'); assert.equal(google[0][2].transaction_id, 'real-order');
assert.equal(google[0][2].send_to, 'G-TEST1234'); assert.equal(google[0][2].items, undefined, 'Do not invent purchase items');
assert.equal(meta[0][0], 'trackSingle'); assert.equal(meta[0][1], '123456789'); assert.equal(meta[0][4].eventID, 'real-order');
assert(!JSON.stringify([google, meta]).includes('never-send') && !JSON.stringify(google).includes('utm_arbitrary'));
tracking.enqueue(purchase); tracking.ready('google'); tracking.ready('meta');
assert.equal(google.length, 1, 'Late SDK callback must not duplicate purchase');
tracking.enqueue({ event: 'AddToCart', storeId: 'store-a', product });
assert.equal(google[1][1], 'add_to_cart'); assert.equal(google[1][2].items[0].item_id, product.productId);
assert.equal(google[1][2].items[0].price, 7); assert.equal(google[1][2].items[0].quantity, 1);
tracking.enqueue({ ...purchase, storeId: 'store-b', transactionId: 'other-order' }); assert.equal(google.length, 2);

google = []; meta = [];
const late = createStoreTracking('store-a', ids, () => ({ gtag: (...a) => google.push(a), fbq: (...a) => meta.push(a) }), () => ({}));
late.consent('accepted'); late.enqueue(purchase); assert.equal(google.length, 0);
late.ready('google'); assert.equal(google.length, 1); assert.equal(meta.length, 0);
late.ready('meta'); assert.equal(meta.length, 1); assert.equal(google.length, 1);

google = []; meta = [];
const rejected = createStoreTracking('store-a', ids, () => ({ gtag: (...a) => google.push(a), fbq: (...a) => meta.push(a) }), () => ({}));
rejected.enqueue(purchase); rejected.consent('rejected'); rejected.ready('google'); rejected.ready('meta');
rejected.enqueue({ event: 'AddToCart', storeId: 'store-a', product }); rejected.consent('accepted');
assert.equal(google.length + meta.length, 0, 'Rejection discards pending and subsequent events');

let bounded = [];
const limited = createStoreTracking('store-a', trackingIds(null, 'G-TEST1234'), () => ({ gtag: (...a) => bounded.push(a) }), () => ({}));
for (let n = 0; n < 45; n++) limited.enqueue({ event: 'AddToCart', storeId: 'store-a', product });
limited.consent('accepted'); limited.ready('google'); assert.equal(bounded.length, 30);
const blocked = createStoreTracking('store-a', ids, () => ({ gtag: () => { throw Error('blocked'); } }), () => ({}));
blocked.consent('accepted'); blocked.ready('google'); assert.doesNotThrow(() => blocked.enqueue(purchase));
console.log('PASS analytics: consent, late initialization, tenant destination, GA4 items, deduplication, bounded queue and no customer data.');

// Exercise the component lifecycle with inert SDKs and Script elements; never contact analytics services.
const React = require('react');
let slots = [], cursor = 0, effects = [], calls = [], listeners = new Set(), microtasks = [];
const changed = (before, after) => !before || after.some((value, index) => value !== before[index]);
const hooks = {
  useState: initial => { const index = cursor++; slots[index] ??= { value: initial }; return [slots[index].value, value => { slots[index].value = value; }]; },
  useRef: initial => { const index = cursor++; return slots[index] ??= { current: initial }; },
  useMemo: (fn, deps) => { const index = cursor++; if (changed(slots[index]?.deps, deps)) slots[index] = { deps, value: fn() }; return slots[index].value; },
  useEffect: (fn, deps) => { const index = cursor++; if (changed(slots[index]?.deps, deps)) {
    const previous = slots[index]; slots[index] = { deps }; effects.push(() => { previous?.cleanup?.(); slots[index].cleanup = fn(); });
  } },
};
const browser = { gtag: (...args) => calls.push(args), addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn) };
const componentExports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/store/StoreAnalytics.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText, { exports: componentExports, window: browser, queueMicrotask: fn => microtasks.push(fn),
  localStorage: { getItem: () => { throw Error('storage disabled'); }, setItem: () => { throw Error('storage disabled'); } },
  require: name => ({ react: hooks, 'next/script': { __esModule: true, default: 'mock-script' },
    '@/lib/store-analytics-events': exportsObject, '@/lib/store-webhook-contract': { captureStoreAttribution: () => {}, readStoreAttribution: () => ({}) },
  })[name] || require(name) });
function render(props) { cursor = 0; effects = []; const tree = componentExports.default(props); effects.forEach(fn => fn()); return tree; }
function nodes(tree) { return React.Children.toArray(tree?.props?.children).flatMap(child => typeof child === 'object' ? [child, ...nodes(child)] : []); }
const props = { storeId: 'store-a', googleAnalyticsId: 'G-TEST1234', viewContent: product };
let tree = render(props);
assert.equal(nodes(tree).filter(node => node.type === 'mock-script').length, 0, 'No scripts before consent');
listeners.forEach(fn => fn({ detail: purchase })); assert.equal(calls.length, 0);
assert.doesNotThrow(() => nodes(tree).find(node => node.type === 'button' && node.props.children === 'Aceitar métricas').props.onClick());
tree = render(props); assert.equal(calls.length, 0, 'Accepted events wait for initialization');
const gtag = browser.gtag; delete browser.gtag;
nodes(tree).filter(node => node.type === 'mock-script' && node.props.onReady).forEach(node => node.props.onReady());
assert.equal(calls.length, 0, 'Vinext may call onReady before inserting inline scripts');
browser.gtag = gtag; microtasks.splice(0).forEach(fn => fn());
assert.deepEqual(calls.map(call => call[1]), ['purchase', 'view_item']);
tree = render({ ...props, storeId: 'store-b', googleAnalyticsId: 'G-OTHER123' });
assert.equal(nodes(tree).filter(node => node.type === 'mock-script').length, 0, 'Store B cannot inherit Store A consent');
listeners.forEach(fn => fn({ detail: purchase })); assert.equal(calls.length, 2);
nodes(tree).find(node => node.type === 'button' && node.props.children === 'Recusar').props.onClick();
tree = render({ ...props, storeId: 'store-b', googleAnalyticsId: 'G-OTHER123' });
assert.equal(nodes(tree).filter(node => node.type === 'mock-script').length, 0);
console.log('PASS component: early purchase retained, blocked storage safe, consent before scripts and reset between stores.');
