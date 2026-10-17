import type { MarketplaceKit } from './marketplace-kit-service';
import type { Product, Store } from './types';
import { normalizePublicAssetUrl } from './public-links';

/** Only display data crosses the homepage's client component boundaries.
 * Detail pages and checkout continue loading their complete records separately. */
export function homepageProduct(product: Product & { store?: Store }): Product & { store?: Store } {
  return {
    id: product.id, store_id: product.store_id, titulo: product.titulo,
    slug: product.slug, tipo: product.tipo, preco: product.preco,
    preco_original: product.preco_original, capa_url: normalizePublicAssetUrl(product.capa_url),
    status: product.status, created_at: product.created_at,
    is_free: product.is_free, is_plr: product.is_plr,
    preco_plr: product.preco_plr, has_plr_delivery: product.has_plr_delivery,
    seasonal_tags: product.seasonal_tags,
    category: product.category, education_level: product.education_level,
    store: product.store ? homepageStore(product.store) : undefined,
    descricao: null, arquivo_url: null,
  };
}

export function homepageStore(store: Store): Store {
  return {
    id: store.id, creator_id: store.creator_id, nome_loja: store.nome_loja,
    slug: store.slug, logo_url: normalizePublicAssetUrl(store.logo_url), banner_url: normalizePublicAssetUrl(store.banner_url),
    cor_primaria: store.cor_primaria, created_at: store.created_at,
    descricao: null, asaas_subaccount_id: null,
  };
}

export function homepageKit(kit: MarketplaceKit): MarketplaceKit {
  return {
    id: kit.id, store_id: kit.store_id, titulo: kit.titulo,
    descricao: kit.descricao, capa_url: kit.capa_url, preco_kit: kit.preco_kit,
    status: kit.status, created_at: kit.created_at,
    products: kit.products?.map(homepageProduct),
    store: kit.store ? homepageStore(kit.store) : undefined,
  };
}
