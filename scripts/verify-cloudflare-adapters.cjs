const assert = require('node:assert/strict');
const fs = require('node:fs');
const { isIP } = require('node:net');

function load(file, imports, name) {
  const source = fs.readFileSync(file, 'utf8').replace(/^import .*;\r?\n/gm, '').replace('export async function', 'async function');
  return new Function(...Object.keys(imports), `${source}\nreturn ${name};`)(...Object.values(imports));
}

(async () => {
  const missing = () => Promise.reject(Object.assign(new Error('No records'), { code: 'ENODATA' }));
  const resolver = (resolve4, resolve6) => load('cloudflare/remote-addresses.js', { resolve4, resolve6, isIP }, 'resolveRemoteAddresses');
  const both = resolver(async () => ['203.0.113.1'], async () => ['2001:db8::1']);
  assert.deepEqual(await both('example.com'), [{ address: '203.0.113.1', family: 4 }, { address: '2001:db8::1', family: 6 }]);
  assert.deepEqual(await both('127.0.0.1'), [{ address: '127.0.0.1', family: 4 }]);
  assert.deepEqual(await resolver(async () => ['203.0.113.1'], missing)('example.com'), [{ address: '203.0.113.1', family: 4 }]);
  await assert.rejects(resolver(missing, missing)('example.com'), /Nenhum endereço/);
  await assert.rejects(resolver(async () => ['203.0.113.1'], async () => { throw Object.assign(new Error('Timeout'), { code: 'ETIMEOUT' }); })('example.com'), /segurança/);
  const source = new Uint8Array([1, 2, 3]);
  for (const env of [{}, { IMAGES: { input() { throw new Error('Paid binding must never run'); } } }]) {
    const optimize = load('cloudflare/product-image-optimizer.js', { env }, 'optimizeProductImage');
    await assert.rejects(optimize(source), /Transformação paga desativada/);
  }
  console.log('Cloudflare: DNS seguro preservado; transformação paga desativada com ou sem binding.');
})().catch(error => { console.error(error); process.exitCode = 1; });
