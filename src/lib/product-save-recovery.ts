import type { Product } from './types';

/** Only confirm success after the database contains both the product and its expected deliveries. */
export function completedProductSave(product: Product | null, expected: { store_id: string; status?: string; arquivo_url?: string | null; plr_license_url?: string | null; delivery_files?: Array<{ url: string }>; plr_delivery_files?: Array<{ url: string }> }, files: Array<{ delivery_type: string; file_url: string }>): boolean {
  if (!product || product.store_id !== expected.store_id) return false;
  if (expected.status && product.status !== expected.status) return false;
  const original = expected.delivery_files?.length ? expected.delivery_files : expected.arquivo_url ? [{ url: expected.arquivo_url }] : [];
  const plr = expected.plr_delivery_files?.length ? expected.plr_delivery_files : expected.plr_license_url ? [{ url: expected.plr_license_url }] : [];
  return original.every(file => files.some(saved => saved.delivery_type === 'original' && saved.file_url === file.url))
    && plr.every(file => files.some(saved => saved.delivery_type === 'plr' && saved.file_url === file.url));
}
