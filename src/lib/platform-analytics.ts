import { cleanTrackingEvent, trackingPayload, type TrackingBrowser } from './store-analytics-events';

// Public measurement identifier. No API secret or server credentials belong here.
export const PLATFORM_GA4_ID = 'G-39R0YCQBJS';
export const PLATFORM_CONSENT_KEY = 'educalizando_platform_metrics_v1';
const SITE = 'https://www.educalizando.com.br';
const names = { ViewContent: 'view_item', AddToCart: 'add_to_cart', InitiateCheckout: 'begin_checkout', Purchase: 'purchase' };
export type MetricsConsent = 'accepted' | 'rejected' | null;

/** An allowlist avoids measuring private routes, order IDs and arbitrary search URLs. */
export function isMetricsPage(path: string) {
  return /^\/(?:lojas|materiais-didaticos|materiais-gratis|atividades-alfabetizacao|educacao-infantil|atividades-para-imprimir|jogos-pedagogicos|atividades-ensino-fundamental|planos-de-aula-bncc|recursos-pedagogicos)?\/?$/.test(path)
    || /^\/(?:produto|categorias|atividades-por-ano)\/[a-z0-9-]+\/?$/.test(path)
    || /^\/blog(?:\/[a-z0-9-]+)?\/?$/.test(path)
    || /^\/loja\/[a-z0-9-]+(?:\/produto\/[a-z0-9-]+)?\/?$/.test(path);
}

export function isPurchaseConfirmation(path: string) {
  return /^\/loja\/[a-z0-9-]+\/checkout\/sucesso\/[a-zA-Z0-9-]+\/?$/.test(path);
}

export function metricsPageContext(path: string, referrer: string, query = '') {
  let origin = '';
  try { const url = new URL(referrer); if (/^https?:$/.test(url.protocol)) origin = url.origin; } catch { /* No referrer is normal. */ }
  const campaign: Record<string, string> = {};
  const params = new URLSearchParams(query);
  for (const [key, field] of [['utm_source', 'campaign_source'], ['utm_medium', 'campaign_medium'], ['utm_campaign', 'campaign_name']]) {
    const value = params.get(key);
    if (value && /^[a-zA-Z][a-zA-Z0-9_. -]{0,79}$/.test(value) && !/\d{7,}/.test(value)) campaign[field] = value;
  }
  return { page_location: isMetricsPage(path) ? SITE + path : SITE, page_referrer: origin, page_title: 'Educalizando', ...campaign };
}

/** Separate destination and consent from each creator's optional tracking integrations. */
export function createPlatformMetrics(browser: () => TrackingBrowser) {
  let consent: MetricsConsent = null;
  let initialized = false;
  let lastPage = '';
  let context = metricsPageContext('/', '');
  const queue: { name: string; payload: Record<string, unknown> }[] = [];
  const transactions = new Set<string>();
  function flush() {
    if (consent !== 'accepted' || !initialized) return;
    while (queue.length) {
      const entry = queue[0];
      try {
        const gtag = browser().gtag;
        if (!gtag) return;
        gtag('event', entry.name, { ...entry.payload, send_to: PLATFORM_GA4_ID });
        queue.shift();
      } catch { return; }
    }
  }
  function enqueue(name: string, payload: Record<string, unknown>) {
    if (consent !== 'accepted') return;
    if (queue.length >= 30) queue.shift();
    queue.push({ name, payload }); flush();
  }
  return {
    consent(value: MetricsConsent) { consent = value; if (value !== 'accepted') { queue.length = 0; lastPage = ''; } flush(); },
    ready() { initialized = true; flush(); },
    page(path: string, referrer: string, query = '') {
      context = metricsPageContext(path, referrer, query);
      if (!isMetricsPage(path) || consent !== 'accepted' || lastPage === path) return;
      lastPage = path; enqueue('page_view', context);
    },
    event(value: unknown, path: string) {
      if (consent !== 'accepted' || (!isMetricsPage(path) && !isPurchaseConfirmation(path))) return;
      if (!value || typeof value !== 'object' || !('storeId' in value) || typeof value.storeId !== 'string') return;
      const event = cleanTrackingEvent(value, value.storeId);
      if (!event || (isPurchaseConfirmation(path) && event.event !== 'Purchase')) return;
      if (event.event === 'Purchase') {
        if (!Number.isFinite(event.value) || transactions.has(event.transactionId!)) return;
        transactions.add(event.transactionId!);
        if (transactions.size > 100) transactions.delete(transactions.values().next().value!);
      }
      // The confirmation producer already checks paid status. Never infer items or change payment processing.
      enqueue(names[event.event], { ...trackingPayload(event, 'google'), ...context, page_location: isMetricsPage(path) ? SITE + path : SITE });
    },
  };
}
