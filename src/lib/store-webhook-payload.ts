import { cleanCheckoutAttribution,type WebhookEndpoint,type WebhookEventRecord } from './store-webhook-contract';

type Customer = { name: string; email: string; phone: string | null; document: string | null };
export type WebhookOrderDetails = { customer: Customer; items: { id: string; name: string; quantity: number; priceInCents: number }[] };
const cents = (value: unknown) => Math.max(0,Math.round((Number(value)||0)*100));
const utc = (value: unknown) => { const date=new Date(String(value||''));return Number.isNaN(date.getTime())?null:date.toISOString().slice(0,19).replace('T',' '); };
export function createStoreWebhookPayload(endpoint: WebhookEndpoint,event: WebhookEventRecord,details?: WebhookOrderDetails) {
  if (endpoint.store_id!==event.store_id) throw new Error('store_scope_mismatch');
  if (endpoint.provider==='generic') return {
    id:event.id,type:event.type,version:'2026-10-16',created_at:event.created_at,store_id:event.store_id,
    data:{...event.data,...(details?{items:details.items,...(endpoint.include_customer?{customer:details.customer}:{})}:{})},
  };
  if (!event.type.startsWith('order.') || !details || !endpoint.include_customer) throw new Error('utmify_order_required');
  const status=({'order.created':'waiting_payment','order.paid':'paid','order.refunded':'refunded','order.failed':'refused','order.cancelled':'refused','order.chargedback':'chargedback'} as Record<string,string>)[event.type];
  if (!status) throw new Error('utmify_unsupported_status');
  const data=event.data,tracking=cleanCheckoutAttribution(data.tracking_parameters);
  const total=cents(data.total_amount),user=cents(data.creator_net_amount);
  const paymentMethod=({credit:'credit_card',credit_card:'credit_card',debit_card:'credit_card',card:'credit_card',pix:'pix',boleto:'boleto'} as Record<string,string>)[String(data.payment_method)];
  if(!paymentMethod)throw new Error('utmify_unsupported_payment_method');
  return { orderId:event.entity_id,platform:'Educalizando',paymentMethod,
    status,createdAt:utc(data.created_at)||utc(event.created_at),approvedDate:utc(data.paid_at),refundedAt:status==='refunded'||status==='chargedback'?utc(event.created_at):null,
    customer:{...details.customer,country:'BR'},products:details.items.map(item=>({...item,planId:null,planName:null})),
    trackingParameters:Object.fromEntries(['src','sck','utm_source','utm_medium','utm_campaign','utm_content','utm_term'].map(k=>[k,tracking[k]||null])),
    commission:{totalPriceInCents:total,gatewayFeeInCents:Math.max(0,total-user),userCommissionInCents:user},isTest:event.entity_id.startsWith('test_'),
  };
}
