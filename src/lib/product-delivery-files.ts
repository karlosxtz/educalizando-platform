import { ProductDeliveryFile } from '@/lib/types';

export const MAX_DELIVERY_FILE_BYTES = 15 * 1024 * 1024;

export function normalizeDeliveryFiles(value: unknown): ProductDeliveryFile[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const row = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    return {
      url: typeof row.url === 'string' ? row.url.trim() : '',
      name: typeof row.name === 'string' ? row.name.trim().slice(0, 240) : `Arquivo ${index + 1}`,
      size: typeof row.size === 'number' && Number.isFinite(row.size) ? Math.max(0, Math.round(row.size)) : null,
      mimeType: typeof row.mimeType === 'string' ? row.mimeType.trim().slice(0, 160) : null,
      orderIndex: index,
    };
  }).filter((file) => file.url && file.name);
}

export function validateDeliveryFiles(files: ProductDeliveryFile[]) {
  const oversized = files.find((file) => typeof file.size === 'number' && file.size > MAX_DELIVERY_FILE_BYTES);
  if (oversized) throw new Error(`O arquivo ${oversized.name} ultrapassa o limite de 15 MB.`);
}

export function deliveryRows(productId: string, type: 'original' | 'plr', files: ProductDeliveryFile[]) {
  return files.map((file, index) => ({
    product_id: productId,
    delivery_type: type,
    file_url: file.url,
    file_name: file.name,
    file_size_bytes: file.size ?? null,
    mime_type: file.mimeType || null,
    order_index: index,
    updated_at: new Date().toISOString(),
  }));
}
