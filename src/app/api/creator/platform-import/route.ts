import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin as db } from '@/lib/supabase';
import { saberFingerprint, saberToken, readSaberExport } from '@/lib/saber-export-client';
import { createSaberJob, processSaberJob, restartSaberDeliveries, saberJobColumns, platformDeliveryImportReady, type SaberJob } from '@/lib/saber-import-job';
import { consumeRequestRateLimit, rateLimitResponse } from '@/lib/request-rate-limit';
import { saberImportStorageMessage } from '@/lib/saber-import-errors';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Robots-Tag':'noindex'}});
const uuid=(input:unknown):input is string=>typeof input==='string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(input);
const jobReadColumns=saberJobColumns+',current_product,queue,lease_until';
function jobView(job:SaberJob){
  const item=job.queue?.[job.cursor];
  return {...Object.fromEntries(saberJobColumns.split(',').map(key=>[key,(job as unknown as Record<string,unknown>)[key]])),can_skip_image:job.status==='paused' && !!job.current_product && !!item && job.asset_cursor<item.images.length && (!job.lease_until || Date.parse(job.lease_until)<=Date.now())};
}
async function creator(request:Request) {
  const user=await getRequestUser(request);if(!user)return null;
  const {data,error}=await db.from('stores').select('id,nome_loja').eq('creator_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle();if(error)throw new Error('Não foi possível consultar sua loja.');return data;
}
export async function GET(request:Request) {
  try {const store=await creator(request);if(!store)return json({error:'Entre com a conta do criador.'},401);
    const {data,error}=await db.from('platform_product_imports').select(jobReadColumns).eq('store_id',store.id).order('created_at',{ascending:false}).limit(5);
    if(error){if(['42P01','PGRST205'].includes(error.code))return json({available:false,jobs:[],store});return json({error:saberImportStorageMessage(error)},503);}return json({available:true,deliveryReady:await platformDeliveryImportReady(),jobs:(data || []).map(job=>jobView(job as unknown as SaberJob)),store});
  }catch{return json({error:'Não foi possível carregar as importações.'},503);}
}
export async function POST(request:Request) {
  try {
    if(request.headers.get('origin') && request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Origem inválida.'},403);
    const store=await creator(request);if(!store)return json({error:'Entre com a conta do criador.'},401);
    const limit=await consumeRequestRateLimit(request,{namespace:'platform-import:'+store.id,limit:120,windowMs:60000});if(!limit.allowed)return rateLimitResponse(limit);
    const raw=await request.text();if(raw.length>4096)return json({error:'Solicitação inválida.'},413);
    let body:Record<string,unknown>;try{const parsed=JSON.parse(raw);if(!parsed || typeof parsed!=='object' || Array.isArray(parsed))throw new Error();body=parsed;}catch{return json({error:'Solicitação inválida.'},400);}
    if(body.action==='preview') {
      const token=saberToken(body.token),page=await readSaberExport(token);
      let paginationError:string|null=null;
      if(page.nextUrl){
        try {
          const next=await readSaberExport(token,page.nextUrl);
          if(next.owner!==page.owner)throw new Error('A exportação retornou outra loja na próxima página.');
          if(next.products.some(item=>page.products.some(previous=>previous.id===item.id)))throw new Error('A exportação repetiu produtos na próxima página; a paginação não foi aceita pela origem.');
          if(!next.products.length && (next.nextUrl || page.total!==null && page.total>page.products.length))throw new Error('A exportação retornou a próxima página vazia antes de entregar o total informado.');
        } catch(error){const message=error instanceof Error?error.message:'';paginationError=/^(A API|A exportação|A loja|O endereço)/.test(message)?message.replace(/https?:\/\/\S+/g,'[endereço]').replace(/sbr_live_\w+/gi,'[chave]').slice(0,300):'A exportação não permitiu validar a próxima página. Nenhum produto foi cadastrado por este teste.';}
      }else if(page.total!==null && page.total>page.products.length)paginationError='A exportação informou um total maior, mas não disponibilizou continuação válida.';
      return json({deliveryReady:await platformDeliveryImportReady(),preview:{owner:page.owner,label:page.label,total:page.total,received:page.products.length,hasMore:Boolean(page.nextUrl),paginationError,products:page.products.slice(0,8).map(item=>({title:item.title,price:item.priceKnown?item.price:null,images:item.images.length,deliveries:item.deliveries?.length || 0})),priceFields:page.priceFields || [],deliveryFields:page.deliveryFields || [],warnings:[...new Set(page.products.flatMap(item=>item.warnings))]}});
    }
    if(body.action==='create') {
      const token=saberToken(body.token);if(typeof body.expectedOwner!=='string' || !body.expectedOwner)return json({error:'Confira a loja na prévia antes de importar.'},400);
      return json({job:await createSaberJob(store.id,token,saberFingerprint(token),body.expectedOwner)},201);
    }
    if(!uuid(body.id))return json({error:'Importação inválida.'},400);
    const {data,error}=await db.from('platform_product_imports').select('*').eq('id',body.id).eq('store_id',store.id).maybeSingle();if(error)throw new Error('Não foi possível carregar a importação.');if(!data)return json({error:'Importação não encontrada nesta loja.'},404);
    const job=data as SaberJob;
    if(!['running','paused'].includes(job.status))return json({error:'Esta importação já terminou.'},409);
    if(['pause','cancel'].includes(String(body.action))) {
      const result=await db.from('platform_product_imports').update({status:body.action==='pause'?'paused':'cancelled',updated_at:new Date().toISOString()}).eq('id',job.id).eq('store_id',store.id);if(result.error)throw new Error('Não foi possível atualizar a importação.');
    }else {
      const token=saberToken(body.token);if(saberFingerprint(token)!==job.token_fingerprint)return json({error:'Use a mesma chave desta importação. Se gerou outra, cancele e inicie novamente; os produtos concluídos não serão duplicados.'},409);
      if(body.action==='refresh-deliveries')await restartSaberDeliveries(job,token);
      else if(body.action==='step') {if(job.status==='running')await processSaberJob(job,token);}
      else if(body.action==='resume') {
        const result=await db.from('platform_product_imports').update({status:'running',last_error:null,updated_at:new Date().toISOString()}).eq('id',job.id).eq('store_id',store.id);if(result.error)throw new Error('Não foi possível retomar.');
      }else if(body.action==='skip-image') {
        const item=job.queue[job.cursor];if(job.status!=='paused' || !job.current_product || !item || job.asset_cursor>=item.images.length || (job.lease_until && Date.parse(job.lease_until)>Date.now()))return json({error:'Nenhuma imagem com falha disponível para pular.'},409);
        const result=await db.from('platform_product_imports').update({asset_cursor:job.asset_cursor+1,status:'running',last_error:null,issues:[...job.issues,{product:item.title,message:'Uma imagem foi ignorada por escolha do criador; envie-a pelo cadastro do produto.'}].slice(-100),updated_at:new Date().toISOString()}).eq('id',job.id).eq('store_id',store.id).eq('status','paused');if(result.error)throw new Error('Não foi possível continuar sem a imagem.');
      }else return json({error:'Ação inválida.'},400);
    }
    const {data:latest,error:latestError}=await db.from('platform_product_imports').select(jobReadColumns).eq('id',job.id).eq('store_id',store.id).single();if(latestError)throw new Error('Não foi possível consultar o progresso.');return json({job:jobView(latest as unknown as SaberJob)});
  }catch(error){
    const message=error instanceof Error?error.message:'';
    const safe=/^(A API|A Saber|A exportação|A estrutura|As tabelas|A loja|A página|A paginação|Cole uma|Já existe|Ative a|Não foi possível|O servidor|O endereço|O total)/.test(message)?message.replace(/sbr_live_\w+/gi,'[chave]').replace(/https?:\/\/\S+/g,'[endereço]').slice(0,300):'Não foi possível concluir. Nenhuma credencial foi registrada. Confira a conexão e tente novamente.';
    return json({error:safe},400);
  }
}
