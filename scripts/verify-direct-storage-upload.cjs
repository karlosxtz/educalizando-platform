const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => mocks[name] || require(name), Buffer, File, Blob, Request, Response, FormData, console, URL, Set, Uint8Array, Error, AbortSignal, fetch });
  return exports;
}
const direct = load('src/lib/direct-storage-upload.ts');
const valid = { bucket: 'store-assets', fileName: 'photo.webp', size: 100, contentType: 'image/webp' };
let user = { id: 'creator-a', user_metadata: {} }, allowed = true, signed;
const route = load('src/app/api/storage/presign-upload/route.ts', {
  'next/server': { NextResponse: Response },
  '@/lib/api-auth': { getRequestUser: async () => user },
  '@/lib/direct-storage-upload': direct,
  '@/lib/request-rate-limit': { consumeRequestRateLimit: async () => ({ allowed }), rateLimitResponse: () => Response.json({}, { status: 429 }) },
  '@/lib/storage-object-name': load('src/lib/storage-object-name.ts'),
  '@/lib/supabase': { supabaseAdmin: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { nome_loja: 'Loja Teste' } }) }) }) }) } },
  '@/lib/object-storage': {
    resolveBucket: name => name === 'product-files' ? 'private-materials' : name === 'plr-files' ? 'private-plr' : 'public-images',
    uploadCacheControl: bucket => bucket === 'public-images' ? 'public, max-age=31536000, immutable' : 'private, no-store',
    platformPublicImageUrl: (bucket, key) => 'https://arquivos.educalizando.com.br/' + bucket + '/' + key,
    createUploadUrl: async input => { signed = input; return 'https://arquivos.educalizando.com.br/' + input.bucket + '/' + input.key + '?X-Amz-Signature=test'; },
  },
});
async function authorize(body) {
  return route.POST(new Request('https://www.educalizando.com.br/api/storage/presign-upload', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }));
}
(async () => {
  for (const bad of [null, { ...valid, bucket: 'private-materials' }, { ...valid, size: 0 }, { ...valid, size: 1.5 }, { ...valid, size: 16 * 1024 * 1024 }, { ...valid, contentType: 'image/svg+xml', fileName: 'x.svg' }, { ...valid, contentType: 'text/html', fileName: 'x.html' }, { ...valid, fileName: 'film.mp4' }, { ...valid, contentType: 'image/png' }]) assert.throws(() => direct.validateUploadMetadata(bad));
  user = null;
  assert.equal((await authorize(valid)).status, 401);
  user = { id: 'creator-a', user_metadata: {} };
  allowed = false;
  assert.equal((await authorize(valid)).status, 429);
  allowed = true;
  assert.equal((await authorize({ ...valid, size: 0 })).status, 400);
  for (const [logical, physical, fileName, contentType] of [
    ['store-assets', 'public-images', 'photo.webp', 'image/webp'],
    ['product-files', 'private-materials', 'material.pdf', 'application/pdf'],
    ['plr-files', 'private-plr', 'license.zip', 'application/zip'],
  ]) {
    const result = await authorize({ ...valid, bucket: logical, fileName, contentType });
    assert.equal(result.status, 200);
    assert.match(result.headers.get('Cache-Control'), /no-store/);
    const ticket = await result.json();
    assert.equal(signed.bucket, physical);
    assert.equal(signed.size, valid.size);
    assert.equal(signed.contentType, contentType);
    assert.match(signed.key, /\/creator-a\//);
    assert.equal(ticket.expiresIn, 900);
    if (logical !== 'store-assets') assert.match(ticket.value, new RegExp('^minio://' + physical + '/'));
    const file = new File([Buffer.alloc(valid.size)], fileName, { type: contentType });
    let attempts = 0, authorizations = 0;
    const output = await direct.sendDirectStorageUpload(file, async () => { authorizations++; return ticket; }, async (url, options) => {
      assert.equal(new URL(url).hostname, 'arquivos.educalizando.com.br');
      assert.equal(options.method, 'PUT');
      assert.equal(options.body, file);
      assert.equal(options.credentials, 'omit');
      assert.equal(options.headers.Authorization, undefined);
      assert.equal(options.headers['Content-Type'], contentType);
      assert.equal(options.headers['Cache-Control'], ticket.uploadHeaders['Cache-Control']);
      return new Response(null, { status: attempts++ === 0 ? 403 : 200 });
    });
    assert.equal(output, ticket.value);
    assert.equal(authorizations, 2, 'Expired authorization renews silently');
    attempts = 0;
    await assert.rejects(() => direct.sendDirectStorageUpload(file, async () => ticket, async () => { attempts++; return new Response(null, { status: 403 }); }));
    assert.equal(attempts, 2, 'Retries stay bounded');
    await assert.rejects(() => direct.sendDirectStorageUpload(file, async () => ({ ...ticket, uploadUrl: 'https://evil.example/?X-Amz-Signature=x' }), async () => { throw new Error('Must not send'); }));
  }
  const file = new File([Buffer.from('file')], 'test.pdf', { type: 'application/pdf' });
  const ticket = { uploadUrl: 'https://arquivos.educalizando.com.br/private-materials/uploads/test.pdf?X-Amz-Signature=test', uploadHeaders: { 'Content-Type': 'application/pdf', 'Cache-Control': 'private, no-store' }, expiresIn: 900, value: 'minio://private-materials/uploads/test.pdf' };
  let calls = 0, refreshed = 0;
  // Exercise the real client's metadata-only request and session renewal.
  const originalFetch = global.fetch;
  global.fetch = async (_, options) => {
    assert.equal(options.body instanceof File, false);
    assert.equal(JSON.parse(options.body).size, file.size);
    return calls++ === 0 ? new Response(null, { status: 401 }) : Response.json(ticket);
  };
  // VM bindings are immutable references, so load the client with this fetch.
  const renewedClient = load('src/lib/object-storage-client.ts', {
    '@/lib/supabase': { supabase: { auth: { getSession: async () => ({ data: { session: { access_token: 'old-token' } } }), refreshSession: async () => { refreshed++; return { data: { session: { access_token: 'renewed-token' } } }; } } } },
    './public-links': { normalizePublicAssetUrl: value => value },
    './image-upload-profile': load('src/lib/image-upload-profile.ts'),
    './direct-storage-upload': { ...direct, sendDirectStorageUpload: async (_, auth) => (await auth()).value },
    'browser-image-compression': async input => input,
  });
  assert.equal(await renewedClient.uploadToObjectStorage('product-files', file), ticket.value);
  global.fetch = originalFetch;
  assert.equal(refreshed, 1);
  assert.equal(calls, 2);
  console.log('PASS: direct MinIO upload, automatic expiry/session renewal, private PLR/PDF, size/type checks, bounded retries, no platform credentials sent to storage.');
})().catch(error => { console.error(error); process.exitCode = 1; });
