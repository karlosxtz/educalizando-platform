/** Only profile URLs are accepted: posts, redirects and other hosts are not accounts. */
export function instagramCommunityHandle(input: unknown): string | null {
  if (typeof input !== 'string' || input.length > 250) return null;
  let value = input.trim();
  if (/^(?:https?:\/\/|www\.|instagram\.com\/)/i.test(value)) {
    try {
      const url = new URL(/^https?:\/\//i.test(value) ? value : 'https://' + value);
      if (url.protocol !== 'https:' || !['instagram.com', 'www.instagram.com'].includes(url.hostname) || url.username || url.password || url.port) return null;
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments.length !== 1) return null;
      value = segments[0];
    } catch { return null; }
  }
  value = value.replace(/^@/, '').replace(/\/$/, '').toLowerCase();
  if (!/^[a-z0-9_](?:[a-z0-9._]{0,28}[a-z0-9_])?$/.test(value) || value.includes('..') || ['p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'direct', 'about', 'developer'].includes(value)) return null;
  return value;
}
export const instagramCommunityUrl = (handle: string) => 'https://www.instagram.com/' + encodeURIComponent(handle) + '/';
export type InstagramCommunityCard = { id: string; name: string; slug: string; description: string; logo: string | null; banner: string | null; handle: string; url: string };
export type InstagramCommunityProfile = { available: boolean; photo: string | null; followers: number | null; mediaCount: number | null; checkedAt: string | null };

export function instagramCommunityCard(store: { id: string; nome_loja: string; slug: string; descricao?: string | null; logo_url?: string | null; banner_url?: string | null; instagram?: string | null }): InstagramCommunityCard | null {
  const handle = instagramCommunityHandle(store.instagram);
  if (!handle) return null;
  return { id: store.id, name: store.nome_loja, slug: store.slug, description: store.descricao || '', logo: store.logo_url || null, banner: store.banner_url || null, handle, url: instagramCommunityUrl(handle) };
}
/** Rotate discovery daily without buying placement or ranking by audience size. */
export function instagramCommunityOrder(id: string, day: string): number {
  let hash = 2166136261;
  for (const character of day + ':' + id) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0;
}
export function instagramCommunityCount(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
}
export function instagramCommunityPhoto(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 4096) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && ['cdninstagram.com', 'fbcdn.net'].some(host => url.hostname === host || url.hostname.endsWith('.' + host)) ? url.href : null;
  } catch { return null; }
}
