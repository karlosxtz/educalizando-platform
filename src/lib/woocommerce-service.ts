import 'server-only';

import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptWooSecret } from '@/lib/woocommerce-security';
import { mirrorWooDelivery,mirrorWooDescriptionMedia,mirrorWooPublicMedia } from '@/lib/woocommerce-media';
export { decryptWooSecret,encryptWooSecret,validWooSignature } from '@/lib/woocommerce-security';

export type WooCredentials = { siteUrl: string; consumerKey: string; consumerSecret: string };
export type WooProduct = { id: number; name: string; description?: string; short_description?: string; price?: string; regular_price?: string; status?: string; permalink?: string; stock_status?: string; stock_quantity?: number | null; images?: Array<{ src?: string }>; categories?: Array<{ id?: number; name?: string; slug?: string }>; tags?: Array<{ id?: number; name?: string; slug?: string }>; downloads?: Array<{ id?: string; name?: string; file?: string }>; meta_data?: Array<{ key?: string; value?: unknown }> };
type WooOrder = { id: number; status: string; currency?: string; total?: string; billing?: Record<string, string>; line_items?: unknown[]; date_created?: string; date_modified?: string };

function privateIp(ip: string) { return /^(127\.|10\.|0\.|169\.254\.|192\.168\.|::1$|fc|fd|fe80)/i.test(ip) || /^172\.(1[6-9]|2\d|3[01])\./.test(ip); }
export async function normalizeWooUrl(input: string) {
  const url = new URL(input.trim());
  if (url.protocol !== 'https:') throw new Error('A loja WooCommerce precisa usar HTTPS.');
  if (url.username || url.password || url.port) throw new Error('Informe somente o endereço principal da loja.');
  if (isIP(url.hostname) && privateIp(url.hostname)) throw new Error('Endereço de loja inválido.');
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(item => privateIp(item.address))) throw new Error('O endereço da loja não pode apontar para uma rede privada.');
  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
}

