import { writeFileSync } from 'node:fs';
const origin='https://www.educalizando.com.br';
const decode=value=>String(value||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#x27;|&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const attr=(html,tag,key,value,target)=> {
  for(const match of html.matchAll(new RegExp('<'+tag+'\\b[^>]*>','gi'))) {
    const attrs=Object.fromEntries([...match[0].matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(m=>[m[1].toLowerCase(),decode(m[2])]));
    if(attrs[key]===value)return attrs[target]||'';
  }
  return '';
};
async function get(url) { const response=await fetch(url,{signal:AbortSignal.timeout(45000)});return {response,text:await response.text()}; }
const root=await get(origin+'/sitemap.xml');
if(root.response.status!==200)throw new Error('Sitemap index indisponível');
const urls=new Set();
const locations=text=>[...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>decode(match[1]));
if (/<sitemapindex\b/.test(root.text)) {
  for(const sitemap of locations(root.text)) {
    if(new URL(sitemap).origin!==origin)throw new Error('Sitemap externo inesperado');
    const data=await get(sitemap);if(!data.response.ok)throw new Error('Sitemap '+data.response.status+': '+sitemap);
    for(const url of locations(data.text))if(new URL(url).origin===origin)urls.add(url);
  }
} else if (/<urlset\b/.test(root.text)) {
  for(const url of locations(root.text))if(new URL(url).origin===origin)urls.add(url);
} else throw new Error('Formato do sitemap não reconhecido');
for(const path of ['/','/buscar','/atividades-alfabetizacao','/educacao-infantil','/jogos-pedagogicos','/recursos-pedagogicos','/materiais-didaticos','/planos-de-aula-bncc','/calendario','/blog','/buscar?q=leitura','/buscar?categoria=alfabetizacao&page=2','/login','/seguranca','/carrinho','/offline'])urls.add(origin+path);
const results=[],queue=[...urls];let cursor=0;
const flatten=schema=>Array.isArray(schema)?schema.flatMap(flatten):schema?.['@graph']?schema['@graph'].flatMap(flatten):[schema];
async function worker(){
  while(cursor<queue.length){
    const url=queue[cursor++],errors=[],warnings=[];
    try {
      const {response,text}=await get(url);
      const title=decode(text.match(/<title>([\s\S]*?)<\/title>/i)?.[1]);
      const description=attr(text,'meta','name','description','content');
      const canonical=attr(text,'link','rel','canonical','href');
      const robots=[attr(text,'meta','name','robots','content'),response.headers.get('x-robots-tag')||''].join(', ');
      const h1=(text.match(/<h1\b/gi)||[]).length;
      const privatePage=/\/(login|seguranca|carrinho|offline)(\/|$)/.test(new URL(url).pathname);
      if(response.status!==200)errors.push('HTTP '+response.status);
      if(!title)errors.push('Título ausente');
      if(!privatePage && !description)errors.push('Descrição ausente');
      if(!privatePage && !canonical)errors.push('Canonical ausente');
      if(privatePage && !robots.includes('noindex'))errors.push('Página de acesso sem noindex');
      if(!privatePage && h1!==1)warnings.push('Quantidade de H1: '+h1);
      if(!privatePage && title.length>75)warnings.push('Título longo: '+title.length);
      const schemas=[...text.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].flatMap(m=>flatten(JSON.parse(m[1])));
      const product=schemas.find(s=>s?.['@type']==='Product');
      if(new URL(url).pathname.startsWith('/produto/')){
        if(!product?.name || !product.description || !product.url)errors.push('Produto estruturado incompleto');
        if(product?.offers && (product.offers.priceCurrency!=='BRL'||!Number.isFinite(Number(product.offers.price))||!product.offers.seller?.name))errors.push('Oferta inválida');
        if(!product?.image?.length)warnings.push('Produto sem capa cadastrada');
      }
      if(new URL(url).pathname.startsWith('/clube/') && !schemas.some(s=>s?.['@type']==='CollectionPage'))errors.push('Clube sem dados estruturados');
      results.push({url,status:response.status,title,description,canonical,robots,h1,schemas:schemas.map(s=>s?.['@type']),bytes:Buffer.byteLength(text),errors,warnings});
    }catch(error){results.push({url,errors:[error.message],warnings:[]});}
    if(results.length%40===0)console.log(results.length+'/'+queue.length+' páginas');
  }
}
await Promise.all([worker(),worker()]);
const robots=await get(origin+'/robots.txt');
const redirects=[];
for(const url of ['http://educalizando.com.br/','https://educalizando.com.br/','http://www.educalizando.com.br/']){
  const r=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(20000)});
  redirects.push({url,status:r.status,location:r.headers.get('location')});
}
const report={checkedAt:new Date().toISOString(),checked:results.length,failures:results.filter(r=>r.errors.length),warnings:results.filter(r=>r.warnings.length),redirects,robots:robots.text,results};
writeFileSync(process.env.SEO_AUDIT_OUTPUT || 'seo-audit-general-report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({checked:report.checked,failures:report.failures.map(r=>({url:r.url,errors:r.errors})),warnings:report.warnings.length,redirects},null,2));
// No ranking score or Rich Results certification is inferred from this audit.
