export const STORE_WEBHOOK_EVENTS = {
  'order.created': 'Pedido criado / aguardando pagamento', 'order.paid': 'Pagamento confirmado',
  'order.refunded': 'Pedido reembolsado', 'order.cancelled': 'Pedido cancelado', 'order.failed': 'Pagamento falhou',
  'order.expired': 'Pedido expirou', 'order.chargedback': 'Chargeback confirmado', 'order.updated': 'Outro status do pedido',
  'product.created': 'Material cadastrado', 'product.updated': 'Material atualizado', 'product.published': 'Material publicado',
  'product.unpublished': 'Material retirado de publicação', 'product.deleted': 'Material removido',
  'kit.created': 'Combo criado', 'kit.updated': 'Status do combo alterado', 'kit.deleted': 'Combo removido',
  'club.created': 'Clube criado', 'club.updated': 'Status do clube alterado', 'club.deleted': 'Clube removido',
  'subscription.created': 'Assinatura criada', 'subscription.updated': 'Status / validade da assinatura alterados', 'subscription.deleted': 'Assinatura removida',
  'club_payment.created': 'Pagamento de clube criado', 'club_payment.updated': 'Status do pagamento de clube alterado',
  'club_payment.deleted': 'Pagamento de clube removido', 'webhook.test': 'Teste de conexão',
} as const;
export type StoreWebhookEvent = keyof typeof STORE_WEBHOOK_EVENTS;
export const UTMIFY_EVENTS: StoreWebhookEvent[] = ['order.created','order.paid','order.refunded','order.failed','order.cancelled','order.chargedback'];
export type WebhookEndpoint = { id: string; store_id: string; name: string; provider: 'generic' | 'utmify'; url: string; secret_encrypted: string; token_encrypted: string | null; enabled: boolean; version: number; events: StoreWebhookEvent[]; include_customer: boolean };
export type WebhookEventRecord = { id: string; store_id: string; type: StoreWebhookEvent; entity_id: string; data: Record<string, unknown>; created_at: string };
export type WebhookDelivery = { id: string; store_id: string; endpoint_id: string; event_id: string; endpoint_version: number; attempts: number; lease_token: string };

export const ATTRIBUTION_KEYS = ['src','sck','utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid','gclid','ttclid'] as const;
export function cleanCheckoutAttribution(input: unknown): Record<string,string> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const source = input as Record<string,unknown>;
  return Object.fromEntries(ATTRIBUTION_KEYS.flatMap(key => typeof source[key] === 'string'
    ? [[key, source[key].replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,200)]] : []).filter(([,value])=>value));
}

export function readStoreAttribution(storeId: string) {
  if (typeof window === 'undefined') return {};
  try {
    if(localStorage.getItem('educalizando_metrics_consent_'+storeId)==='rejected')return {};
    return cleanCheckoutAttribution(JSON.parse(sessionStorage.getItem('educalizando_campaign_'+storeId)||'{}'));
  } catch { return {}; }
}
export function captureStoreAttribution(storeId?: string) {
  if(typeof window==='undefined')return;
  try {
    if(storeId&&localStorage.getItem('educalizando_metrics_consent_'+storeId)==='rejected')return;
    const query=cleanCheckoutAttribution(Object.fromEntries(new URLSearchParams(window.location.search)));
    if(!storeId){if(Object.keys(query).length)sessionStorage.setItem('educalizando_campaign_landing',JSON.stringify({at:Date.now(),params:query}));return;}
    const key='educalizando_campaign_'+storeId;
    if(Object.keys(query).length){sessionStorage.setItem(key,JSON.stringify(query));return;}
    const landing=JSON.parse(sessionStorage.getItem('educalizando_campaign_landing')||'null');
    if(!sessionStorage.getItem(key)&&landing&&Date.now()-Number(landing.at)<1800000)sessionStorage.setItem(key,JSON.stringify(cleanCheckoutAttribution(landing.params)));
  } catch { /* Unavailable browser storage cannot block checkout. */ }
}