export async function wooRequest<T>(credentials: WooCredentials, path: string, init: RequestInit = {}): Promise<T> {
  const siteUrl = await normalizeWooUrl(credentials.siteUrl);
  const endpoint = new URL(`${siteUrl}/wp-json/wc/v3/${path.replace(/^\//, '')}`);
  const response = await fetch(endpoint, { ...init, headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Basic ${Buffer.from(`${credentials.consumerKey}:${credentials.consumerSecret}`).toString('base64')}`, ...init.headers }, signal: AbortSignal.timeout(20000), cache: 'no-store' });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message || `WooCommerce respondeu com erro ${response.status}.`);
  return payload as T;
}

export async function wooListAll<T>(credentials: WooCredentials, resource: string): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= 100; page++) {
    const separator = resource.includes('?') ? '&' : '?';
    const batch = await wooRequest<T[]>(credentials, `${resource}${separator}per_page=100&page=${page}`);
    items.push(...batch);
    if (batch.length < 100) break;
  }
  return items;
}

export function credentialsFromIntegration(row: any): WooCredentials { return { siteUrl: row.site_url, consumerKey: decryptWooSecret(row.consumer_key_encrypted), consumerSecret: decryptWooSecret(row.consumer_secret_encrypted) }; }
export async function testWooConnection(credentials: WooCredentials) { const system = await wooRequest<Array<{ environment?: { site_url?: string; version?: string } }>>(credentials, 'system_status'); return { connected: true, siteUrl: credentials.siteUrl, version: system?.[0]?.environment?.version || null }; }

export async function syncProductsToWoo(integration: any, origin: string) {
  const { data: products, error } = await supabaseAdmin.from('products').select('id,titulo,descricao,slug,preco,preco_original,capa_url,status').eq('store_id', integration.store_id).neq('status', 'excluido').is('excluido_em', null);
  if (error) throw error;
  let processed = 0, failed = 0;
  for (const product of products || []) {
    try {
      await pushProductToWoo(integration, product, origin);
      processed++;
    } catch { failed++; }
  }
  return { processed, failed };
}

async function pushProductToWoo(integration: any, product: any, origin: string) {
  const credentials = credentialsFromIntegration(integration);
  const { data: mapping } = await supabaseAdmin.from('woocommerce_product_mappings').select('woo_product_id').eq('integration_id', integration.id).eq('product_id', product.id).maybeSingle();
  const syncStartedAt = new Date().toISOString();
  const body = JSON.stringify({ name: product.titulo, type: 'external', status: product.status === 'publicado' ? 'publish' : 'draft', description: product.descricao || '', regular_price: String(product.preco_original || product.preco || 0), sale_price: product.preco_original ? String(product.preco || 0) : '', external_url: `${origin}/produto/${product.slug || product.id}`, button_text: 'Comprar na Educalizando', images: product.capa_url ? [{ src: product.capa_url }] : [], meta_data: [{ key: '_educalizando_product_id', value: product.id }, { key: '_educalizando_synced_at', value: syncStartedAt }] });
  const remote = mapping ? await wooRequest<WooProduct>(credentials, `products/${mapping.woo_product_id}`, { method: 'PUT', body }) : await wooRequest<WooProduct>(credentials, 'products', { method: 'POST', body });
  const { error } = await supabaseAdmin.from('woocommerce_product_mappings').upsert({ integration_id: integration.id, store_id: integration.store_id, product_id: product.id, woo_product_id: remote.id, woo_stock_status: remote.stock_status || 'instock', woo_stock_quantity: remote.stock_quantity ?? null, last_source: 'educalizando', last_synced_at: new Date().toISOString() }, { onConflict: 'integration_id,product_id' });
  if (error) throw error;
}

export async function syncSavedProductToWoo(storeId: string, productId: string, origin: string) {
  const [{ data: integration }, { data: product }] = await Promise.all([
    supabaseAdmin.from('woocommerce_integrations').select('*').eq('store_id', storeId).eq('status', 'active').eq('sync_products_to_woo', true).maybeSingle(),
    supabaseAdmin.from('products').select('id,titulo,descricao,slug,preco,preco_original,capa_url,status').eq('id', productId).eq('store_id', storeId).maybeSingle(),
  ]);
  if (!integration || !product) return false;
  await pushProductToWoo(integration, product, origin);
  return true;
}

export async function syncProductsFromWoo(integration: any) {
  const credentials = credentialsFromIntegration(integration);
  const remote = await wooListAll<WooProduct>(credentials, 'products?status=any');
  let processed = 0, failed = 0;
  for (const item of remote) {
    try {
      await importWooProduct(integration, item);
      processed++;
    } catch { failed++; }
  }
  return { processed, failed };
}

export async function listWooProductsForReview(integration: any) {
  const remote = await wooListAll<WooProduct>(credentialsFromIntegration(integration), 'products?status=any');
  const { data: mappings, error } = await supabaseAdmin.from('woocommerce_product_mappings').select('woo_product_id,product_id').eq('integration_id', integration.id);
  if (error) throw error;
  const mapped = new Map((mappings || []).map(item => [Number(item.woo_product_id), item.product_id]));
  return remote.map(item => ({
    id: item.id,
    name: item.name,
    price: Number(item.price || item.regular_price || 0),
    status: item.status || 'draft',
    image: item.images?.[0]?.src || null,
    stockStatus: item.stock_status || null,
    stockQuantity: item.stock_quantity ?? null,
    alreadyImported: mapped.has(item.id),
    localProductId: mapped.get(item.id) || null,
  }));
}

export async function importSelectedWooProducts(integration: any, productIds: number[]) {
  let processed = 0, failed = 0;
  for (const wooProductId of productIds) {
    try {
      const item = await wooRequest<WooProduct>(credentialsFromIntegration(integration), `products/${wooProductId}`);
      await importWooProduct(integration, item);
      processed++;
    } catch { failed++; }
  }
  return { processed, failed };
}

export async function hasWooProductMapping(integrationId: string, wooProductId: number) {
  const { data, error } = await supabaseAdmin.from('woocommerce_product_mappings').select('product_id').eq('integration_id', integrationId).eq('woo_product_id', wooProductId).maybeSingle();
  if (error) throw error;
  return Boolean(data?.product_id);
}

export async function importWooProduct(integration: any, item: WooProduct) {
  const { data: mapping, error: mappingError } = await supabaseAdmin.from('woocommerce_product_mappings').select('product_id').eq('integration_id', integration.id).eq('woo_product_id', item.id).maybeSingle();
  if (mappingError) throw mappingError;
  const { data: currentProduct, error: currentProductError } = mapping?.product_id
    ? await supabaseAdmin.from('products').select('preco,import_incomplete').eq('id', mapping.product_id).eq('store_id', integration.store_id).maybeSingle()
    : { data: null, error: null };
  if (currentProductError) throw currentProductError;
  const shouldRefreshContent = !mapping?.product_id || Boolean(currentProduct?.import_incomplete);
  const sourceLabels = [...(item.categories || []), ...(item.tags || [])].flatMap(entry => [entry.name, entry.slug]).filter((value): value is string => Boolean(value));
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const sourceKeys = new Set(sourceLabels.map(normalize));
  const [categoryResult, educationResult] = await Promise.all([
    supabaseAdmin.from('categories').select('id,nome,slug').or(`store_id.is.null,store_id.eq.${integration.store_id}`),
    supabaseAdmin.from('education_levels').select('id,nome,slug'),
  ]);
  if (categoryResult.error) throw categoryResult.error;
  if (educationResult.error) throw educationResult.error;
  const categories = categoryResult.data;
  const educationLevels = educationResult.data;
  const matchedCategories = (categories || []).filter(category => sourceKeys.has(normalize(category.slug || category.nome))).slice(0, 5);
  const matchedEducation = (educationLevels || []).filter(level => sourceKeys.has(normalize(level.slug || level.nome))).slice(0, 5);
  const wooPrice = Number(item.price || item.regular_price || 0);
  const gallery = shouldRefreshContent ? await Promise.all((item.images || []).map(image => image.src).filter((url): url is string => Boolean(url)).slice(0, 10).map(async (url, index) => (await mirrorWooPublicMedia(url, integration.id, item.id, index)).url)) : [];
  const rawDescription = item.description || item.short_description || '';
  const mirroredDescription = shouldRefreshContent && rawDescription ? await mirrorWooDescriptionMedia(rawDescription, integration.id, item.id) : rawDescription;
  const values = { store_id: integration.store_id, titulo: item.name.slice(0, 160), descricao: mirroredDescription || null, tipo: 'pdf', preco: Number.isFinite(wooPrice) ? wooPrice : 0, capa_url: gallery[0] || null, preview_url: item.permalink || null, category_id: matchedCategories[0]?.id || null, category_ids: matchedCategories.map(category => category.id), education_level_id: matchedEducation[0]?.id || null, education_level_ids: matchedEducation.map(level => level.id), tags: [...new Set(sourceLabels.map(label => label.trim()).filter(Boolean))].slice(0, 30), updated_at: new Date().toISOString() };
  let productId = mapping?.product_id;
  if (productId) {
    if (shouldRefreshContent) {
      const { error } = await supabaseAdmin.from('products').update(values).eq('id', productId).eq('store_id', integration.store_id);
      if (error) throw error;
    } else if (Number(currentProduct?.preco || 0) !== values.preco) {
      const { error } = await supabaseAdmin.from('products').update({ preco: values.preco, import_price_confirmed: false, import_incomplete: true, status: 'rascunho', updated_at: values.updated_at }).eq('id', productId).eq('store_id', integration.store_id);
      if (error) throw error;
    }
  } else {
    const { data, error } = await supabaseAdmin.from('products').insert({ ...values, status: 'rascunho', import_source: 'woocommerce', import_incomplete: true, import_price_confirmed: false, created_at: new Date().toISOString() }).select('id').single();
    if (error) throw error;
    productId = data.id;
  }
  if (shouldRefreshContent) {
    const { error: deleteImagesError } = await supabaseAdmin.from('product_images').delete().eq('product_id', productId);
    if (deleteImagesError) throw deleteImagesError;
    if (gallery.length) {
      const { error: imageError } = await supabaseAdmin.from('product_images').insert(gallery.map((url, ordem) => ({ product_id: productId, url, ordem })));
      if (imageError) throw imageError;
    }
    const deliveryFiles = await Promise.all((item.downloads || []).filter(download => download.file).slice(0, 10).map((download, index) => mirrorWooDelivery(download.file!, download.name || `Arquivo ${index + 1}`, integration.id, item.id, index)));
    if (deliveryFiles.length) {
      const { error: deliveryError } = await supabaseAdmin.from('product_deliveries').upsert({ product_id: productId, arquivo_url: deliveryFiles[0].url, arquivo_nome: deliveryFiles[0].name, updated_at: new Date().toISOString() }, { onConflict: 'product_id' });
      if (deliveryError) throw deliveryError;
      const { error: deleteDeliveryError } = await supabaseAdmin.from('product_delivery_files').delete().eq('product_id', productId).eq('delivery_type', 'original');
      if (deleteDeliveryError) throw deleteDeliveryError;
      const { error: deliveryFilesError } = await supabaseAdmin.from('product_delivery_files').insert(deliveryFiles.map((file, order_index) => ({ product_id: productId, delivery_type: 'original', file_url: file.url, file_name: file.name, file_size_bytes: file.size, mime_type: file.mimeType, order_index, updated_at: new Date().toISOString() })));
      if (deliveryFilesError) throw deliveryFilesError;
      const { error: deliveryFlagError } = await supabaseAdmin.from('products').update({ has_original_delivery: true }).eq('id', productId).eq('store_id', integration.store_id);
      if (deliveryFlagError) throw deliveryFlagError;
    }
  }
  const { error } = await supabaseAdmin.from('woocommerce_product_mappings').upsert({ integration_id: integration.id, store_id: integration.store_id, product_id: productId, woo_product_id: item.id, woo_stock_status: item.stock_status || null, woo_stock_quantity: item.stock_quantity ?? null, last_source: 'woocommerce', last_synced_at: new Date().toISOString() }, { onConflict: 'integration_id,woo_product_id' });
  if (error) throw error;
  return productId;
}

export async function isRecentEducalizandoProductEcho(integrationId: string, wooProductId: number, now = Date.now()) {
  const { data: mapping } = await supabaseAdmin.from('woocommerce_product_mappings').select('last_source,last_synced_at').eq('integration_id', integrationId).eq('woo_product_id', wooProductId).maybeSingle();
  if (mapping?.last_source !== 'educalizando' || !mapping.last_synced_at) return false;
  const age = now - new Date(mapping.last_synced_at).getTime();
  return age >= 0 && age < 120_000;
}

export async function archiveDeletedWooProduct(integration: any, wooProductId: number) {
  const { data: mapping } = await supabaseAdmin.from('woocommerce_product_mappings').select('product_id').eq('integration_id', integration.id).eq('woo_product_id', wooProductId).maybeSingle();
  if (!mapping?.product_id) return false;
  const { error } = await supabaseAdmin.from('products').update({ status: 'excluido', excluido_em: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', mapping.product_id).eq('store_id', integration.store_id);
  if (error) throw error;
  return true;
}

export async function saveWooOrder(integration: any, order: WooOrder) {
  const billing = order.billing || {};
  const { error } = await supabaseAdmin.from('woocommerce_orders').upsert({ integration_id: integration.id, store_id: integration.store_id, woo_order_id: order.id, status: order.status || 'pending', currency: order.currency || null, total: Number(order.total || 0), customer_name: `${billing.first_name || ''} ${billing.last_name || ''}`.trim() || null, customer_email: billing.email || null, customer_phone: billing.phone || null, line_items: order.line_items || [], raw_summary: { payment_method: (order as any).payment_method_title || null }, date_created: order.date_created || null, date_modified: order.date_modified || null, updated_at: new Date().toISOString() }, { onConflict: 'integration_id,woo_order_id' });
  if (error) throw error;
}
