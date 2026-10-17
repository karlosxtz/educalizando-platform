import 'server-only';
import { supabase } from './supabase';
import { shortSeoTitle } from './page-seo';
import type { Product, Store } from './types';

/** Disambiguate actual duplicate/truncated titles without renaming a product or its URL. */
export async function readSeoProductReference(product: Product, storefront?: Pick<Store, 'nome_loja'>) {
  try {
  const suffix = storefront ? ' | Loja ' + storefront.nome_loja.slice(0, 15) : ' | Educalizando';
  const title = shortSeoTitle(product.titulo, suffix);
  const prefix = product.titulo.trim().slice(0, 24).replace(/[\\%_]/g, value => '\\' + value);
  const { data, error } = await supabase.from('products').select('id,titulo')
    .in('status', ['publicado', 'ativo', 'published']).is('excluido_em', null)
    .neq('id', product.id).ilike('titulo', prefix + '%').limit(1000);
  return error || data?.length === 1000 || data?.some(item => shortSeoTitle(item.titulo, suffix) === title)
    ? product.id.slice(0, 8) : undefined;
  } catch { return product.id.slice(0, 8); }
}

export async function readSeoStoreHandle(store: Pick<Store, 'id' | 'nome_loja' | 'slug'>) {
  try {
  const { data, error } = await supabase.from('stores').select('id')
    .eq('nome_loja', store.nome_loja).neq('id', store.id).limit(1);
  return error || data?.length ? store.slug : undefined;
  } catch { return store.slug; }
}
