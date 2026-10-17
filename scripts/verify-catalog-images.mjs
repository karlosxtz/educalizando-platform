import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
await build({entryPoints:['cloudflare/catalog-image-cache.js','src/lib/catalog-image-url.ts'],bundle:true,platform:'node',format:'esm',outdir:'.cloudflare/cost-image-tests',outbase:'.'});
const {catalogImageResponse}=await import(pathToFileURL(path.resolve('.cloudflare/cost-image-tests/cloudflare/catalog-image-cache.js')));
const {catalogImageUrl}=await import(pathToFileURL(path.resolve('.cloudflare/cost-image-tests/src/lib/catalog-image-url.js')));
const direct='https://arquivos.educalizando.com.br/public-images/uploads/test.webp';
for(const value of [direct,'http://localhost:3000/api/storage/public-image?bucket=public-images&key=uploads/test.webp','/media/catalogo/uploads/test.webp'])assert.equal(catalogImageUrl(value),direct);
for(const value of ['minio://private-materials/uploads/test.pdf','https://arquivos.educalizando.com.br/private-plr/uploads/test.webp','https://external.test/image.png'])assert.equal(catalogImageUrl(value),value);
let reads=0;const send=()=>{reads++;throw new Error('Image bytes must not cross Worker');};
for(const init of [{},{method:'HEAD'},{headers:{Cookie:'secret',Authorization:'Bearer secret'}}]){
 const r=await catalogImageResponse(new Request('https://www.educalizando.com.br/media/catalogo/uploads/test.webp',init),null,null,send);
 assert.equal(r.status,301);assert.equal(r.headers.get('Location'),direct);assert.equal(await r.text(),'');assert.equal(r.headers.get('Set-Cookie'),null);
}
assert.equal(reads,0);
for(const path of ['private-materials/file.pdf','uploads/%2e%2e/secret.webp','uploads/test.webp?secret=1'])assert.equal((await catalogImageResponse(new Request('https://www.educalizando.com.br/media/catalogo/'+path))).status,404);
assert.equal((await catalogImageResponse(new Request('https://www.educalizando.com.br/media/catalogo/uploads/test.webp',{method:'POST'}))).status,405);
console.log('PASS: capas diretas no MinIO; URLs legadas só redirecionam, sem leitura, cópia de bytes, credenciais ou transformação.');

const svg=await catalogImageResponse(new Request('https://www.educalizando.com.br/media/catalogo/uploads/imported.svg'));
assert.equal(svg.status,301);assert.equal(await svg.text(),'');assert.equal(new URL(svg.headers.get('Location')).hostname,'arquivos.educalizando.com.br');
