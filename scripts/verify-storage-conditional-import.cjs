const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const objects = new Map();
let failureStatus = null, writes = 0;
class Command { constructor(input) { this.input = input; } }
class Client {
  async send(command) {
    const { Bucket, Key, IfNoneMatch, CacheControl, Body } = command.input;
    assert.equal(IfNoneMatch, '*', 'Every attempt must prevent overwrites');
    assert.equal(CacheControl, 'private, no-store');
    if (failureStatus) throw { $metadata: { httpStatusCode: failureStatus } };
    const key = Bucket + '/' + Key;
    if (objects.has(key)) throw { $metadata: { httpStatusCode: 412 } };
    objects.set(key, Body); writes++;
    return { $metadata: { httpStatusCode: 200 } };
  }
}
const exported = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/object-storage.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, {
  exports: exported,
  require: name => {
    if (name === 'server-only' || name.includes('public-links') || name.includes('public-image-url') || name.includes('s3-request-presigner')) return {};
    if (name === '@aws-sdk/client-s3') return { S3Client: Client, PutObjectCommand: Command };
    throw new Error(name);
  },
  process: { env: { OBJECT_STORAGE_ENDPOINT: 'https://storage.example.org', OBJECT_STORAGE_ACCESS_KEY_ID: 'test-only', OBJECT_STORAGE_SECRET_ACCESS_KEY: 'test-only' } },
});
(async () => {
  const asset = { bucket: 'private-materials', key: 'platform-imports/store/product/0-content.pdf', body: new Uint8Array([1, 2]), contentType: 'application/pdf' };
  const upload = () => exported.uploadObjectIfAbsent(asset);
  assert.equal(await upload(), true);
  assert.equal(await upload(), false);
  assert.equal(writes, 1, 'Retry must not create another storage version');
  objects.clear(); writes = 0;
  const concurrent = await Promise.all([upload(), upload()]);
  assert.equal(concurrent.filter(Boolean).length, 1);
  assert.equal(writes, 1, 'Concurrent attempts must create one object');
  for (const status of [403, 409, 500, 501]) {
    failureStatus = status;
    await assert.rejects(upload, error => error.$metadata.httpStatusCode === status);
  }
  assert.equal(writes, 1, 'Failures must not trigger an unconditional upload');
  console.log('PASS conditional import: atomic create, retry, concurrency, private cache and fail-closed storage errors.');
})().catch(error => { console.error(error); process.exitCode = 1; });
