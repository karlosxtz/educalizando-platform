const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file, mocks = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText, { exports, require: name => mocks[name] || require(name), URL, console });
  return exports;
}
async function main() {
  const seo = load('src/lib/seo.ts', { './public-image-url': load('src/lib/public-image-url.ts') });
  const pages = load('src/lib/page-seo.ts', { './seo': seo });
  const catalog = load('src/lib/catalog-seo.ts', { './seo': seo, './page-seo': pages });
  const minio = 'https://arquivos.educalizando.com.br/public-images/uploads/';
  const product = { id: 'p', slug: 'material', titulo: 'Material real', tipo: 'pdf', preco: 9, preco_plr: 30,
    is_plr: true, page_count: 10, age_range: '7 anos', format_details: 'PDF colorido', capa_url: minio + 'capa.webp',
    arquivo_url: 'https://arquivos.educalizando.com.br/private-materials/pago.pdf',
    descricao: 'Prepare uma aula incrível! O kit contém 12 cartões para recortar. Confira a proposta com sua turma.',
    plr_descricao: 'Licença de revenda cadastrada.',
    images: [{ url: minio + 'segunda.webp', ordem: 2 }, { url: minio + 'primeira.webp', ordem: 1 },
      { url: minio + 'capa.webp', ordem: 0 }, { url: minio + 'primeira.webp', ordem: 3 }],
  };
  const before = JSON.stringify(product);
  const urls = seo.productPublicImageUrls(product);
  assert.deepEqual([...urls], [minio + 'capa.webp', minio + 'primeira.webp', minio + 'segunda.webp']);
  assert.equal(seo.productPublicImageUrls(product, 2).length, 2);
  for (const url of [minio + 'arquivo.pdf', 'javascript:alert(1)', 'http://localhost/a.png', 'https://localhost/a.png',
    'https://user:password@example.test/a.png', minio + 'a.png?X-Amz-Signature=secret', minio + 'a.png?token=secret',
    'https://arquivos.educalizando.com.br/private-materials/a.png', 'https://s3.test/storage/v1/object/sign/paid/a.png',
    'https://s3.test/a.png?X-Goog-Signature=secret', minio + 'a.png#private']) {
    assert.equal(seo.productPublicImageUrls({ capa_url: url }).length, 0, 'Unsafe image: ' + url);
  }
  const legacy = 'https://www.educalizando.com.br/api/storage/public-image?bucket=public-images&key=uploads%2Fcapa.webp';
  assert.equal(seo.productPublicImageUrls({ capa_url: legacy })[0], minio + 'capa.webp');
  const meta = catalog.productMetadata(product);
  assert.equal(meta.description, 'O kit contém 12 cartões para recortar. PDF · 10 páginas.');
  assert.equal(meta.description, meta.openGraph.description);
  assert.equal(meta.description, meta.twitter.description);
  assert.equal(meta.title, product.titulo + ' | Educalizando');
  assert.equal(catalog.productMetadata(product, true).description, product.plr_descricao);
  for (const source of ['O kit não inclui respostas.', 'Se o material inclui respostas, confira a proposta.', 'O kit inclui respostas?', 'O kit inclui respostas se a licença escolhida permitir.', 'O material pode incluir respostas.']) {
    const text = 'Uma atividade sobre letras. ' + source;
    assert.equal(catalog.productMetadata({ ...product, descricao: text }).description.startsWith('Uma atividade sobre letras.'), true);
  }
  const schema = catalog.productStructuredData(product, { nome_loja: 'Real', slug: 'real' });
  assert.deepEqual([...schema.image], [...urls]);
  const plr = catalog.productStructuredData(product, { nome_loja: 'Real', slug: 'real' }, true);
  assert.deepEqual([...plr.image], [product.capa_url]);
  assert.equal(plr.additionalProperty.length, 0);
  assert.equal(schema.offers.price, '9.00');
  assert.equal(plr.offers.price, '30.00');
  assert.equal(schema.aggregateRating, undefined);
  const Summary = load('src/components/store/ProductPublicSummary.tsx', {
    'next/link': { __esModule: true, default: ({ children, href }) => React.createElement('a', { href }, children) },
    '@/lib/seo': seo, '@/lib/product-description': load('src/lib/product-description.ts'),
    '@/components/CampaignAttribution': { __esModule: true, default: () => null },
  }).default;
  const store = { slug: 'real', nome_loja: 'Real' };
  const html = renderToStaticMarkup(React.createElement(Summary, { product, store }));
  assert(html.includes('Imagens cadastradas do material'));
  assert.match(html, /loading="lazy"/);
  for (const url of urls) assert(html.includes(url));
  assert(!html.includes('pago.pdf') && !html.includes('/_next/image'));
  const licenseHtml = renderToStaticMarkup(React.createElement(Summary, { product, store, plr: true }));
  assert(!licenseHtml.includes('primeira.webp') && !licenseHtml.includes('PDF colorido'));
  const sitemap = load('src/lib/catalog-sitemap.ts', {
    '@/lib/seo': seo, '@/lib/supabase': { supabase: {} }, '@/lib/sitemap-pagination': { collectSitemapRows: async () => [] },
    '@/lib/seo-public-catalog': { readSeoPublicCatalog: async () => ({ publicProducts: [product], stores: [], categories: [], storeRules: new Map(), categoryRules: new Map() }) },
  });
  const entries = await sitemap.readCatalogSitemapFields();
  assert.equal(entries.length, 1);
  assert.deepEqual(Array.from(entries[0].images, image => image.loc.href), [...urls]);
  assert.equal(entries[0].loc, 'https://www.educalizando.com.br/produto/material');
  assert.equal(before, JSON.stringify(product), 'Discovery must never edit registered data or reorder the original gallery');
  console.log('PASS imagens públicas no HTML/JSON-LD/sitemap, ordenação e deduplicação, bloqueio de URLs privadas/assinadas, resumos factuais e PLR isolado.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
