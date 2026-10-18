export type TrackingProduct = { productId: string; title: string; price: number; currency?: string };
export type TrackingDetail = {
  event: 'AddToCart' | 'InitiateCheckout' | 'Purchase'; storeId: string;
  product?: TrackingProduct; value?: number; currency?: string; transactionId?: string;
};
type Event = Omit<TrackingDetail, 'event'> & { event: TrackingDetail['event'] | 'ViewContent' };
type Consent = 'accepted' | 'rejected' | null;
type Destination = 'google' | 'meta';
type Sender = (...args: unknown[]) => void;
export type TrackingBrowser = { gtag?: Sender; fbq?: Sender };
const googleEvents = { ViewContent: 'view_item', AddToCart: 'add_to_cart', InitiateCheckout: 'begin_checkout', Purchase: 'purchase' };

export function trackingIds(meta?: string | null, google?: string | null) {
  return { meta: /^\d{5,25}$/.test(meta || '') ? meta! : null, google: /^G-[A-Z0-9]{4,20}$/.test(google || '') ? google! : null };
}

/** Only allow event fields owned by this store; no customer data or arbitrary properties. */
export function cleanTrackingEvent(value: unknown, storeId: string): Event | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Event;
  if (input.storeId !== storeId || !Object.hasOwn(googleEvents, input.event)) return null;
  const product = input.product;
  if (product && (typeof product.productId !== 'string' || typeof product.title !== 'string' || !Number.isFinite(product.price) || product.price < 0)) return null;
  if (input.value !== undefined && (!Number.isFinite(input.value) || input.value < 0)) return null;
  if (input.transactionId !== undefined && typeof input.transactionId !== 'string') return null;
  if (input.event === 'Purchase' && (typeof input.transactionId !== 'string' || !input.transactionId.trim())) return null;
  const currency = input.currency || product?.currency || 'BRL';
  if (!/^[A-Z]{3}$/.test(currency)) return null;
  return {
    event: input.event, storeId, currency, value: input.value ?? product?.price,
    ...(input.transactionId ? { transactionId: input.transactionId.slice(0, 200) } : {}),
    ...(product ? { product: { productId: product.productId.slice(0, 200), title: product.title.slice(0, 300), price: product.price } } : {}),
  };
}

export function trackingPayload(event: Event, destination: Destination, campaign: Record<string, unknown> = {}) {
  const common = { currency: event.currency, ...(event.value !== undefined ? { value: event.value } : {}) };
  const product = event.product;
  if (destination === 'meta') return {
    ...common, ...(product ? { content_ids: [product.productId], content_name: product.title, content_type: 'product' } : {}),
  };
  // Purchase's existing producer only supplies the total and order ID. Do not invent line items.
  return {
    ...common, ...(event.transactionId ? { transaction_id: event.transactionId } : {}),
    ...(product ? { items: [{ item_id: product.productId, item_name: product.title, price: product.price, quantity: 1 }] } : {}),
    ...Object.fromEntries(Object.entries(campaign).filter(([key, value]) => /^utm_(source|medium|campaign|term|content)$/.test(key) && typeof value === 'string')),
  };
}

/** Bounded, in-memory buffer only. No SDK calls until consent AND that destination's initialization. */
export function createStoreTracking(storeId: string, ids: ReturnType<typeof trackingIds>, browser: () => TrackingBrowser, campaign: () => Record<string, unknown>) {
  let consent: Consent = null;
  const ready = { google: false, meta: false };
  const queue: { event: Event; sent: Set<Destination> }[] = [];
  const purchases = new Set<string>();
  function flush() {
    if (consent !== 'accepted') return;
    for (const entry of queue) for (const destination of ['google', 'meta'] as const) {
      if (!ids[destination] || !ready[destination] || entry.sent.has(destination)) continue;
      const sdk = browser();
      try {
        if (destination === 'google') {
          if (!sdk.gtag) continue;
          sdk.gtag('event', googleEvents[entry.event.event], { ...trackingPayload(entry.event, destination, campaign()), send_to: ids.google });
        } else {
          if (!sdk.fbq) continue;
          sdk.fbq('trackSingle', ids.meta, entry.event.event, trackingPayload(entry.event, destination), ...(entry.event.transactionId ? [{ eventID: entry.event.transactionId }] : []));
        }
        entry.sent.add(destination);
      } catch { /* A blocked metrics SDK must never interrupt browsing or payment. */ }
    }
    for (let index = queue.length - 1; index >= 0; index--) {
      if ((['google', 'meta'] as const).every(destination => !ids[destination] || queue[index].sent.has(destination))) queue.splice(index, 1);
    }
  }
  return {
    consent(value: Consent) { consent = value; if (value === 'rejected') queue.length = 0; flush(); },
    ready(destination: Destination) { ready[destination] = true; flush(); },
    enqueue(value: unknown) {
      if (consent === 'rejected' || (!ids.google && !ids.meta)) return;
      const event = cleanTrackingEvent(value, storeId);
      if (!event) return;
      if (event.event === 'Purchase') {
        if (purchases.has(event.transactionId!)) return;
        purchases.add(event.transactionId!);
        if (purchases.size > 100) purchases.delete(purchases.values().next().value!);
      }
      if (queue.length >= 30) queue.shift();
      queue.push({ event, sent: new Set() }); flush();
    },
  };
}
