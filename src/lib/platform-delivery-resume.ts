import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Check private provenance before downloading anything. Never replace manual deliveries. */
export async function importedDeliveryPresent(db: Pick<SupabaseClient, 'from'>, storeId: string, productId: string, fileId: string, index: number) {
  const [files, receipts, legacy] = await Promise.all([
    db.from('product_delivery_files').select('id,file_url,order_index').eq('product_id', productId).eq('delivery_type', 'original').limit(101),
    db.from('platform_import_delivery_receipts').select('file_id,target_url,delivery_index').eq('store_id', storeId).eq('product_id', productId).limit(101),
    db.from('product_deliveries').select('arquivo_url').eq('product_id', productId).maybeSingle(),
  ]);
  if (files.error || receipts.error || legacy.error) throw new Error('Não foi possível conferir os arquivos já importados. Retome para tentar novamente.');
  const saved = files.data || [], recorded = receipts.data || [];
  const changed = () => new Error('O produto possui entregas alteradas ou adicionadas manualmente. Os arquivos foram preservados; revise o cadastro.');
  if (saved.length > 100 || recorded.length > 100) throw changed();
  if (saved.some(file => !recorded.some(receipt => receipt.file_id === file.id && receipt.target_url === file.file_url && receipt.delivery_index === file.order_index))) throw changed();
  if (recorded.some(receipt => !saved.some(file => receipt.file_id === file.id && receipt.target_url === file.file_url && receipt.delivery_index === file.order_index))) throw changed();
  const primaryUrl = legacy.data?.arquivo_url;
  if (primaryUrl && !recorded.some(receipt => receipt.delivery_index === 0 && receipt.target_url === primaryUrl)) throw changed();
  const prior = recorded.find(receipt => receipt.delivery_index === index);
  if (!prior) return false;
  if (prior.file_id !== fileId) throw changed();
  return true;
}
