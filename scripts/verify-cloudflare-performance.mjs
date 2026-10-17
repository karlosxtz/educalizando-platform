import assert from 'node:assert/strict';
import { build } from 'esbuild';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { applyResponseCachePolicy } from '../cloudflare/response-cache-policy.js';
for (const pathname of ['/login','/entrar','/seguranca','/redefinir-senha','/dashboard','/cliente/materiais','/aluno/conta','/api/wallet/summary','/api/storage/public-image','/loja/store/checkout']) {
 const r=applyResponseCachePolicy(new Request('https://example.test'+pathname),new Response('data',{headers:{'Cache-Control':'public, max-age=31536000'}}));
 for(const h of ['Cache-Control','CDN-Cache-Control','Cloudflare-CDN-Cache-Control'])assert.match(r.headers.get(h),/private, no-store/);
}
for(const headers of [{Cookie:'session=test'},{Authorization:'Bearer test'},{RSC:'1'},{Accept:'text/x-component'}]){
 const r=applyResponseCachePolicy(new Request('https://example.test/',{headers}),new Response('data'));assert.match(r.headers.get('Cache-Control'),/no-store/);
}
const output='.cloudflare/cost-performance-unit.mjs';
await build({stdin:{contents:`export { homepageProduct, homepageKit } from './src/lib/homepage-presentation'; export { GET } from './src/app/api/storage/public-image/route';`,resolveDir:process.cwd(),loader:'ts'},platform:'node',format:'esm',bundle:true,outfile:output,plugins:[{name:'aliases',setup(b){b.onResolve({filter:/^@\//},a=>({path:path.resolve('src',a.path.slice(2)+'.ts')}));}}]});
const {GET,homepageProduct,homepageKit}=await import(pathToFileURL(path.resolve(output)));
const product={id:'real',titulo:'Material real',preco:12.5,preco_plr:30,arquivo_url:'PRIVATE',plr_license_url:'PRIVATE',store_id:'store',slug:'real',status:'publicado'};
assert.equal(homepageProduct(product).preco,12.5);assert(!JSON.stringify(homepageProduct(product)).includes('PRIVATE'));
assert.equal(homepageKit({id:'kit',titulo:'Combo',preco_kit:10}).preco_kit,10);
const r=await GET(new Request('https://www.educalizando.com.br/api/storage/public-image?bucket=public-images&key=uploads/test.webp'));
assert.equal(r.status,302);assert.equal(r.headers.get('Location'),'https://arquivos.educalizando.com.br/public-images/uploads/test.webp');assert.equal(await r.text(),'');assert.match(r.headers.get('Cache-Control'),/no-store/);
assert.equal((await GET(new Request('https://www.educalizando.com.br/api/storage/public-image?bucket=private-materials&key=uploads/test.pdf'))).status,404);
console.log('PASS: preços e payload público preservados, APIs/sessões privadas, imagens apenas com redirecionamento sem bytes.');
