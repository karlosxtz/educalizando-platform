import fs from 'node:fs/promises';
const base='https://www.educalizando.com.br';
const before=JSON.parse(await fs.readFile('seo-audit-general-report.json','utf8'));
const paths=['/','/materiais-didaticos','/categorias/alfabetizacao','/loja/educarose','/login',...before.failures.filter(x=>x.url.includes('/produto/')&&!x.url.includes('combo-20-apostilas')).slice(0,15).map(x=>new URL(x.url).pathname)];
const results=[];
for(const path of [...new Set(paths)]){
try{const r=await fetch(base+path,{signal:AbortSignal.timeout(45000)}),h=await r.text();const robot=[...h.matchAll(/<meta[^>]*name="(?:robots|googlebot)"[^>]*>/gi)].map(x=>x[0]);const schemas=[...h.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(x=>JSON.parse(x[1]));const item={path,status:r.status,bytes:h.length,title:h.match(/<title>(.*?)<\/title>/s)?.[1]||'',canonical:h.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1]||'',h1:(h.match(/<h1\b/g)||[]).length,robots:robot,product:schemas.some(x=>x['@type']==='Product'),cache:r.headers.get('x-educalizando-page-cache'),resourceLimit:h.includes('Worker exceeded resource limits')};results.push(item);console.log(JSON.stringify({path,status:item.status,h1:item.h1,product:item.product,bytes:item.bytes,resourceLimit:item.resourceLimit}));}
catch(error){results.push({path,error:error.message});}
}
await fs.writeFile('.cloudflare/seo-after-sample.json',JSON.stringify(results,null,2));console.log(JSON.stringify({checked:results.length,unavailable:results.filter(x=>x.status!==200).length,incompleteProducts:results.filter(x=>x.path.includes('/produto/')&&!x.product).length}));
