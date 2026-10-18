const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file, mocks = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText,
    { exports, require: name => mocks[name] || require(name), URL, Response, console });
  return exports;
}
const description = load('src/lib/product-description.ts');
const sections = load('src/lib/product-description-sections.ts', { './product-description': description });
const legacy = 'Material do criador.\n\nTexto original com detalhes.';
assert.equal(sections.parseProductDescription(legacy).intro, legacy);
const draft = { ...sections.emptyDescriptionDraft(), intro: 'Proposta real', includes: '• Dois arquivos\n• Uma atividade', usage: 'Imprimir e recortar.' };
const composed = sections.composeProductDescription(draft);
assert.deepEqual(JSON.parse(JSON.stringify(sections.parseProductDescription(composed))), draft);
assert(!composed.includes('Condições de uso') && !composed.includes('Público indicado'));
assert.equal(sections.parseProductDescription('Esta frase fala como usar o produto.').intro, 'Esta frase fala como usar o produto.');
const Content = load('src/components/store/ProductDescriptionContent.tsx', { '@/lib/product-description-sections': sections }).default;
const html = renderToStaticMarkup(React.createElement(Content, { value: composed }));
assert.match(html, /<h3[^>]*>O que está incluído/);
assert.match(html, /<li>Dois arquivos<\/li>/);
assert(!html.includes('<h1') && !html.includes('BNCC'));
const safe = renderToStaticMarkup(React.createElement(Content, { value: '<p>Texto real</p><script>secreto()</script>' }));
assert(!safe.includes('<script') && !safe.includes('secreto()'));
assert(renderToStaticMarkup(React.createElement(Content, { value: 'Sobre este material\n<img src=x onerror=alert(1)>Teste' })).includes('Teste'));
const score = load('src/lib/product-seo-score.ts');
const selection = load('src/lib/product-selection.ts');
const opportunities = load('src/lib/product-opportunities.ts', { './product-seo-score': score, './product-selection': selection, './product-description-sections': sections });
const base = { id: 'a', store_id: 'tenant-a', status: 'publicado', titulo: 'Material pedagógico para testar critérios', descricao: composed + ' Conteúdo real.'.repeat(10), capa_url: 'https://example.test/cover.jpg', category_id: 'cat', education_level_id: 'level', tags: ['material'], slug: 'material', preview_url: 'https://example.test/sample.pdf', format_details: 'PDF', age_range: '8 anos' };
const records = [base, { ...base, id: 'b', titulo: 'Curto', descricao: '' }, { ...base, id: 'foreign', store_id: 'tenant-b' }, { ...base, id: 'draft', status: 'rascunho' }, { ...base, id: 'deleted', excluido_em: '2026-10-18' }];
const before = JSON.stringify(records);
const ranked = opportunities.rankedProductOpportunities(records, 'tenant-a');
assert.equal(ranked.length, 2); assert.equal(ranked[0].product.id, 'b'); assert.equal(ranked[1].score, 100);
assert.equal(JSON.stringify(records), before);
assert.equal(opportunities.productOpportunities({ ...base, images: [{ url: base.capa_url }], preview_url: null }).actions.some(a => a.text.includes('amostra')), true);
const contract = load('src/lib/store-webhook-contract.ts');
const campaignLink = load('src/lib/campaign-link.ts', { './public-links': { publicStoreUrl: slug => 'https://www.educalizando.com.br/loja/' + encodeURIComponent(slug) } });
const campaignUrl = new URL(campaignLink.creatorCampaignLink('loja-real', 'instagram', 'social', 'natal 2026'));
assert.equal(campaignUrl.origin, 'https://www.educalizando.com.br'); assert.equal(campaignUrl.searchParams.get('utm_campaign'), 'natal 2026');
assert.equal(campaignLink.creatorCampaignLink('loja', 'google', 'organic', 'fake organic'), null);
assert.equal(campaignLink.creatorCampaignLink('', 'instagram', 'social', 'campanha'), null);
assert.equal(opportunities.productOpportunities(base).visits, null);
const origin = load('src/lib/order-origin.ts', { './store-webhook-contract': contract });
for (const value of [null, {}, { fbclid: 'click' }, { src: 'unknown' }]) assert.notEqual(origin.orderOrigin(value).channel, 'declared_organic');
assert.equal(origin.orderOrigin({ fbclid: 'click' }).channel, 'meta_click');
assert.equal(origin.orderOrigin({ gclid: 'click', utm_medium: 'organic' }).channel, 'google_ads');
assert.equal(origin.orderOrigin({ utm_source: 'google', utm_medium: 'organic' }).channel, 'declared_organic');
assert.equal(origin.orderOrigin({ utm_source: 'instagram', utm_medium: 'paid_social' }).channel, 'paid_campaign');
assert.equal(origin.orderOriginDayRange('2026-02-30'), null);
assert.equal(origin.orderOriginDayRange('2026-10-18').start, '2026-10-18T03:00:00.000Z');

async function routeTests() {
  let allowed = false, calls = [], missingColumn = false, fail = false;
  const db = { from: table => {
    calls.push(table);
    let selected = '';
    const chain = { select: fields => { selected = fields; return chain; }, eq: () => chain, gte: () => chain, lt: () => chain, order: () => chain,
      in: async () => ({ data: [{ id: 'tenant-a', nome_loja: 'Loja real' }], error: null }),
      limit: async () => fail ? { error: { code: 'XX', message: 'private detail' } } : missingColumn && selected.includes('tracking_parameters') ? { error: { code: '42703', message: 'tracking_parameters missing' } } : { data: [{ id: 'order', store_id: 'tenant-a', created_at: '2026-10-18T14:33:00Z', paid_at: null, total_amount: 7, tracking_parameters: selected.includes('tracking_parameters') ? { gclid: 'secret-click-id' } : undefined }], count: 1, error: null } };
    return chain;
  } };
  const route = load('src/app/api/admin/order-origins/route.ts', { '@/lib/api-auth': { isSuperAdmin: async () => allowed }, '@/lib/supabase': { supabaseAdmin: db }, '@/lib/order-origin': origin });
  const request = new Request('https://www.educalizando.com.br/api/admin/order-origins?date=2026-10-18');
  assert.equal((await route.GET(request)).status, 403); assert.equal(calls.length, 0);
  allowed = true;
  assert.equal((await route.GET(new Request('https://www.educalizando.com.br/api/admin/order-origins?date=bad'))).status, 400);
  const response = await route.GET(request), body = await response.json();
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(body.rows[0].origin.channel, 'google_ads');
  assert(!JSON.stringify(body).includes('secret-click-id') && !JSON.stringify(body).includes('buyer_email'));
  missingColumn = true;
  const fallback = await (await route.GET(request)).json(); assert.equal(fallback.trackingAvailable, false); assert.equal(fallback.rows[0].origin.channel, 'unknown');
  fail = true;
  const failed = await route.GET(request); assert.equal(failed.status, 503); assert(!(await failed.text()).includes('private detail'));
}
routeTests().then(() => console.log('PASS crescimento: descrição sem invenção/XSS, prioridades isoladas por loja, origens sem inferência, API só admin/sem cache/sem identificadores e compatibilidade de schema.')).catch(error => { console.error(error); process.exitCode = 1; });
