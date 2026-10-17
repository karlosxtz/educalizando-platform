import 'server-only';
import { supabaseAdmin as db } from './supabase';
import { createStoreWebhookPayload,type WebhookOrderDetails } from './store-webhook-payload';
import { decryptWebhookSecret,signStoreWebhook,validateWebhookUrl } from './store-webhook-security';
import type { WebhookEndpoint,WebhookEventRecord,WebhookDelivery } from './store-webhook-contract';

export function webhookRetryDelay(attempt: number) { return Math.min(21600,30*2**Math.max(0,attempt-1)); }
export function retryableWebhookStatus(status: number) { return status===408||status===425||status===429||status>=500; }

async function orderDetails(event: WebhookEventRecord): Promise<WebhookOrderDetails | undefined> {
  if (!event.type.startsWith('order.')) return undefined;
  if(event.entity_id.startsWith('test_')) return {customer:{name:'Cliente de teste',email:'teste@example.invalid',phone:null,document:null},items:[{id:'teste',name:'Material fictício de teste',quantity:1,priceInCents:1000}]};
  const [{data:order,error},{data:items,error:itemError}]=await Promise.all([
    db.from('orders').select('buyer_name,buyer_email,buyer_phone,buyer_cpf').eq('id',event.entity_id).eq('store_id',event.store_id).maybeSingle(),
    db.from('order_items').select('product_id,product_title,quantity,unit_price').eq('order_id',event.entity_id).eq('store_id',event.store_id),
  ]);
  if(error||itemError||!order||!items?.length) throw new Error('order_data_unavailable');
  return {customer:{name:order.buyer_name||'',email:order.buyer_email||'',phone:order.buyer_phone||null,document:order.buyer_cpf||null},
    items:items.map(item=>({id:item.product_id,name:item.product_title||'Material digital',quantity:item.quantity,priceInCents:Math.round(Number(item.unit_price)*100)}))};
}

async function deliver(row: WebhookDelivery) {
  let status: 'pending'|'delivered'|'failed'|'cancelled'='failed',httpStatus:number|null=null,errorCode:string|null=null;
  try {
    const [{data:endpoint,error:epError},{data:event,error:eventError}]=await Promise.all([
      db.from('store_webhook_endpoints').select('*').eq('id',row.endpoint_id).eq('store_id',row.store_id).maybeSingle(),
      db.from('store_webhook_events').select('*').eq('id',row.event_id).eq('store_id',row.store_id).maybeSingle(),
    ]);
    if(epError||eventError) throw new Error('queue_data_unavailable');
    if(!endpoint||!event||!endpoint.enabled||endpoint.version!==row.endpoint_version) {status='cancelled';errorCode='config_changed';}
    else {
      const ep=endpoint as WebhookEndpoint,ev=event as WebhookEventRecord;
      const destination=ep.provider==='utmify'?'https://api.utmify.com.br/api-credentials/orders':ep.url;
      const url=await validateWebhookUrl(destination);
      const payload=createStoreWebhookPayload(ep,ev,await orderDetails(ev));
      const body=JSON.stringify(payload);
      if(Buffer.byteLength(body)>131072) throw new Error('payload_too_large');
      const timestamp=String(Math.floor(Date.now()/1000));
      const headers:Record<string,string>={'Content-Type':'application/json','User-Agent':'Educalizando-Webhooks/1.0','X-Educalizando-Event':ev.type,'X-Educalizando-Delivery':row.id,'X-Educalizando-Event-Id':ev.id,'X-Educalizando-Timestamp':timestamp,'X-Educalizando-Signature':signStoreWebhook(body,timestamp,decryptWebhookSecret(ep.secret_encrypted,ep.store_id))};
      if(ep.provider==='utmify') {
        if(!ep.token_encrypted) throw new Error('token_missing');
        headers['x-api-token']=decryptWebhookSecret(ep.token_encrypted,ep.store_id);
      }
      const response=await fetch(url,{method:'POST',body,headers,redirect:'manual',signal:AbortSignal.timeout(8000),cache:'no-store'});
      httpStatus=response.status;
      await response.body?.cancel();
      if(response.ok) status='delivered';
      else {status=retryableWebhookStatus(response.status)&&row.attempts<8?'pending':'failed';errorCode=response.status>=300&&response.status<400?'redirect_rejected':'http_'+response.status;}
    }
  } catch(error) {
    const code=error instanceof Error?error.message:'';
    const permanent=['payload_too_large','store_scope_mismatch','utmify_order_required','utmify_unsupported_status','utmify_unsupported_payment_method','token_missing'].includes(code);
    status=!permanent&&row.attempts<8?'pending':'failed';
    errorCode=permanent?code:'connection_or_configuration_error';
  }
  const result=await db.from('store_webhook_deliveries').update({status,http_status:httpStatus,last_error:errorCode,leased_until:null,lease_token:null,
    next_attempt_at:new Date(Date.now()+webhookRetryDelay(row.attempts)*1000).toISOString(),delivered_at:status==='delivered'?new Date().toISOString():null})
    .eq('id',row.id).eq('store_id',row.store_id).eq('status','processing').eq('lease_token',row.lease_token).select('id');
  if(result.error||!result.data?.length) throw new Error('delivery_receipt_not_saved');
  return status;
}

export async function dispatchStoreWebhooks(storeId?: string) {
  const {data,error}=await db.rpc('claim_store_webhook_deliveries',{p_limit:5,p_store:storeId||null});
  if(error) { if(error.code==='PGRST202'||error.code==='42P01') return {schemaReady:false,processed:0,delivered:0};throw new Error('webhook_queue_unavailable'); }
  const results=await Promise.allSettled((data as WebhookDelivery[]||[]).map(deliver));
  return {schemaReady:true,processed:results.length,delivered:results.filter(x=>x.status==='fulfilled'&&x.value==='delivered').length,receiptErrors:results.filter(x=>x.status==='rejected').length};
}
