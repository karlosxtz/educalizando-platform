const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file, mocks = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText, { exports, require: name => name === 'server-only' ? {} : mocks[name] || require(name), URL, URLSearchParams, FormData, Request, Response, Headers, AbortSignal, Buffer, Blob, console, setTimeout, clearTimeout, ...globals });
  return exports;
}
async function main() {
  const publicImage = load('src/lib/public-image-url.ts');
  const seo = load('src/lib/seo.ts', { './public-image-url': publicImage });
  const description = load('src/lib/product-description.ts');
  const design = load('src/lib/instagram-design.ts');
  const contract = load('src/lib/instagram-contract.ts', { './seo': seo, './product-description': description, './instagram-design': design });
  const env = { INSTAGRAM_PUBLISHING_ENABLED: 'true', INSTAGRAM_APP_ID: '1234', INSTAGRAM_APP_SECRET: 'test-only-secret', INSTAGRAM_GRAPH_API_VERSION: 'v99.0', INSTAGRAM_TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64') };
  const security = load('src/lib/instagram-security.ts', { './seo': seo }, { process: { env } });
  const disabled = load('src/lib/instagram-security.ts', { './seo': seo }, { process: { env: {} } });
  assert.equal(disabled.instagramConfig(), null);
  const state = security.newInstagramState();
  assert(security.validInstagramState(state, state));
  assert(!security.validInstagramState(state, state + 'a'));
  assert(!security.validInstagramState(state, undefined));
  assert(!security.validInstagramState('a'.repeat(43), 'b'.repeat(43)));
  assert(!security.validInstagramState(state, 'é'.repeat(43)));
  const authorization = new URL(security.instagramAuthorizationUrl(state));
  assert.equal(authorization.origin, 'https://www.instagram.com');
  assert.equal(authorization.searchParams.get('redirect_uri'), 'https://www.educalizando.com.br/api/creator/instagram/callback');
  assert.equal(authorization.searchParams.get('scope'), 'instagram_business_basic,instagram_business_content_publish');
  assert(!authorization.href.includes(env.INSTAGRAM_APP_SECRET));
  const encrypted = security.encryptInstagramToken('private-test-token', 'store-a');
  assert(!encrypted.includes('private-test-token'));
  assert.equal(security.decryptInstagramToken(encrypted, 'store-a'), 'private-test-token');
  assert.throws(() => security.decryptInstagramToken(encrypted, 'store-b'));
  const productId = '22222222-2222-4222-8222-222222222222', postId = '33333333-3333-4333-8333-333333333333';
  const tables = { products: [{ id: productId, store_id: 'store-a', status: 'publicado', excluido_em: null, updated_at: '2026-10-17T10:00:00Z' }], creator_instagram_posts: [] };
  let updateSerial = 0;
  const db = { from(table) {
    let filters = [], operation = 'read', values;
    const query = {
      select() { return this; }, eq(key, value) { filters.push(row => row[key] === value); return this; },
      in(key, list) { filters.push(row => list.includes(row[key])); return this; },
      is(key, value) { filters.push(row => (row[key] ?? null) === value); return this; },
      insert(input) { operation = 'insert'; values = input; return this; },
      update(input) { operation = 'update'; values = input; return this; },
      async maybeSingle() { return this.single(); },
      async single() {
        const rows = tables[table] || [];
        if (operation === 'insert') {
          if (rows.some(row => row.id === values.id)) return { data: null, error: { code: '23505' } };
          const row = { status: 'awaiting_upload', container_id: null, media_id: null, error_message: null, ...values, updated_at: 'version-' + updateSerial++ };
          rows.push(row); return { data: { ...row }, error: null };
        }
        const row = rows.find(item => filters.every(test => test(item)));
        if (!row) return { data: null, error: null };
        if (operation === 'update') Object.assign(row, values, { updated_at: 'version-' + updateSerial++ });
        return { data: { ...row }, error: null };
      },
    }; return query;
  } };
  class InputError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
  const connection = { id: 'conn-a', store_id: 'store-a', instagram_user_id: '123456', account_type: 'BUSINESS' };
  let containerCalls = 0, publishCalls = 0, containerStatus = 'IN_PROGRESS', uncertain = false;
  const publishing = load('src/lib/instagram-publishing.ts', {
    './supabase': { supabaseAdmin: db }, './instagram-contract': contract, './public-image-url': publicImage, './instagram-design': design,
    './object-storage': { resolveBucket: () => 'public-images', createUploadUrl: async () => 'https://minio.test/upload', uploadCacheControl: () => 'public, max-age=31536000, immutable', headObject: async () => ({ ContentType: 'image/jpeg', ContentLength: 1234 }) },
    './instagram-store': { InstagramInputError: InputError, readInstagramConnection: async (storeId, id) => storeId === 'store-a' && (!id || id === connection.id) ? connection : { ...connection, id: 'conn-b', store_id: storeId }, usableInstagramToken: async () => 'test-token' },
    './instagram-provider': { createInstagramContainer: async () => { containerCalls++; return '987'; }, instagramContainerStatus: async () => containerStatus,
      publishInstagramContainer: async () => { publishCalls++; if (uncertain) throw new Error('network interrupted'); return '456'; } },
  });
  const payload = { id: postId, productId, target: 'feed', caption: 'Conteúdo real.', size: 1234, expectedUpdatedAt: tables.products[0].updated_at };
  const prepared = await publishing.prepareInstagramPost('store-a', payload);
  assert(tables.creator_instagram_posts[0].caption.endsWith('@educalizando_brasil'), 'Server must enforce the brand mention on new Feed posts');
  assert.equal(design.instagramBrandedCaption('Olá\n\n@educalizando_brasil'), 'Olá\n\n@educalizando_brasil', 'Do not duplicate an existing mention');
  assert.equal(design.instagramBrandedCaption('Olá @educalizando_brasil_fake').endsWith('\n\n@educalizando_brasil'), true);
  assert.equal(design.instagramBrandedCaption('Olá @educalizando_brasil.outro').endsWith('\n\n@educalizando_brasil'), true);
  assert.equal(prepared.post.status, 'awaiting_upload');
  assert.equal(prepared.uploadHeaders['Content-Type'], 'image/jpeg');
  assert(!JSON.stringify(prepared).includes('test-token'));
  assert.equal(containerCalls + publishCalls, 0, 'Preparing an upload must not publish');
  await publishing.prepareInstagramPost('store-a', payload);
  assert.equal(tables.creator_instagram_posts.length, 1, 'Repeated preparation is idempotent');
  await assert.rejects(publishing.prepareInstagramPost('store-a', { ...payload, caption: 'Outra legenda' }), /já foi usada/);
  await assert.rejects(publishing.prepareInstagramPost('store-b', { ...payload, id: '44444444-4444-4444-8444-444444444444' }), /produto publicado/);
  await assert.rejects(publishing.prepareInstagramPost('store-a', { ...payload, expectedUpdatedAt: 'outdated' }), /atualizado/);
  await assert.rejects(publishing.prepareInstagramPost('store-a', { ...payload, caption: 'a'.repeat(2200) }), /Encurte/);
  await assert.rejects(publishing.advanceInstagramPost('store-b', postId, true), /não encontrada/);
  assert.equal((await publishing.advanceInstagramPost('store-a', postId, false)).status, 'awaiting_upload');
  assert.equal(containerCalls, 0, 'GET status cannot create a container');
  await Promise.all([publishing.advanceInstagramPost('store-a', postId, true), publishing.advanceInstagramPost('store-a', postId, true)]);
  assert.equal(containerCalls, 1, 'Concurrent requests must claim container creation once');
  containerStatus = 'FINISHED';
  await publishing.advanceInstagramPost('store-a', postId, false);
  assert.equal(publishCalls, 0, 'GET status cannot publish a prepared container');
  await Promise.all([publishing.advanceInstagramPost('store-a', postId, true), publishing.advanceInstagramPost('store-a', postId, true)]);
  assert.equal(publishCalls, 1, 'Concurrent requests cannot duplicate a publication');
  assert.equal((await publishing.advanceInstagramPost('store-a', postId, true)).status, 'published');
  assert.equal(publishCalls, 1);
  const unknownId = '55555555-5555-4555-8555-555555555555';
  await publishing.prepareInstagramPost('store-a', { ...payload, id: unknownId });
  await publishing.advanceInstagramPost('store-a', unknownId, true);
  uncertain = true;
  assert.equal((await publishing.advanceInstagramPost('store-a', unknownId, true)).status, 'uncertain');
  const callsAfterFailure = publishCalls;
  await publishing.advanceInstagramPost('store-a', unknownId, true);
  assert.equal(publishCalls, callsAfterFailure, 'Never retry an uncertain media_publish');
  containerStatus = 'PUBLISHED';
  assert.equal((await publishing.advanceInstagramPost('store-a', unknownId, false)).status, 'published');
  assert.equal(publishCalls, callsAfterFailure);
  connection.account_type = 'CREATOR';
  await assert.rejects(publishing.prepareInstagramPost('store-a', { ...payload, target: 'story' }), /tipo Empresa/);

  const calls = [];
  let shortResponse = { access_token: 'short-token', user_id: 123456 };
  let profileResponse = { user_id: '123456', username: 'loja.real', account_type: 'BUSINESS' };
  const provider = load('src/lib/instagram-provider.ts', { './instagram-security': security }, { fetch: async (url, options) => {
    const parsed = new URL(url); calls.push({ url: parsed, options });
    if (parsed.hostname === 'api.instagram.com') return Response.json(shortResponse);
    if (parsed.pathname === '/access_token') return Response.json({ access_token: 'long-token', expires_in: 5184000 });
    if (parsed.pathname.endsWith('/me')) return Response.json(profileResponse);
    if (parsed.pathname.endsWith('/media')) return Response.json({ id: '987' });
    return Response.json({ id: '456' });
  } });
  const account = await provider.exchangeInstagramCode('one-time-code');
  assert.equal(account.username, 'loja.real');
  assert(calls[0].options.body instanceof FormData, 'Meta documents multipart form-data');
  assert.equal(calls[0].options.body.get('redirect_uri'), 'https://www.educalizando.com.br/api/creator/instagram/callback');
  shortResponse = { data: [{ access_token: 'short-token', user_id: '123456' }] };
  profileResponse = { data: [{ user_id: '123456', username: 'loja.real', account_type: 'Business' }] };
  const currentAccount = await provider.exchangeInstagramCode('new-one-time-code');
  assert.equal(currentAccount.username, 'loja.real', 'Current data envelope must connect');
  assert.equal(currentAccount.accountType, 'BUSINESS', 'Provider case variants must preserve the account type');
  for (const invalid of [{ data: [] }, { data: [null] }, { data: [{ access_token: 'first' }, { access_token: 'second' }] }]) {
    shortResponse = invalid;
    await assert.rejects(provider.exchangeInstagramCode('another-code'), error => error.stage === 'short_token');
  }
  await provider.createInstagramContainer('123456', account.token, 'https://minio.test/arte.jpg', 'story', 'Não deve virar legenda de Story');
  assert.equal(calls.at(-1).options.body.get('media_type'), 'STORIES');
  assert.equal(calls.at(-1).options.body.has('caption'), false);
  await provider.createInstagramContainer('123456', account.token, 'https://minio.test/arte.jpg', 'feed', 'Legenda aprovada');
  assert.equal(calls.at(-1).options.body.get('caption'), 'Legenda aprovada');
  assert.equal(calls.at(-1).options.headers.Authorization, 'Bearer long-token');
  assert(calls.every(call => call.options.redirect === 'manual' && call.options.cache === 'no-store'));
  const failedProvider = load('src/lib/instagram-provider.ts', { './instagram-security': security }, { fetch: async () => Response.json({ error: { code: 190, message: 'private-token-must-never-escape' } }, { status: 400 }) });
  await assert.rejects(failedProvider.instagramContainerStatus('123', 'private-token-must-never-escape'), error => !error.message.includes('private-token-must-never-escape') && error.message.includes('expirou'));
  await assert.rejects(failedProvider.exchangeInstagramCode('private-code'), error => error.stage === 'short_token' && error.httpStatus === 400 && !JSON.stringify(error).includes('private-token-must-never-escape'));
  let redirectCalls = 0;
  const redirectedProvider = load('src/lib/instagram-provider.ts', { './instagram-security': security }, { fetch: async (_url, options) => {
    redirectCalls++; assert.equal(options.redirect, 'manual');
    return new Response(null, { status: 302, headers: { Location: 'https://unexpected.invalid/private-token' } });
  } });
  await assert.rejects(redirectedProvider.exchangeInstagramCode('private-code'), error => error.httpStatus === 302 && !JSON.stringify(error).includes('private-token'));
  assert.equal(redirectCalls, 1, 'Never forward OAuth credentials to redirected destinations');

  const drawings = [], canvases = [], qrLinks = [], loadedImages = [];
  const context = { measureText: text => ({ width: text.length * 20 }), fillText: text => drawings.push(text), fillRect() {}, drawImage() {}, createLinearGradient: () => ({ addColorStop() {} }) };
  class TestImage {
    naturalWidth = 800; naturalHeight = 1200;
    set src(value) { if (value) { loadedImages.push(value); queueMicrotask(() => this.onload()); } }
  }
  const artwork = load('src/lib/instagram-artwork.ts', {
    './instagram-contract': contract, './instagram-design': design, './catalog-image-url': { catalogImageUrl: value => value },
    'qrcode': { toDataURL: async url => { qrLinks.push(url); return 'data:image/png;base64,test'; } },
  }, { Image: TestImage, document: { createElement: () => { const canvas = { width: 0, height: 0, getContext: () => context, toBlob: (callback, type) => callback(new Blob(['image'], { type })) }; canvases.push(canvas); return canvas; } } });
  const displayProduct = { titulo: 'Jogo de letras', capa_url: 'https://minio.test/capa.jpg', preco: 12.5, arquivo_url: 'PRIVATE' };
  const displayStore = { nome_loja: 'Minha loja', slug: 'minha-loja', cor_primaria: '#123456' };
  const storyImage = await artwork.createInstagramArtwork(displayProduct, displayStore, 'story');
  const feedImage = await artwork.createInstagramArtwork(displayProduct, displayStore, 'feed');
  assert.equal(storyImage.type, 'image/jpeg'); assert.equal(feedImage.type, 'image/jpeg');
  assert.deepEqual(canvases.map(canvas => [canvas.width, canvas.height]), [[1080, 1920], [1080, 1350]]);
  assert(drawings.includes('Jogo de letras') && !drawings.some(text => /R\$\s+12,50/.test(text)), 'Price is hidden by default');
  assert(drawings.includes('@educalizando_brasil'));
  await artwork.createInstagramArtwork(displayProduct, displayStore, 'feed', { ...design.defaultInstagramDesign(), showPrice: true, title: 'Título da divulgação', cta: 'Veja o material', background: 'solid' });
  assert(drawings.includes('Título da divulgação') && drawings.includes('Veja o material') && drawings.some(text => /R\$\s+12,50/.test(text)));
  const qrOptions = { ...design.defaultInstagramDesign(), layout: 'editorial', background: 'photo', backgroundUrl: 'blob:local-background', logoUrl: 'blob:local-logo', showQr: true, fit: 'cover' };
  await artwork.createInstagramArtwork({ ...displayProduct, id: productId, slug: 'jogo-real' }, displayStore, 'story', qrOptions);
  assert.equal(qrLinks[0], 'https://www.educalizando.com.br/loja/minha-loja/produto/jogo-real');
  assert(loadedImages.includes('blob:local-background') && loadedImages.includes('blob:local-logo'));
  assert.equal(loadedImages.filter(url => url === displayProduct.capa_url).length, 1, 'Style changes must reuse the decoded cover, not download again');
  await assert.rejects(artwork.createInstagramArtwork(displayProduct, displayStore, 'feed', { ...qrOptions, backgroundUrl: '' }), /imagem de fundo/);
  const stripped = design.savedInstagramDesign({ ...design.defaultInstagramDesign(), title: 'Outro produto', subtitle: 'Não reutilizar', primary: 'javascript:bad', titleSize: 10000, backgroundUrl: 'https://private.invalid' });
  assert.equal(stripped.title, ''); assert.equal(stripped.subtitle, ''); assert.equal(stripped.titleSize, 76); assert.equal(stripped.primary, '#173b79'); assert(!('backgroundUrl' in stripped));
  assert(!drawings.some(text => /PRIVATE|desconto|mais vendido/i.test(text)));
  assert(!contract.instagramProductCaption({ ...displayProduct, id: productId }, displayStore).includes('PRIVATE'));
  const longCaption = contract.instagramProductCaption({ ...displayProduct, id: productId, slug: 'produto-real', descricao: 'Descrição factual do arquivo. '.repeat(200) }, displayStore);
  assert(longCaption.length <= 2200 && longCaption.includes('https://www.educalizando.com.br/loja/minha-loja/produto/produto-real') && longCaption.endsWith('@educalizando_brasil'));
  assert(!longCaption.includes('R$'), 'Default caption also omits price');
  assert(contract.instagramProductCaption({ ...displayProduct, id: productId }, displayStore, { showPrice: true }).includes('12,50'));
  await assert.rejects(artwork.createInstagramArtwork({ ...displayProduct, preco: NaN }, displayStore, 'feed', { ...design.defaultInstagramDesign(), showPrice: true }), /preço/);
  const button = load('src/components/creator/InstagramProductButton.tsx', {
    'next/link': { __esModule: true, default: ({ href, children }) => React.createElement('a', { href }, children) },
  }).default;
  const buttonHtml = renderToStaticMarkup(React.createElement(button, { productId, published: true }));
  assert(buttonHtml.includes('/dashboard/instagram?produto=' + productId) && buttonHtml.includes('Criar Story ou Feed'));
  const draftHtml = renderToStaticMarkup(React.createElement(button, { productId, published: false }));
  assert(draftHtml.includes('disabled') && !draftHtml.includes('href='));
  const sql = fs.readFileSync('supabase/migrations/20261017210000_create_creator_instagram.sql', 'utf8');
  assert.equal((sql.match(/enable row level security/g) || []).length, 3);
  assert(sql.includes('revoke all') && !/create policy|alter table public\.(products|stores)\b/i.test(sql));
  console.log('PASS Instagram: OAuth/cifra por loja, tenant isolado, JPEG direto, idempotência concorrente, resultado incerto sem reenvio e tabelas somente no servidor.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
