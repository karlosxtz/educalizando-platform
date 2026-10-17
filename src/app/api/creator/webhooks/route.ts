import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin as db } from '@/lib/supabase';
import { STORE_WEBHOOK_EVENTS,UTMIFY_EVENTS,type StoreWebhookEvent } from '@/lib/store-webhook-contract';
import { encryptWebhookSecret,newWebhookSecret,validateWebhookUrl } from '@/lib/store-webhook-security';
import { consumeRequestRateLimit,rateLimitResponse } from '@/lib/request-rate-limit';
import { dispatchStoreWebhooks } from '@/lib/store-webhook-delivery';

export const dynamic='force-dynamic';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
const uuid=(value:unknown)=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
class InputError extends Error {}
async function context(request:Request) {
  const origin=request.headers.get('origin');
  if(origin&&origin!==new URL(request.url).origin) return null;
  const user=await getRequestUser(request);if(!user)return null;
  const {data:store,error}=await db.from('stores').select('id,nome_loja').eq('creator_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(error)throw error;
  return store;
}
async function bodyOf(request:Request):Promise<Record<string,unknown>> {
  if(Number(request.headers.get('content-length'))>16384)throw new InputError('Configuração muito grande.');
  const reader=request.body?.getReader();if(!reader)throw new InputError('Informe os dados da configuração.');
  const chunks:Uint8Array[]=[];let length=0;
  while(true){const part=await reader.read();if(part.done)break;length+=part.value.byteLength;if(length>16384){await reader.cancel();throw new InputError('Configuração muito grande.');}chunks.push(part.value);}
  const bytes=new Uint8Array(length);let position=0;for(const chunk of chunks){bytes.set(chunk,position);position+=chunk.length;}
  try {const body=JSON.parse(new TextDecoder().decode(bytes));if(!body||typeof body!=='object'||Array.isArray(body))throw new Error();return body;}catch{throw new InputError('Envie uma configuração JSON válida.');}
}
const safeColumns='id,name,provider,url,events,include_customer,enabled,version,created_at,updated_at';
function failed(error:unknown) {
  if(error instanceof InputError)return json({error:error.message},400);
  const code=(error as {code?:string})?.code;
  return json({error:code==='42P01'||code==='PGRST205'?'Aplique a migration de Webhooks no Supabase para ativar este módulo.':'Não foi possível concluir a operação. Tente novamente.',schemaRequired:code==='42P01'||code==='PGRST205'},503);
}
export async function GET(request:Request) {
  try {
    const store=await context(request);if(!store)return json({error:'Entre com a conta do criador.'},401);
    const [{data:endpoints,error},{data:deliveries,error:logError}]=await Promise.all([
      db.from('store_webhook_endpoints').select(safeColumns).eq('store_id',store.id).order('created_at',{ascending:false}),
      db.from('store_webhook_deliveries').select('id,endpoint_id,status,attempts,http_status,last_error,created_at,delivered_at,next_attempt_at,event:store_webhook_events(type,is_test:data->is_test)').eq('store_id',store.id).order('created_at',{ascending:false}).limit(50),
    ]);if(error||logError)throw error||logError;
    return json({store,endpoints:endpoints||[],deliveries:deliveries||[],events:STORE_WEBHOOK_EVENTS});
  }catch(error){return failed(error);}
}
export async function POST(request:Request) {
  try {
    const store=await context(request);if(!store)return json({error:'Entre com a conta do criador.'},401);
    const limit=await consumeRequestRateLimit(request,{namespace:'store-webhooks:'+store.id,limit:20,windowMs:60000});if(!limit.allowed)return rateLimitResponse(limit);
    const body=await bodyOf(request);
    if(body.action==='process') return json(await dispatchStoreWebhooks(store.id));
    if(body.action==='test') {
      if(!uuid(body.id))throw new InputError('Integração inválida.');
      const {data:ep,error}=await db.from('store_webhook_endpoints').select('id,provider,enabled,version').eq('id',body.id).eq('store_id',store.id).maybeSingle();
      if(error)throw error;if(!ep||!ep.enabled)return json({error:'Ative uma integração da sua loja antes de testar.'},404);
      const now=new Date().toISOString(),entity='test_'+crypto.randomUUID();
      const {data:event,error:eventError}=await db.from('store_webhook_events').insert({store_id:store.id,type:ep.provider==='utmify'?'order.paid':'webhook.test',entity_id:entity,data:{id:entity,status:'paid',payment_method:'pix',created_at:now,paid_at:now,total_amount:10,creator_net_amount:9,asaas_fee_amount:1,is_test:true}}).select('id').single();
      if(eventError)throw eventError;
      const {error:deliveryError}=await db.from('store_webhook_deliveries').insert({store_id:store.id,endpoint_id:ep.id,event_id:event.id,endpoint_version:ep.version});if(deliveryError)throw deliveryError;
      const result=await dispatchStoreWebhooks(store.id);return json({queued:true,...result});
    }
    if(body.action==='retry') {
      if(!uuid(body.id))throw new InputError('Entrega inválida.');
      const {data:previous,error:previousError}=await db.from('store_webhook_deliveries').select('id,event:store_webhook_events!inner(type,entity_id,data),endpoint:store_webhook_endpoints!inner(provider)').eq('id',body.id).eq('store_id',store.id).eq('status','failed').maybeSingle();
      if(previousError)throw previousError;if(!previous)return json({error:'Entrega não encontrada ou não está com falha.'},409);
      const event=previous.event as unknown as {type:string;entity_id:string;data:{status?:string}};
      const endpoint=previous.endpoint as unknown as {provider:string};
      if(endpoint.provider==='utmify'&&!event.entity_id.startsWith('test_')){
        const {data:order,error:orderError}=await db.from('orders').select('status').eq('id',event.entity_id).eq('store_id',store.id).maybeSingle();
        if(orderError)throw orderError;
        if(!order||order.status!==event.data.status)return json({error:'O pedido mudou de situação. Para não enviar um status antigo à UTMify, use a entrega do evento mais recente.'},409);
      }
      const {data,error}=await db.from('store_webhook_deliveries').update({status:'pending',attempts:0,next_attempt_at:new Date().toISOString(),last_error:null}).eq('id',body.id).eq('store_id',store.id).eq('status','failed').select('id');
      if(error)throw error;if(!data?.length)return json({error:'Entrega não encontrada ou não está com falha.'},409);
      return json({queued:true,...await dispatchStoreWebhooks(store.id)});
    }
    if(body.provider!=='generic'&&body.provider!=='utmify')throw new InputError('Escolha o tipo de integração.');
    if(typeof body.name!=='string'||!body.name.trim()||body.name.length>100)throw new InputError('Informe um nome de até 100 caracteres.');
    const events=Array.isArray(body.events)?[...new Set(body.events)]:[];
    if(!events.length||events.some(x=>typeof x!=='string'||!Object.hasOwn(STORE_WEBHOOK_EVENTS,x)))throw new InputError('Selecione eventos válidos.');
    if(body.provider==='utmify'&&events.some(x=>!UTMIFY_EVENTS.includes(x as StoreWebhookEvent)))throw new InputError('A UTMify recebe eventos de pedidos compatíveis.');
    if(body.provider==='utmify'&&(typeof body.apiToken!=='string'||body.apiToken.trim().length<12||body.apiToken.length>500||body.includeCustomer!==true))throw new InputError('Informe a credencial da UTMify e autorize o envio dos dados necessários do comprador.');
    const target=body.provider==='utmify'?'https://api.utmify.com.br/api-credentials/orders':String(body.url||'');
    let url:string;try{url=await validateWebhookUrl(target);}catch{throw new InputError('Informe uma URL HTTPS acessível em rede pública.');}
    const {count,error:countError}=await db.from('store_webhook_endpoints').select('id',{count:'exact',head:true}).eq('store_id',store.id);if(countError)throw countError;
    if((count||0)>=10)throw new InputError('Cada loja pode ter até 10 integrações.');
    const secret=newWebhookSecret();
    const {data:endpoint,error}=await db.from('store_webhook_endpoints').insert({store_id:store.id,name:body.name.trim(),provider:body.provider,url,events,include_customer:body.includeCustomer===true,secret_encrypted:encryptWebhookSecret(secret,store.id),token_encrypted:body.provider==='utmify'?encryptWebhookSecret(String(body.apiToken).trim(),store.id):null}).select(safeColumns).single();
    if(error)throw error;
    return json({endpoint,signingSecret:secret},201);
  }catch(error){return failed(error);}
}
export async function PATCH(request:Request) {
  try {
    const store=await context(request);if(!store)return json({error:'Entre com a conta do criador.'},401);
    const limit=await consumeRequestRateLimit(request,{namespace:'store-webhooks:'+store.id,limit:20,windowMs:60000});if(!limit.allowed)return rateLimitResponse(limit);
    const body=await bodyOf(request);if(!uuid(body.id))throw new InputError('Integração inválida.');
    const {data:current,error:readError}=await db.from('store_webhook_endpoints').select('provider,include_customer').eq('id',body.id).eq('store_id',store.id).maybeSingle();
    if(readError)throw readError;if(!current)return json({error:'Integração não encontrada.'},404);
    const changes:Record<string,unknown>={};let secret:string|undefined;
    if(typeof body.enabled==='boolean')changes.enabled=body.enabled;
    if(body.rotateSecret===true){secret=newWebhookSecret();changes.secret_encrypted=encryptWebhookSecret(secret,store.id);}
    if(body.name!==undefined){if(typeof body.name!=='string'||!body.name.trim()||body.name.length>100)throw new InputError('Informe um nome de até 100 caracteres.');changes.name=body.name.trim();}
    if(body.events!==undefined){
      const events=Array.isArray(body.events)?[...new Set(body.events)]:[];
      if(!events.length||events.some(x=>typeof x!=='string'||!Object.hasOwn(STORE_WEBHOOK_EVENTS,x)))throw new InputError('Selecione eventos válidos.');
      if(current.provider==='utmify'&&events.some(x=>!UTMIFY_EVENTS.includes(x as StoreWebhookEvent)))throw new InputError('A UTMify recebe eventos de pedidos compatíveis.');
      changes.events=events;
    }
    if(body.includeCustomer!==undefined){if(typeof body.includeCustomer!=='boolean'||current.provider==='utmify'&&!body.includeCustomer)throw new InputError('A UTMify exige os dados do comprador.');changes.include_customer=body.includeCustomer;}
    if(body.url!==undefined&&current.provider==='generic'){try{changes.url=await validateWebhookUrl(String(body.url));}catch{throw new InputError('Informe uma URL HTTPS acessível em rede pública.');}}
    if(body.apiToken&&current.provider==='utmify'){
      if(typeof body.apiToken!=='string'||body.apiToken.trim().length<12||body.apiToken.length>500)throw new InputError('Credencial da UTMify inválida.');
      changes.token_encrypted=encryptWebhookSecret(body.apiToken.trim(),store.id);
    }
    if(!Object.keys(changes).length)throw new InputError('Selecione uma alteração.');
    const {data,error}=await db.from('store_webhook_endpoints').update(changes).eq('id',body.id).eq('store_id',store.id).select(safeColumns).maybeSingle();
    if(error)throw error;if(!data)return json({error:'Integração não encontrada.'},404);
    return json({endpoint:data,...(secret?{signingSecret:secret}:{})});
  }catch(error){return failed(error);}
}
export async function DELETE(request:Request) {
  try {
    const store=await context(request);if(!store)return json({error:'Entre com a conta do criador.'},401);
    const body=await bodyOf(request);if(!uuid(body.id))throw new InputError('Integração inválida.');
    const {data,error}=await db.from('store_webhook_endpoints').delete().eq('id',body.id).eq('store_id',store.id).select('id');
    if(error)throw error;if(!data?.length)return json({error:'Integração não encontrada.'},404);return json({success:true});
  }catch(error){return failed(error);}
}
