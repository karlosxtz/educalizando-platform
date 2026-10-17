import { loadEnv } from 'vite';
import { catalogImageUrl } from '../.cloudflare/catalog-url-test.mjs';
const env = loadEnv('production', process.cwd(), 'NEXT_PUBLIC_');
const headers = { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, Authorization: 'Bearer '+env.NEXT_PUBLIC_SUPABASE_ANON_KEY };
const storeResponse = await fetch(env.NEXT_PUBLIC_SUPABASE_URL+'/rest/v1/stores?select=id,slug,logo_url&nome_loja=eq.Bus cando Saber'.replace('Bus cando','Buscando'), { headers });
const stores = await storeResponse.json();
console.log('store lookup',storeResponse.status, Array.isArray(stores)?stores.length:0);
if (Array.isArray(stores) && stores[0]) {
 const response=await fetch(env.NEXT_PUBLIC_SUPABASE_URL+'/rest/v1/products?select=capa_url&store_id=eq.'+stores[0].id+'&order=created_at.desc&limit=3',{headers});
 const products=await response.json();
 for(const image of [stores[0].logo_url,...(Array.isArray(products)?products.map(p=>p.capa_url):[])].filter(Boolean)) {
  const url=new URL(image,'https://www.educalizando.com.br'); const result=await fetch(url);
  console.log('store image',url.protocol,url.host,url.pathname,url.search,result.status,result.headers.get('content-type'),result.headers.get('cross-origin-resource-policy'),result.url);
  if(result.status!==200) console.log((await result.text()).slice(0,160));else await result.body?.cancel();
  const platform = new URL(catalogImageUrl(image), 'https://www.educalizando.com.br');
  const cached = await fetch(platform);
  const bytes = new Uint8Array(await cached.arrayBuffer());
  console.log('platform image',cached.status,cached.headers.get('content-type'),bytes.length,String.fromCharCode(...bytes.slice(0,4)));
 }
}
const home = await fetch('https://www.educalizando.com.br');
const html = await home.text();
console.log('homepage', home.status);
const paths = [...new Set(html.match(/\/media\/catalogo\/[^"<> ]+/g) || [])].slice(0, 3);
for (const path of paths) {
  for (const url of ['https://www.educalizando.com.br'+path, 'https://arquivos.educalizando.com.br/public-images/'+path.slice('/media/catalogo/'.length)]) {
    const result = await fetch(url);
    console.log(new URL(url).host, path, result.status, result.headers.get('content-type'),result.headers.get('cross-origin-resource-policy'),result.url);
    if (result.status !== 200) console.log((await result.text()).slice(0, 180));
    else await result.body?.cancel();
  }
}
