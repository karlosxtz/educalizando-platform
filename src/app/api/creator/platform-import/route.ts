import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin as db } from '@/lib/supabase';
import { saberFingerprint, saberToken, readSaberExport } from '@/lib/saber-export-client';
import { createSaberJob, processSaberJob, saberJobColumns, type SaberJob } from '@/lib/saber-import-job';
import { consumeRequestRateLimit, rateLimitResponse } from '@/lib/request-rate-limit';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Robots-Tag':'noindex'}});
const uuid=(input:unknown):input is string=>typeof input==='string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(input);
async function creator(request:Request) {
  const user=await getRequestUser(request);if(!user)return null;
  const {data,error}=await db.from('stores').select('id,nome_loja').eq('creator_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle();if(error)throw new Error('Não foi possível consultar sua loja.');return data;
}
export async function GET(request:Request) {
  try {const store=await creator(request);if(!store)return json({error:'Entre com a conta do criador.'},401);
    const {data,error}=await db.from('platform_product_imports').select(saberJobColumns).eq('store_id',store.id).order('created_at',{ascending:false}).limit(5);
    if(error)return json({available:false,jobs:[],store});return json({available:true,jobs:data || [],store});
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
      return json({preview:{owner:page.owner,label:page.label,total:page.total,received:page.products.length,hasMore:Boolean(page.nextUrl),products:page.products.slice(0,8).map(item=>({title:item.title,price:item.priceKnown?item.price:null,images:item.images.length})),warnings:[...new Set(page.products.flatMap(item=>item.warnings))]}});
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
      if(body.action==='step') {if(job.status==='running')await processSaberJob(job,token);}
      else if(body.action==='resume') {
        const result=await db.from('platform_product_imports').update({status:'running',last_error:null,updated_at:new Date().toISOString()}).eq('id',job.id).eq('store_id',store.id);if(result.error)throw new Error('Não foi possível retomar.');
      }else if(body.action==='skip-image') {
        const item=job.queue[job.cursor];if(job.status!=='paused' || !job.current_product || !item || job.asset_cursor>=item.images.length || (job.lease_until && Date.parse(job.lease_until)>Date.now()))return json({error:'Nenhuma imagem com falha disponível para pular.'},409);
        const result=await db.from('platform_product_imports').update({asset_cursor:job.asset_cursor+1,status:'running',last_error:null,issues:[...job.issues,{product:item.title,message:'Uma imagem foi ignorada por escolha do criador; envie-a pelo cadastro do produto.'}].slice(-100),updated_at:new Date().toISOString()}).eq('id',job.id).eq('store_id',store.id).eq('status','paused');if(result.error)throw new Error('Não foi possível continuar sem a imagem.');
      }else return json({error:'Ação inválida.'},400);
    }
    const {data:latest,error:latestError}=await db.from('platform_product_imports').select(saberJobColumns).eq('id',job.id).eq('store_id',store.id).single();if(latestError)throw new Error('Não foi possível consultar o progresso.');return json({job:latest});
  }catch(error){
    const message=error instanceof Error?error.message:'';
    const safe=/^(A API|A Saber|A exportação|A loja|A página|A paginação|Cole uma|Já existe|Ative a|Não foi possível|O endereço|O total)/.test(message)?message.replace(/sbr_live_\w+/gi,'[chave]').replace(/https?:\/\/\S+/g,'[endereço]').slice(0,300):'Não foi possível concluir. Nenhuma credencial foi registrada. Confira a conexão e tente novamente.';
    return json({error:safe},400);
  }
}
