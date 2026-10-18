import { cleanCheckoutAttribution } from './store-webhook-contract';

/** Attribution is evidence, not a guess. No UTM does not mean organic or direct. */
export function orderOrigin(value: unknown) {
  const tracking = cleanCheckoutAttribution(value);
  const source = (tracking.utm_source || '').toLowerCase();
  const medium = (tracking.utm_medium || '').toLowerCase();
  const knownSource = source === 'google' ? 'Google' : ['facebook', 'instagram', 'meta'].includes(source) ? 'Meta / Instagram' : source === 'pinterest' ? 'Pinterest' : source === 'tiktok' ? 'TikTok' : 'Campanha';
  if (tracking.gclid) return { channel: 'google_ads', label: 'Google Ads', evidence: 'Identificador de clique do Google registrado no pedido.' };
  if (tracking.ttclid) return { channel: 'tiktok', label: 'TikTok', evidence: 'Identificador de clique do TikTok registrado. Confira a campanha para atribuir a venda.' };
  if (source && ['cpc', 'ppc', 'paid', 'paid_social', 'paid_search', 'display', 'cpm'].includes(medium)) return { channel: 'paid_campaign', label: `${knownSource} · campanha paga`, evidence: 'Origem e mídia declaradas nos parâmetros UTM do link.' };
  if (source === 'google' && medium === 'organic') return { channel: 'declared_organic', label: 'Google orgânico · declarado', evidence: 'O link informa google / organic em UTM. Isso não é confirmação independente do Analytics.' };
  if (source || medium) return { channel: 'tagged_campaign', label: `${knownSource} · link identificado`, evidence: 'Parâmetros UTM registrados. A classificação depende da marcação correta do link.' };
  if (tracking.fbclid) return { channel: 'meta_click', label: 'Meta · clique identificado', evidence: 'Identificador de clique registrado. Ele sozinho não distingue anúncio de publicação orgânica.' };
  return { channel: 'unknown', label: 'Origem não identificada', evidence: 'Sem informação suficiente neste pedido. Não classifique como Google orgânico nem como acesso direto.' };
}

export function orderOriginDayRange(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const start = new Date(`${value}T00:00:00-03:00`);
  if (!Number.isFinite(start.getTime()) || new Date(start.getTime() - 3 * 3600000).toISOString().slice(0, 10) !== value) return null;
  return { start: start.toISOString(), end: new Date(start.getTime() + 86400000).toISOString() };
}
