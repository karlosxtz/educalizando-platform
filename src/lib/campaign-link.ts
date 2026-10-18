import { publicStoreUrl } from './public-links';
export const CAMPAIGN_SOURCES = ['instagram', 'pinterest', 'facebook', 'whatsapp', 'email', 'google', 'tiktok'] as const;
export const CAMPAIGN_MEDIA = ['social', 'paid_social', 'cpc', 'email', 'messaging'] as const;
export function creatorCampaignLink(slug: string, source: string, medium: string, campaign: string): string | null {
  const name = campaign.trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 100);
  if (!slug.trim() || !CAMPAIGN_SOURCES.some(value => value === source) || !CAMPAIGN_MEDIA.some(value => value === medium) || !name) return null;
  const url = new URL(publicStoreUrl(slug));
  url.searchParams.set('utm_source', source); url.searchParams.set('utm_medium', medium); url.searchParams.set('utm_campaign', name);
  return url.href;
}
