import 'server-only';
import { supabaseAdmin as db } from './supabase';
import { readSaberExport, saberImportId } from './saber-export-client';
import { SABER_EXPORT_URL, type SaberItem } from './saber-export-contract';
import { mirrorPlatformImportImage } from './woocommerce-media';
import { saberImportStorageMessage } from './saber-import-errors';
import { mirrorPlatformDelivery } from './platform-delivery-media';
import { importedDeliveryPresent } from './platform-delivery-resume';

export const saberJobColumns='id,source_label,status,source_total,discovered,imported,skipped,cursor,asset_cursor,issues,last_error,created_at,updated_at';
export type SaberJob={id:string;store_id:string;source_owner:string;source_label:string;token_fingerprint:string;status:string;queue:SaberItem[];cursor:number;next_url:string|null;visited_urls:string[];seen_ids:string[];source_total:number|null;discovered:number;imported:number;skipped:number;current_product:string|null;asset_cursor:number;issues:{product:string;message:string}[];lease_token:string;lease_until:string|null};
const check=(result:{error:unknown})=>{if(result.error)throw new Error('Não foi possível gravar esta etapa. Retome para tentar novamente.');};
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export async function platformDeliveryImportReady() {
  const nil='00000000-0000-0000-0000-000000000000';
  const result=await db.rpc('apply_platform_import_delivery',{p_job:nil,p_store:nil,p_lease:nil,p_product:nil,p_file_id:nil,p_index:0,p_asset:null,p_probe:true});
  return !result.error && result.data===true;
}
async function fillMissingImportedPrice(job:SaberJob,item:SaberItem,mappedId?:string) {
  if(!item.priceKnown)return false;
  const productId=saberImportId(job.store_id,job.source_owner,item.id);
  if(!mappedId){
    const result=await db.from('platform_product_import_receipts').select('product_id').eq('store_id',job.store_id).eq('provider','saberdidatico').eq('source_owner',job.source_owner).eq('source_id',item.id).maybeSingle();check(result);
    mappedId=result.data?.product_id;
  }
  if(mappedId!==productId)return false;
  // Only the zero placeholder of an unreviewed imported draft may be filled.
  // Prices entered by the creator, reviewed drafts and published products are preserved.
  const result=await db.from('products').update({preco:item.price,preco_original:item.originalPrice,is_free:item.price===0,import_price_confirmed:true,updated_at:new Date().toISOString()}).eq('id',productId).eq('store_id',job.store_id).eq('status','rascunho').eq('import_incomplete',true).eq('import_price_confirmed',false).eq('preco',0).eq('is_free',false).is('preco_original',null).select('id').maybeSingle();check(result);
  return !!result.data;
}
export async function createSaberJob(storeId:string,token:string,fingerprint:string,expectedOwner:string) {
  const page=await readSaberExport(token);
  if(page.owner!==expectedOwner)throw new Error('A loja não corresponde à prévia aprovada. Teste a chave novamente.');
  if(page.products.some(item=>item.deliveries?.length) && !await platformDeliveryImportReady())throw new Error('Ative a atualização de importação de arquivos antes de iniciar.');
  const {data,error}=await db.from('platform_product_imports').insert({store_id:storeId,token_fingerprint:fingerprint,source_owner:page.owner,source_label:page.label,queue:page.products,next_url:page.nextUrl,visited_urls:[SABER_EXPORT_URL],seen_ids:page.products.map(item=>item.id),source_total:page.total,discovered:page.products.length,status:'running'}).select(saberJobColumns).single();
  if(error?.code==='23505')throw new Error('Já existe uma importação em andamento ou pausada. Retome ou cancele antes de iniciar outra.');
  if(error)throw new Error(saberImportStorageMessage(error));
  return data;
}
export async function restartSaberDeliveries(job:SaberJob,token:string) {
  if(job.status!=='paused')throw new Error('A importação precisa estar pausada para revisar os arquivos desde o início.');
  if(!await platformDeliveryImportReady())throw new Error('Ative a atualização de importação de arquivos antes de continuar.');
  const page=await readSaberExport(token);
  if(page.owner!==job.source_owner)throw new Error('A loja de origem não corresponde à importação.');
  const result=await db.from('platform_product_imports').update({queue:page.products,next_url:page.nextUrl,visited_urls:[SABER_EXPORT_URL],seen_ids:page.products.map(item=>item.id),source_total:page.total,discovered:page.products.length,cursor:0,asset_cursor:0,current_product:null,imported:0,skipped:0,status:'running',last_error:null,lease_token:null,lease_until:null,updated_at:new Date().toISOString()}).eq('id',job.id).eq('store_id',job.store_id).eq('status','paused').or(`lease_until.is.null,lease_until.lt.${new Date().toISOString()}`).select('id').maybeSingle();check(result);
  if(!result.data)throw new Error('A importação ainda tem uma etapa reservada. Aguarde para tentar novamente.');
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
  const currentPassUrls=job.visited_urls.slice(Math.max(0,job.visited_urls.lastIndexOf(SABER_EXPORT_URL)));
  const reconcileCatalogue=async(reportedTotal:number|null=job.source_total)=>{
    // At most one automatic fresh pass per explicit run. Repeated root URLs
    // delimit passes while keeping the complete history made of real URLs.
    if(job.visited_urls.filter(url=>url===SABER_EXPORT_URL).length>=2){
      throw new Error('O catálogo da origem ainda está mudando ou o total informado não pôde ser conferido. O progresso foi preservado; aguarde e tente continuar.');
    }
    const first=await readSaberExport(token);
    if(first.owner!==job.source_owner)throw new Error('A loja de origem mudou durante a exportação. A importação foi bloqueada.');
    await receipt({queue:first.products,next_url:first.nextUrl,visited_urls:[...job.visited_urls,SABER_EXPORT_URL],seen_ids:first.products.map(item=>item.id),source_total:first.total ?? reportedTotal,discovered:first.products.length,cursor:0,asset_cursor:0,current_product:null,imported:0,skipped:0,last_error:null,issues:[...job.issues,{product:'Exportação do catálogo',message:'O catálogo da origem foi atualizado. Uma nova conferência começou automaticamente; os contadores representam esta passagem e os produtos e arquivos já gravados serão reaproveitados.'}].slice(-100)});
    return {progressed:true};
  };
  try {
    if(job.queue.length && job.queue.some(item=>item.adapterVersion!==3)){
      const page=await readSaberExport(token,job.visited_urls.at(-1) || SABER_EXPORT_URL);
      if(page.owner!==job.source_owner)throw new Error('A loja de origem mudou durante a exportação. A importação foi bloqueada.');
      if(job.source_total!==null && page.total!==null && page.total!==job.source_total)return await reconcileCatalogue(page.total);
      if(page.products.length!==job.queue.length || page.products.some((item,index)=>item.id!==job.queue[index].id))throw new Error('A página de origem mudou. A importação foi pausada para preservar os produtos concluídos.');
      const filledTitles=new Set<string>();
      for(const [index,item] of page.products.slice(0,job.cursor).entries()){
        if(await fillMissingImportedPrice(job,item) && job.queue.filter(other=>other.title===job.queue[index].title).length===1)filledTitles.add(job.queue[index].title);
      }
      const issues=job.issues.filter(issue=>!(filledTitles.has(issue.product) && issue.message.startsWith('Preço não disponível:')));
      await receipt({queue:page.products,next_url:page.nextUrl || job.next_url,issues,last_error:null});return {progressed:true};
    }
    if(job.cursor>=job.queue.length){
      if(!job.next_url){
        if(job.source_total!==null && job.discovered!==job.source_total){
          // Recover jobs persisted before the pagination adapter recognised this export.
          // Re-read the last confirmed page; never reset counters or overwrite its products.
          const lastUrl=job.visited_urls.at(-1) || SABER_EXPORT_URL;
          const recovered=await readSaberExport(token,lastUrl);
          if(recovered.owner!==job.source_owner)throw new Error('A loja de origem mudou durante a exportação. A importação foi bloqueada.');
          if(recovered.total!==null && recovered.total!==job.source_total)return await reconcileCatalogue(recovered.total);
          const samePage=recovered.products.length===job.queue.length && recovered.products.every((item,index)=>item.id===job.queue[index].id);
          if(samePage && recovered.nextUrl && !currentPassUrls.includes(recovered.nextUrl)){
            await receipt({next_url:recovered.nextUrl,last_error:null});return {progressed:true};
          }
          return await reconcileCatalogue();
        }
        await receipt({status:'completed',queue:[],current_product:null});return {completed:true};
      }
      if(currentPassUrls.includes(job.next_url))throw new Error('A API repetiu uma página. A importação foi pausada para evitar repetição.');
      const page=await readSaberExport(token,job.next_url);
      if(page.owner!==job.source_owner)throw new Error('A loja de origem mudou durante a exportação. A importação foi bloqueada.');
      if(job.source_total!==null && page.total!==null && page.total!==job.source_total)return await reconcileCatalogue(page.total);
      const seen=new Set(job.seen_ids || []);
      const unseen=page.products.filter(item=>!seen.has(item.id));
      const repeated=page.products.length-unseen.length;
      // Overlapping pages are safe: only unseen source IDs enter the queue.
      // Permit one wholly overlapping page with a new continuation, but never
      // follow endlessly changing URLs that keep returning the same products.
      if(page.products.length && !unseen.length && page.nextUrl &&
        (page.nextUrl===job.next_url || currentPassUrls.includes(page.nextUrl) || !job.queue.length)){
        throw new Error('A API repetiu produtos sem avançar para materiais novos. O progresso foi preservado; confira a paginação da exportação.');
      }
      if(!page.products.length && page.nextUrl)throw new Error('A API retornou uma página vazia com continuação. Confira a exportação.');
      const total=job.source_total ?? page.total,discovered=job.discovered+unseen.length;
      if(total!==null && discovered>total)return await reconcileCatalogue(total);
      const nextUrl=page.inferredNext && total!==null && discovered===total?null:page.nextUrl;
      const issues=repeated?[...job.issues,{product:'Exportação do catálogo',message:`${repeated} produto(s) repetido(s) entre páginas foram reconhecidos e não serão importados novamente.`}].slice(-100):job.issues;
      await receipt({queue:unseen,cursor:0,next_url:nextUrl,visited_urls:[...job.visited_urls,job.next_url],seen_ids:[...seen,...unseen.map(item=>item.id)],source_total:total,discovered,current_product:null,asset_cursor:0,issues,last_error:null});return {progressed:true};
    }
    const item=job.queue[job.cursor];
    if(item.owner!==job.source_owner)throw new Error('Produto fora da loja autorizada.');
    const productId=saberImportId(job.store_id,job.source_owner,item.id);
    const {data:mapped,error:mapError}=await db.from('platform_product_import_receipts').select('product_id').eq('store_id',job.store_id).eq('provider','saberdidatico').eq('source_owner',job.source_owner).eq('source_id',item.id).maybeSingle();check({error:mapError});
    if(mapped){
      await fillMissingImportedPrice(job,item,mapped.product_id);
      if(!item.deliveries?.length){await receipt({cursor:job.cursor+1,skipped:job.skipped+1,current_product:null,asset_cursor:0});return {progressed:true};}
      if(mapped.product_id!==productId)throw new Error('O produto importado não corresponde à loja autorizada.');
    }
    const {data:product,error:productError}=await db.from('products').select('id,store_id,status,import_incomplete').eq('id',productId).maybeSingle();check({error:productError});
    if(product && (product.store_id!==job.store_id || product.status!=='rascunho' || !product.import_incomplete)){
      // A creator can review a draft before its last asset/receipt is committed.
      // Its deterministic ID already binds it to this source item. Preserve the
      // owned product and advance even when the final import receipt is absent.
      if(product.store_id===job.store_id){await receipt({cursor:job.cursor+1,skipped:job.skipped+1,current_product:null,asset_cursor:0,last_error:null,issues:[...job.issues,{product:item.title,message:'Produto já revisado ou alterado: preservado sem sobrescrever. Confira as entregas no cadastro.'}].slice(-100)});return {progressed:true};}
      throw new Error('O produto não pertence à loja autorizada e não será sobrescrito pela importação.');
    }
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
      check(await db.from('products').insert({id:productId,store_id:job.store_id,titulo:item.title,slug:(normalize(item.title).slice(0,80)||'material')+'-'+productId,descricao:item.description || null,tipo:item.type,preco:item.price,preco_original:item.originalPrice,is_free:item.priceKnown && item.price===0,capa_url:null,status:'rascunho',import_incomplete:true,import_price_confirmed:item.priceKnown,category_id:categoryIds[0]||null,category_ids:categoryIds,education_level_id:levelIds[0]||null,education_level_ids:levelIds,tags,seasonal_tags:(item.seasonalTags || []).slice(0,30),presentation_video_url:item.video,video_as_cover:item.videoAsCover===true,page_count:item.pageCount,age_range:item.ageRange,format_details:item.formatDetails,color_mode:item.colorMode,created_at:now,updated_at:now}));
      await receipt({current_product:productId,asset_cursor:0});return {progressed:true};
    }
    if(!job.current_product){await receipt({current_product:productId,...(mapped?{asset_cursor:item.images.length}:{})});return {progressed:true};}
    if(job.asset_cursor<item.images.length){
      const index=job.asset_cursor;
      const image=await mirrorPlatformImportImage(item.images[index],job.store_id,productId,index);
      const applied=await db.rpc('apply_platform_import_image',{p_job:job.id,p_store:job.store_id,p_lease:lease,p_product:productId,p_image_id:saberImportId(job.store_id,job.source_owner,item.id+':image:'+index),p_url:image,p_index:index});check(applied);
      if(!applied.data)throw new Error('O produto foi revisado ou a etapa expirou. A imagem não foi alterada.');
      await receipt({asset_cursor:index+1});return {progressed:true};
    }
    const deliveryIndex=job.asset_cursor-item.images.length;
    if(deliveryIndex<(item.deliveries?.length || 0)){
      if(!await platformDeliveryImportReady())throw new Error('Ative a atualização de importação de arquivos antes de continuar.');
      const fileId=saberImportId(job.store_id,job.source_owner,item.id+':delivery:'+deliveryIndex);
      if(await importedDeliveryPresent(db,job.store_id,productId,fileId,deliveryIndex)){
        await receipt({asset_cursor:job.asset_cursor+1});return {progressed:true};
      }
      const file=await mirrorPlatformDelivery(item.deliveries![deliveryIndex],job.store_id,productId,deliveryIndex);
      const applied=await db.rpc('apply_platform_import_delivery',{p_job:job.id,p_store:job.store_id,p_lease:lease,p_product:productId,p_file_id:fileId,p_index:deliveryIndex,p_asset:file,p_probe:false});check(applied);
      if(!applied.data)throw new Error('O produto ou suas entregas foram alterados. Os arquivos existentes foram preservados; revise o cadastro.');
      const issues=file.external?[...job.issues,{product:item.title,message:'Link de entrega importado. Confira na origem se os compradores poderão acessá-lo.'}].slice(-100):job.issues;
      await receipt({asset_cursor:job.asset_cursor+1,issues});return {progressed:true};
    }
    if(!mapped)check(await db.from('platform_product_import_receipts').insert({store_id:job.store_id,provider:'saberdidatico',source_owner:job.source_owner,source_id:item.id,product_id:productId}));
    const issues=[...job.issues,...item.warnings.map(message=>({product:item.title,message})),...(!item.deliveries?.length?[{product:item.title,message:'A exportação não forneceu arquivos de entrega para este produto. Envie o material pelo cadastro.'}]:[])].slice(-100);
    await receipt({cursor:job.cursor+1,imported:job.imported+(mapped?0:1),skipped:job.skipped+(mapped?1:0),current_product:null,asset_cursor:0,issues,last_error:null});return {progressed:true};
  }catch(error){
    // Never persist provider bodies, credentials, signed URLs or raw DB messages.
    const known=error instanceof Error?error.message:'';
    const message=/^(A API|A Saber|A exportação|A entrega|Ative a|A loja|A página|A mídia|O catálogo|O produto|O total|Produto fora|Endereço de mídia|Não foi possível|Formato de imagem)/.test(known)?known.replace(/https?:\/\/\S+/g,'[endereço]').replace(/sbr_live_\w+/gi,'[chave]').slice(0,240):'Não foi possível concluir esta etapa. Retome para tentar novamente.';
    await receipt({status:'paused',last_error:message});return {paused:true};
  }
}
