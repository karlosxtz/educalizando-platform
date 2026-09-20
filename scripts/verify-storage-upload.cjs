const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const objects = new Map();
let user = { id: 'user-a' };
let denied = false;
function load(file, mocks) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => mocks[name] || require(name), Buffer, File, Request, Response, FormData, console, URL, Uint8Array, Error });
  return exports;
}
const storage = {
  resolveBucket: () => 'private-materials',
  uploadObject: async ({ key, body }) => {
    if (denied) { const error = new Error(); error.name = 'AccessDenied'; throw error; }
    objects.set(key, Buffer.from(body));
  },
  getObject: async (_, key) => {
    if (!objects.has(key)) throw new Error('NoSuchKey');
    return { Body: { transformToString: async () => objects.get(key).toString(), transformToByteArray: async () => objects.get(key) } };
  },
  deleteObject: async (_, key) => objects.delete(key),
};
const { POST } = load('src/app/api/storage/upload-file/route.ts', {
  'next/server': { NextResponse: Response },
  '@/lib/api-auth': { getRequestUser: async () => user },
  '@/lib/object-storage': storage,
});
async function call(fields) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => form.append(key, value));
  const response = await POST(new Request('http://localhost/api/storage/upload-file', { method: 'POST', body: form }));
  return { status: response.status, data: await response.json() };
}
(async () => {
  user = null;
  assert.equal((await call({ action: 'init' })).status, 401);
  user = { id: 'user-a' };
  assert.equal((await call({ action: 'init', name: 'big.zip', size: String(16 * 1024 * 1024) })).status, 400);
  for (const size of [2, 3 * 1024 * 1024 + 1, 15 * 1024 * 1024]) {
    const bytes = Buffer.alloc(size, 73);
    const { data: ticket, status } = await call({ action: 'init', name: 'file.zip', size: String(size) });
    assert.equal(status, 200);
    user = { id: 'user-b' };
    assert.notEqual((await call({ action: 'complete', id: ticket.id })).status, 200);
    user = { id: 'user-a' };
    assert.equal((await call({ action: 'chunk', id: ticket.id, index: '0', file: new Blob([]) })).status, 400);
    for (let offset = 0, index = 0; offset < size; offset += ticket.chunkSize, index++) {
      assert.equal((await call({ action: 'chunk', id: ticket.id, index: String(index), file: new Blob([bytes.subarray(offset, offset + ticket.chunkSize)]) })).status, 200);
    }
    const result = await call({ action: 'complete', id: ticket.id });
    assert.equal(result.status, 200);
    assert.deepEqual(objects.get(result.data.value.replace('minio://private-materials/', '')), bytes);
    assert.equal([...objects.keys()].filter(key => key.includes(ticket.id) && key.startsWith('_pending/')).length, 0);
  }
  const ticket = (await call({ action: 'init', name: 'cancel.pdf', size: '2' })).data;
  assert.equal((await call({ action: 'cancel', id: ticket.id })).status, 200);
  denied = true;
  const failure = await call({ action: 'init', name: 'test.pdf', size: '2' });
  assert.equal(failure.status, 502);
  assert.match(failure.data.error, /credencial/);
  const links = load('src/lib/delivery-link.ts', {});
  assert.equal(links.isUploadedMaterial('minio://private-materials/file.pdf'), true);
  assert.equal(links.isUploadedMaterial('https://drive.google.com/file/d/123'), false);
  assert.equal(links.normalizeDeliveryLink(' https://drive.google.com/file/d/123 '), 'https://drive.google.com/file/d/123');
  assert.throws(() => links.normalizeDeliveryLink('javascript:alert(1)'));
  console.log('PASS: file integrity (2 B, 3 MB + 1 B, 15 MB), authentication, user isolation, invalid chunks, cleanup, credential errors, external links.');
})().catch(error => { console.error(error); process.exitCode = 1; });
