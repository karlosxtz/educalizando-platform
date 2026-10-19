import { readableProductDescription } from './product-description';
import { presentationVideo } from './presentation-video';
export const SABER_EXPORT_URL='https://saberdidatico.com.br/api/public/sync/seller-products';
type Row=Record<string,unknown>;
export type SaberItem={id:string;owner:string;title:string;description:string;price:number;originalPrice:number|null;priceKnown:boolean;images:string[];categories:string[];levels:string[];tags:string[];video:string|null;pageCount:number|null;ageRange:string|null;formatDetails:string|null;colorMode:'colorido'|'preto_e_branco'|'colorido_e_preto_e_branco'|null;type:'pdf'|'ebook'|'curso';warnings:string[]};
const row=(value:unknown):Row=>value && typeof value==='object' && !Array.isArray(value)?value as Row:{};
function value(source:Row,...keys:string[]) {return keys.map(key=>source[key]).find(item=>item!==undefined && item!==null && item!=='');}
function text(input:unknown) {return typeof input==='string'?input.trim():typeof input==='number'?String(input):'';}
function labels(input:unknown):string[] {return (Array.isArray(input)?input:typeof input==='string'?input.split(/[,;]/):[]).map(item=>typeof item==='object'?text(value(row(item),'name','nome','label','title')):text(item)).filter(Boolean);}
function identity(source:Row) {return text(value(source,'seller_id','store_id','owner_id','user_id')) || text(value(row(value(source,'seller','store','owner')),'id','seller_id','store_id'));}
function money(input:unknown):number|null {
  if(typeof input==='number')return Number.isFinite(input)&&input>=0?Math.round(input*100)/100:null;
  let raw=text(input).replace(/^R\$\s*/,'').trim();
  if(/^\d{1,3}(\.\d{3})+,\d{2}$/.test(raw))raw=raw.replace(/\./g,'').replace(',','.');
  else if(/^\d+,\d{1,2}$/.test(raw))raw=raw.replace(',','.');
  if(!/^\d+(\.\d{1,2})?$/.test(raw))return null;
  const result=Number(raw);return Number.isFinite(result)&&result<=99999999?result:null;
}
function cents(input:unknown):number|null {
  const raw=typeof input==='number'?input:typeof input==='string' && /^\d+$/.test(input.trim())?Number(input):NaN;
  return Number.isSafeInteger(raw) && raw>=0 && raw<=9999999900?raw/100:null;
}
function exportPrice(source:Row,original=false):number|null {
  const keys=original?['regular_price','original_price','preco_original','compare_at_price','regularPrice','originalPrice']:['price','preco','sale_price','regular_price','salePrice','regularPrice','price_brl','valor'];
  for(const key of keys){const parsed=money(source[key]);if(parsed!==null)return parsed;}
  for(const key of original?['regular_price_cents','original_price_cents','originalPriceCents']:['price_cents','priceCents','price_in_cents','priceInCents','preco_centavos']){const parsed=cents(source[key]);if(parsed!==null)return parsed;}
  return null;
}
export function saberNextUrl(input:string) {
  const url=new URL(input,SABER_EXPORT_URL);
  if(url.origin!=='https://saberdidatico.com.br' || url.pathname!=='/api/public/sync/seller-products' || url.username || url.password || url.hash)throw new Error('A API retornou paginação fora do endereço autorizado.');
  for(const key of url.searchParams.keys())if(!['page','per_page','perPage','page_size','pageSize','limit','cursor','after','offset'].includes(key))throw new Error('A paginação retornou parâmetros não reconhecidos; a integração precisa ser validada.');
  return url.toString();
}
export function parseSaberExport(payload:unknown,currentUrl=SABER_EXPORT_URL) {
  const root=row(payload),data=row(root.data);
  const seller=row(value(root,'seller','store','owner') || value(data,'seller','store','owner'));
  const list=Array.isArray(payload)?payload:value(root,'products','items') || value(data,'products','items') || (Array.isArray(root.data)?root.data:null);
  if(!Array.isArray(list))throw new Error('A API não retornou uma lista de produtos reconhecida. Precisamos validar o formato da exportação.');
  const owner=text(value(seller,'id','seller_id','store_id','user_id')) || text(value(root,'seller_id','store_id','owner_id')) || text(value(data,'seller_id','store_id','owner_id')) || identity(row(list[0]));
  if(!owner || owner.length>200)throw new Error('A exportação precisa identificar a loja de origem para impedir mistura entre lojas.');
  const seen=new Set<string>();
  const products=list.map(raw=>{
    const source=row(raw),id=text(value(source,'id','product_id','uuid'));
    const itemOwner=identity(source) || owner;
    if(itemOwner!==owner)throw new Error('A API retornou produtos de lojas diferentes. A importação foi bloqueada.');
    if(!id || id.length>200 || seen.has(id))throw new Error('A exportação contém produto sem identificador ou identificadores repetidos.');seen.add(id);
    const title=text(value(source,'name','title','titulo'));if(!title || title.length>180)throw new Error('A API retornou um título ausente ou maior que o permitido.');
    const rawDescription=text(value(source,'description','descricao','content','short_description'));
    const description=readableProductDescription(rawDescription);if(description.length>100000)throw new Error('Uma descrição excede o limite de importação.');
    const price=source.is_free===true?0:exportPrice(source);
    const regular=exportPrice(source,true);
    const imagesRaw=value(source,'images','gallery','gallery_urls','image_urls');
    const embedded=[...rawDescription.matchAll(/<img\b[^>]*?\ssrc=['"](https:\/\/[^'"]+)['"]/gi)].map(match=>match[1].replace(/&amp;/g,'&'));
    const urls=[value(source,'cover_url','capa_url','image_url','thumbnail','featured_image'),...(Array.isArray(imagesRaw)?imagesRaw:[]),...embedded].map(item=>typeof item==='object'?value(row(item),'url','src','image_url'):item).map(text).filter(Boolean);
    const images=[...new Set(urls)].filter(item=>{try{const url=new URL(item);return url.protocol==='https:' && !url.username && !url.password;}catch{return false;}});
    const warnings:string[]=[];if(price===null)warnings.push('Preço não disponível: confirme o valor antes de publicar.');if(!images.length)warnings.push('Capa não disponível na exportação.');if(images.length>100)throw new Error('Um produto contém mais de 100 imagens. A importação precisa ser revisada.');
    if(labels(value(source,'categories','categorias')).length>5)warnings.push('A origem possui mais de cinco categorias; confira a classificação no cadastro.');
    if(labels(value(source,'tags','keywords')).length>30)warnings.push('A origem possui mais de trinta tags; confira as tags no cadastro.');
    const video=presentationVideo(value(source,'presentation_video_url','video_url','youtube_url','instagram_video_url'));
    const count=Number(value(source,'page_count','pages','numero_paginas'));
    const rawColor=text(value(source,'color_mode','cor'));const colorMode=(rawColor==='misto'?'colorido_e_preto_e_branco':['colorido','preto_e_branco','colorido_e_preto_e_branco'].includes(rawColor)?rawColor:null) as SaberItem['colorMode'];
    const rawType=text(value(source,'tipo','type','format')).toLowerCase();
    return {id,owner,title,description,price:price || 0,originalPrice:regular!==null && price!==null && regular>price?regular:null,priceKnown:price!==null,images,categories:labels(value(source,'categories','categorias')),levels:labels(value(source,'education_levels','school_levels','series','levels','anos_escolares')),tags:labels(value(source,'tags','keywords')),video:video?.url || null,pageCount:Number.isInteger(count)&&count>0?count:null,ageRange:text(value(source,'age_range','faixa_etaria')) || null,formatDetails:text(value(source,'format_details','formato_detalhes')) || null,colorMode,type:(['ebook','curso'].includes(rawType)?rawType:'pdf') as SaberItem['type'],warnings};
  });
  const sources=[row(root.pagination),row(root.meta),row(data.pagination),row(data.meta),root,data];
  const field=(...keys:string[])=>sources.map(source=>value(source,...keys)).find(item=>item!==undefined);
  const totalRaw=field('total','total_products','totalProducts','total_items','totalItems');
  const total=totalRaw!==undefined && Number.isSafeInteger(Number(totalRaw)) && Number(totalRaw)>=0?Number(totalRaw):null;
  const links=row(value(root,'links') || value(data,'links'));
  const next=field('next','next_page_url','next_url','nextPageUrl','nextUrl','next_page','nextPage') ?? links.next;
  const nextLink=typeof next==='object'?value(row(next),'href','url'):next;
  const cursor=field('next_cursor','nextCursor');
  const url=new URL(saberNextUrl(currentUrl));
  const integer=(input:unknown)=>input!==undefined && /^\d+$/.test(String(input)) && Number.isSafeInteger(Number(input))?Number(input):null;
  const page=integer(field('current_page','currentPage','page')) ?? integer(url.searchParams.get('page')) ?? 1;
  const sizeKeys=['per_page','perPage','page_size','pageSize','limit'];
  const sizeKey=sizeKeys.find(key=>field(key)!==undefined || url.searchParams.has(key)) || 'limit';
  const size=integer(field(...sizeKeys)) ?? integer(url.searchParams.get(sizeKey)) ?? products.length;
  const offset=integer(field('offset')) ?? integer(url.searchParams.get('offset'));
  const last=integer(field('last_page','lastPage','total_pages','totalPages','page_count','pageCount'));
  const hasMore=field('has_more','hasMore','has_next_page','hasNextPage');
  let nextUrl=typeof nextLink==='string' && nextLink && integer(nextLink)===null?saberNextUrl(nextLink):null;
  if(!nextUrl && (typeof cursor==='string'||typeof cursor==='number') && text(cursor)){url.searchParams.set('cursor',text(cursor));nextUrl=saberNextUrl(url.toString());}
  const nextPage=integer(nextLink);
  if(!nextUrl && nextPage!==null && nextPage>page){url.searchParams.set('page',String(nextPage));if(size>0)url.searchParams.set(sizeKey,String(size));nextUrl=saberNextUrl(url.toString());}
  // Some exports return only five products by default plus total, without a next URL.
  // Use numbered pages; the job still rejects ignored pagination, repeats and total mismatches.
  const more=last!==null?last>page:total!==null && size>0?(offset!==null?offset+products.length:page*size)<total:hasMore===true;
  if(!nextUrl && hasMore!==false && products.length && page>0 && more){
    if(url.searchParams.has('cursor') || url.searchParams.has('after'))throw new Error('A API informou mais produtos, mas não forneceu a continuação do cursor.');
    if(offset!==null)url.searchParams.set('offset',String(offset+products.length));
    else url.searchParams.set('page',String(page+1));
    if(size>0)url.searchParams.set(sizeKey,String(size));
    nextUrl=saberNextUrl(url.toString());
  }
  if(hasMore===true && !nextUrl)throw new Error('A API informou mais produtos, mas não forneceu uma continuação reconhecida.');
  return {owner,label:text(value(seller,'name','nome','store_name','nome_loja','username')) || 'Loja autorizada pelo token',products,nextUrl,total};
}
