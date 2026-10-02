import { generateSlug } from '@/lib/string-utils';
import { supabaseAdmin } from '@/lib/supabase';

export const PRODUCT_TYPES = new Set(['pdf', 'ebook', 'video', 'curso', 'simulado']);
export const PRODUCT_STATUSES = new Set(['rascunho', 'publicado']);

export function isValidProductPrice(value: unknown) {
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 && price <= 100000;
}

export function isValidAffiliateRate(value: unknown) {
  const rate = Number(value);
  return Number.isFinite(rate) && rate >= 0 && rate <= 80;
}

export function normalizePreviewUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;

  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function normalizeInstagramVideoUrl(value: unknown): string | null {
  const normalized = normalizePreviewUrl(value);
  if (!normalized) return null;
  const url = new URL(normalized);
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const isInstagram = host === 'instagram.com' || host === 'instagr.am';
  const hasPublicPostPath = /^\/(reel|reels|p|tv)\//i.test(url.pathname);
  return isInstagram && hasPublicPostPath ? normalized : null;
}

export const isValidUUID = (str: string | null | undefined): boolean => {
  if (!str) return false;
  const clean = str.replace(/^store_/i, '');
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
};

export const sanitizeUUID = (str: string | null | undefined): string | null => {
  if (!str) return null;
  const clean = str.replace(/^store_/i, '');
  return isValidUUID(clean) ? clean : null;
};

export const sanitizeUUIDList = (value: unknown, primary?: unknown): string[] => {
  const candidates = Array.isArray(value) ? value : primary ? [primary] : [];
  return Array.from(new Set(candidates
    .map(item => sanitizeUUID(typeof item === 'string' ? item : null))
    .filter((item): item is string => Boolean(item))))
    .slice(0, 5);
};

export async function uniqueProductSlug(title: string, excludeId?: string) {
  const base = generateSlug(title).slice(0, 110) || 'produto';
  const { data } = await supabaseAdmin.from('products').select('id, slug').ilike('slug', `${base}%`);
  const used = new Set((data || []).filter(product => product.id !== excludeId).map(product => product.slug).filter(Boolean));
  if (!used.has(base)) return base;
  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

