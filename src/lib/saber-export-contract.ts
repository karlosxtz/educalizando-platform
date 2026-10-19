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
export function saberNextUrl(input:string) {
  const url=new URL(input,SABER_EXPORT_URL);
  if(url.origin!=='https://saberdidatico.com.br' || url.pathname!=='/api/public/sync/seller-products' || url.username || url.password || url.hash)throw new Error('A API retornou paginação fora do endereço autorizado.');
  for(const key of url.searchParams.keys())if(!['page','per_page','limit','cursor','after','offset'].includes(key))throw new Error('A paginação retornou parâmetros não reconhecidos; a integração precisa ser validada.');
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
    const price=source.is_free===true?0:money(value(source,'price','preco','sale_price','regular_price'));
    const regular=money(value(source,'regular_price','original_price','preco_original','compare_at_price'));
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
  const meta=row(value(root,'pagination','meta') || value(data,'pagination','meta')),links=row(value(root,'links') || value(data,'links'));
  const next=value(root,'next','next_page_url','next_url') || value(meta,'next','next_page_url','next_url') || links.next;
  const cursor=value(root,'next_cursor') || meta.next_cursor;
  let nextUrl=typeof next==='string' && next?saberNextUrl(next):null;
  if(!nextUrl && (typeof cursor==='string'||typeof cursor==='number') && text(cursor)){const url=new URL(currentUrl);url.searchParams.set('cursor',text(cursor));nextUrl=saberNextUrl(url.toString());}
  const page=Number(value(meta,'current_page','page')),last=Number(value(meta,'last_page','total_pages'));
  if(!nextUrl && page>0 && last>page){const url=new URL(currentUrl);url.searchParams.set('page',String(page+1));nextUrl=saberNextUrl(url.toString());}
  if((root.has_more===true || meta.has_more===true) && !nextUrl)throw new Error('A API informou mais produtos, mas não forneceu uma continuação reconhecida.');
  const totalRaw=value(root,'total','total_products') ?? value(meta,'total','total_products');
  const total=totalRaw!==undefined && Number.isSafeInteger(Number(totalRaw)) && Number(totalRaw)>=0?Number(totalRaw):null;
  return {owner,label:text(value(seller,'name','nome','store_name','nome_loja','username')) || 'Loja autorizada pelo token',products,nextUrl,total};
}
