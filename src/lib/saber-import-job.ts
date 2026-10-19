import 'server-only';
import { supabaseAdmin as db } from './supabase';
import { readSaberExport, saberImportId } from './saber-export-client';
import { SABER_EXPORT_URL, type SaberItem } from './saber-export-contract';
import { mirrorPlatformImportImage } from './woocommerce-media';
import { saberImportStorageMessage } from './saber-import-errors';

export const saberJobColumns='id,source_label,status,source_total,discovered,imported,skipped,cursor,asset_cursor,issues,last_error,created_at,updated_at';
export type SaberJob={id:string;store_id:string;source_owner:string;source_label:string;token_fingerprint:string;status:string;queue:SaberItem[];cursor:number;next_url:string|null;visited_urls:string[];seen_ids:string[];source_total:number|null;discovered:number;imported:number;skipped:number;current_product:string|null;asset_cursor:number;issues:{product:string;message:string}[];lease_token:string;lease_until:string|null};
const check=(result:{error:unknown})=>{if(result.error)throw new Error('Não foi possível gravar esta etapa. Retome para tentar novamente.');};
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export async function createSaberJob(storeId:string,token:string,fingerprint:string,expectedOwner:string) {
  const page=await readSaberExport(token);
  if(page.owner!==expectedOwner)throw new Error('A loja não corresponde à prévia aprovada. Teste a chave novamente.');
  const {data,error}=await db.from('platform_product_imports').insert({store_id:storeId,token_fingerprint:fingerprint,source_owner:page.owner,source_label:page.label,queue:page.products,next_url:page.nextUrl,visited_urls:[SABER_EXPORT_URL],seen_ids:page.products.map(item=>item.id),source_total:page.total,discovered:page.products.length,status:'running'}).select(saberJobColumns).single();
  if(error?.code==='23505')throw new Error('Já existe uma importação em andamento ou pausada. Retome ou cancele antes de iniciar outra.');
  if(error)throw new Error(saberImportStorageMessage(error));
  return data;
}
export async function processSaberJob(job:SaberJob,token:string) {
  const now=new Date().toISOString(),lease=crypto.randomUUID();
  const {data:claimed,error:claimError}=await db.from('platform_product_imports').update({lease_token:lease,lease_until:new Date(Date.now()+120000).toISOString()}).eq('id',job.id).eq('store_id',job.store_id).eq('status','running').or(`lease_until.is.null,lease_until.lt.${now}`).select('id').maybeSingle();
  if(claimError)throw new Error('Não foi possível reservar esta etapa.');
  if(!claimed)return {busy:true};
  const receipt=async(values:Record<string,unknown>)=>check(await db.from('platform_product_imports').update({...values,lease_token:null,lease_until:null,updated_at:new Date().toISOString()}).eq('id',job.id).eq('store_id',job.store_id).eq('lease_token',lease));
  // Re-read under the lease: a concurrent browser may have completed the prior step.
  const {data:fresh,error:readError}=await db.from('platform_product_imports').select('*').eq('id',job.id).eq('store_id',job.store_id).eq('lease_token',lease).single();
  if(readError)throw new Error('Não foi possível consultar a etapa reservada. Aguarde para retomar.');
  job=fresh as SaberJob;
  try {
    if(job.cursor>=job.queue.length){
      if(!job.next_url){
        if(job.source_total!==null && job.discovered!==job.source_total){
          // Recover jobs persisted before the pagination adapter recognised this export.
          // Re-read the last confirmed page; never reset counters or overwrite its products.
          const lastUrl=job.visited_urls.at(-1) || SABER_EXPORT_URL;
          const recovered=await readSaberExport(token,lastUrl);
          if(recovered.owner!==job.source_owner)throw new Error('A loja de origem mudou durante a exportação. A importação foi bloqueada.');
          if(recovered.total!==null && recovered.total!==job.source_total)throw new Error('O catálogo mudou durante a exportação. Confira e reinicie quando estiver estável.');
          const samePage=recovered.products.length===job.queue.length && recovered.products.every((item,index)=>item.id===job.queue[index].id);
          if(samePage && recovered.nextUrl && !job.visited_urls.includes(recovered.nextUrl)){
            await receipt({next_url:recovered.nextUrl,last_error:null});return {progressed:true};
          }
          throw new Error('O total informado pela API não corresponde aos produtos recebidos. A exportação não forneceu uma próxima página válida; nenhum produto concluído foi perdido.');
        }
        await receipt({status:'completed',queue:[],current_product:null});return {completed:true};
      }
      if(job.visited_urls.includes(job.next_url))throw new Error('A API repetiu uma página. A importação foi pausada para evitar repetição.');
      const page=await readSaberExport(token,job.next_url);
      if(page.owner!==job.source_owner)throw new Error('A loja de origem mudou durante a exportação. A importação foi bloqueada.');
      const seen=new Set(job.seen_ids || []);
      if(page.products.some(item=>seen.has(item.id)))throw new Error('A API repetiu produtos entre páginas. A importação foi pausada para conferir a exportação.');
      if(!page.products.length && page.nextUrl)throw new Error('A API retornou uma página vazia com continuação. Confira a exportação.');
      if(job.source_total!==null && page.total!==null && page.total!==job.source_total)throw new Error('O catálogo mudou durante a exportação. Confira e reinicie quando estiver estável.');
      await receipt({queue:page.products,cursor:0,next_url:page.nextUrl,visited_urls:[...job.visited_urls,job.next_url],seen_ids:[...(job.seen_ids || []),...page.products.map(item=>item.id)],source_total:job.source_total ?? page.total,discovered:job.discovered+page.products.length,current_product:null,asset_cursor:0});return {progressed:true};
    }
    const item=job.queue[job.cursor];
    if(item.owner!==job.source_owner)throw new Error('Produto fora da loja autorizada.');
    const productId=saberImportId(job.store_id,job.source_owner,item.id);
    const {data:mapped,error:mapError}=await db.from('platform_product_import_receipts').select('product_id').eq('store_id',job.store_id).eq('provider','saberdidatico').eq('source_owner',job.source_owner).eq('source_id',item.id).maybeSingle();check({error:mapError});
    if(mapped){await receipt({cursor:job.cursor+1,skipped:job.skipped+1,current_product:null,asset_cursor:0});return {progressed:true};}
    const {data:product,error:productError}=await db.from('products').select('id,store_id,status,import_incomplete').eq('id',productId).maybeSingle();check({error:productError});
    if(product && (product.store_id!==job.store_id || product.status!=='rascunho' || !product.import_incomplete))throw new Error('O produto já foi revisado ou alterado. Não será sobrescrito pela importação.');
    if(!product){
      const [categoryResult,levelResult]=await Promise.all([db.from('categories').select('id,nome,slug,store_id').or('store_id.is.null,store_id.eq.'+job.store_id),db.from('education_levels').select('id,nome,slug')]);check(categoryResult);check(levelResult);
      const categoryIds:string[]=[];
      for(const name of item.categories.slice(0,5)){
        let category=categoryResult.data?.find(row=>normalize(row.nome)===normalize(name) || normalize(row.slug)===normalize(name));
        if(!category){const result=await db.from('categories').insert({nome:name.slice(0,100),slug:normalize(name).slice(0,100) || 'categoria',store_id:job.store_id}).select('id,nome,slug,store_id').single();check(result);category=result.data!;}
        categoryIds.push(category.id);
      }
      const levelIds=(levelResult.data || []).filter(level=>item.levels.some(name=>normalize(name)===normalize(level.nome)||normalize(name)===normalize(level.slug))).map(level=>level.id).slice(0,5);
      const tags=[...new Set([...item.tags,...item.categories,...item.levels])].slice(0,30);
      check(await db.from('products').insert({id:productId,store_id:job.store_id,titulo:item.title,slug:(normalize(item.title).slice(0,80)||'material')+'-'+productId,descricao:item.description || null,tipo:item.type,preco:item.price,preco_original:item.originalPrice,is_free:item.priceKnown && item.price===0,capa_url:null,status:'rascunho',import_incomplete:true,import_price_confirmed:item.priceKnown,category_id:categoryIds[0]||null,category_ids:categoryIds,education_level_id:levelIds[0]||null,education_level_ids:levelIds,tags,presentation_video_url:item.video,video_as_cover:false,page_count:item.pageCount,age_range:item.ageRange,format_details:item.formatDetails,color_mode:item.colorMode,created_at:now,updated_at:now}));
      await receipt({current_product:productId,asset_cursor:0});return {progressed:true};
    }
    if(!job.current_product){await receipt({current_product:productId});return {progressed:true};}
    if(job.asset_cursor<item.images.length){
      const index=job.asset_cursor;
      const image=await mirrorPlatformImportImage(item.images[index],job.store_id,productId,index);
      const applied=await db.rpc('apply_platform_import_image',{p_job:job.id,p_store:job.store_id,p_lease:lease,p_product:productId,p_image_id:saberImportId(job.store_id,job.source_owner,item.id+':image:'+index),p_url:image,p_index:index});check(applied);
      if(!applied.data)throw new Error('O produto foi revisado ou a etapa expirou. A imagem não foi alterada.');
      await receipt({asset_cursor:index+1});return {progressed:true};
    }
    check(await db.from('platform_product_import_receipts').insert({store_id:job.store_id,provider:'saberdidatico',source_owner:job.source_owner,source_id:item.id,product_id:productId}));
    const issues=[...job.issues,...item.warnings.map(message=>({product:item.title,message}))].slice(-100);
    await receipt({cursor:job.cursor+1,imported:job.imported+1,current_product:null,asset_cursor:0,issues,last_error:null});return {progressed:true};
  }catch(error){
    // Never persist provider bodies, credentials, signed URLs or raw DB messages.
    const known=error instanceof Error?error.message:'';
    const message=/^(A API|A Saber|A exportação|A loja|A página|A mídia|O catálogo|O produto|O total|Produto fora|Endereço de mídia|Não foi possível|Formato de imagem)/.test(known)?known.replace(/https?:\/\/\S+/g,'[endereço]').replace(/sbr_live_\w+/gi,'[chave]').slice(0,240):'Não foi possível concluir esta etapa. Retome para tentar novamente.';
    await receipt({status:'paused',last_error:message});return {paused:true};
  }
}
