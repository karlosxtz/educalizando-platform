import { supabase } from './supabase';
import { Product, Store } from './types';
import { getDeletedProductIds, getLocalProducts } from './product-local-storage';
import { isValidUUID } from './product-write-service';

export async function getProductsByStoreId(storeId: string): Promise<Product[]> {
  const cleanStoreId = (storeId || '').replace(/^store_/i, '');
  const deletedIds = getDeletedProductIds();
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  // Guard: se não há um UUID válido, não buscar no banco
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanStoreId);
  if (!isUUID) {
    console.warn('[getProductsByStoreId] store_id inválido ou vazio. Nenhum produto será carregado.', cleanStoreId);
    return [];
  }

  let mergedProducts: Product[] = [];

  // Fallback Local (Isolamento estrito por loja)
  if (typeof window !== 'undefined') {
    mergedProducts = getLocalProducts().filter(p => {
      if (!p.store_id) return false;
      if (p.excluido_em || p.status === 'excluido') return false;
      if (deletedIds.has(p.id) || deletedIds.has(p.id.replace(/^prod_/i, ''))) return false;
      
      const lpClean = p.store_id.replace(/^store_/i, '');
      return lpClean === cleanStoreId;
    });
  }

  if (isRealSupabase) {
    try {
      const query = supabase
        .from('products')
        .select('*')
        .eq('store_id', cleanStoreId)
        .is('excluido_em', null)
        .neq('status', 'excluido')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (!error && data) {
        const remote = (data as Product[]).filter(p => {
          if (!p.store_id) return false;
          if (p.excluido_em || p.status === 'excluido') return false;
          if (deletedIds.has(p.id) || deletedIds.has(p.id.replace(/^prod_/i, ''))) return false;
          return true;
        });

        const remoteIds = new Set(remote.map(p => p.id));
        for (const lp of mergedProducts) {
          if (!remoteIds.has(lp.id)) remote.push(lp);
        }
        return remote.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      }
    } catch (err) {
      console.error('[getProductsByStoreId] Erro Supabase:', err);
    }
  }

  // Se o supabase falhar, os locais já estão filtrados por store_id
  return mergedProducts;
}

// 5. Obter Produtos Públicos (Vitrine - status publicado/ativo e não excluído)
export async function getPublicProductsByStoreId(storeId: string): Promise<Product[]> {
  const cleanStoreId = (storeId || '').replace(/^store_/i, '');
  const deletedIds = getDeletedProductIds();
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  // Fallback Local (for dev/mock mode only)
  if (!isRealSupabase) {
    const mergedProducts: Product[] = typeof window !== 'undefined' ? getLocalProducts() : [];
    return mergedProducts.filter((p: Product) => {
      if (p.excluido_em || p.status === 'excluido') return false;
      if (deletedIds.has(p.id) || deletedIds.has(p.id.replace(/^prod_/i, ''))) return false;
      const statusStr = (p.status as string) || '';
      const isPublished = statusStr === 'publicado' || statusStr === 'published' || statusStr === 'ativo';
      if (!isPublished) return false;
      const lpClean = p.store_id ? p.store_id.replace(/^store_/i, '') : '';
      return lpClean === cleanStoreId;
    });
  }

  try {
    // --- Step 1: Use strictly the requested store ID ---
    // Use supabase for public reads (RLS must allow public reads)
    const db = supabase;
    const validStoreId = cleanStoreId;

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(validStoreId)) {
       return [];
    }

    const { data: storeInfo } = await db
      .from('stores')
      .select('id, creator_id')
      .eq('id', validStoreId)
      .maybeSingle();

    console.log('[getPublicProductsByStoreId] cleanStoreId:', validStoreId);

    // Containers for aggregating public products and tracking IDs
    const allProducts: Product[] = [];
    const ownProductIds = new Set<string>();

    // --- Step 2: Fetch published products for THIS store ---
    const { data: ownProducts, error: ownError } = await db
      .from('products')
      .select('*')
      .eq('store_id', validStoreId)
      .in('status', ['publicado', 'ativo', 'published'])
      .is('excluido_em', null)
      .order('created_at', { ascending: false });

    if (ownProducts && Array.isArray(ownProducts)) {
      console.log(`[getPublicProductsByStoreId] Query retornou ${ownProducts.length} produto(s) publicado(s)`);
      for (const p of ownProducts as Product[]) {
        if (!ownProductIds.has(p.id)) {
          allProducts.push(p);
          ownProductIds.add(p.id);
          console.log(`[getPublicProductsByStoreId] Produto encontrado: id=${p.id}, titulo="${p.titulo}", status="${p.status}", store_id="${p.store_id}"`);
        }
      }
    } else {
      console.warn('[getPublicProductsByStoreId] Query retornou null/undefined para ownProducts');
    }

    if (ownError) {
      console.error('[getPublicProductsByStoreId] Erro ao buscar produtos próprios:', ownError.message, ownError);
    }

    // --- Step 3: Fetch approved affiliate products if creator has affiliations ---
    if (storeInfo?.creator_id) {
      const { data: affiliations } = await db
        .from('affiliates')
        .select('store_id, product_id')
        .eq('user_id', storeInfo.creator_id)
        .eq('status', 'aprovado');

      if (affiliations && affiliations.length > 0) {
        const pIds = affiliations.filter(a => a.product_id).map(a => a.product_id);
        const sIds = affiliations.filter(a => !a.product_id && a.store_id).map(a => a.store_id);

        if (pIds.length > 0 || sIds.length > 0) {
          let affQuery = db
            .from('products')
            .select('*')
            .in('status', ['publicado', 'ativo', 'published'])
            .is('excluido_em', null);

          if (pIds.length > 0 && sIds.length > 0) {
            affQuery = affQuery.or(`store_id.in.(${sIds.join(',')}),id.in.(${pIds.join(',')})`);
          } else if (sIds.length > 0) {
            affQuery = affQuery.in('store_id', sIds);
          } else {
            affQuery = affQuery.in('id', pIds);
          }

          const { data: affData } = await affQuery;
          if (affData) {
            for (const p of affData as Product[]) {
              if (!ownProductIds.has(p.id)) {
                allProducts.push(p);
                ownProductIds.add(p.id);
              }
            }
          }
        }
      }
    }

    // --- Step 4: Enrich with review data and gallery images ---
    const productIds = allProducts.map((product) => product.id);
    const [{ data: reviewsData }, { data: imagesData }] = await Promise.all([
      db
        .from('reviews')
        .select('product_id, nota')
        .eq('store_id', validStoreId)
        .eq('status', 'aprovado'),
      productIds.length > 0
        ? db.from('product_images').select('id, product_id, url, ordem, created_at').in('product_id', productIds).order('ordem', { ascending: true })
        : Promise.resolve({ data: [] as { id: string; product_id: string; url: string; ordem: number; created_at: string }[] }),
    ]);

    const imagesByProductId = new Map<string, NonNullable<Product['images']>>();
    (imagesData || []).forEach((image) => {
      const images = imagesByProductId.get(image.product_id) || [];
      images.push(image);
      imagesByProductId.set(image.product_id, images);
    });

    console.log('[getPublicProductsByStoreId] total products before filter:', allProducts.length);
    return allProducts
      .filter(p => !deletedIds.has(p.id) && !deletedIds.has(p.id.replace(/^prod_/i, '')))
      .map(p => {
        p.images = imagesByProductId.get(p.id) || p.images || [];
        if (reviewsData && reviewsData.length > 0) {
          const productReviews = reviewsData.filter(r => r.product_id === p.id);
          if (productReviews.length > 0) {
            const sum = productReviews.reduce((acc, r) => acc + r.nota, 0);
            p.review_count = productReviews.length;
            p.average_rating = Number((sum / productReviews.length).toFixed(1));
          }
        }
        return p;
      })
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  } catch (err) {
    console.error('[getPublicProductsByStoreId] Erro ao buscar produtos públicos:', err);
    return [];
  }
}


export async function getProductById(productIdOrSlug: string): Promise<Product | null> {
  if (!productIdOrSlug) return null;

  const cleanId = productIdOrSlug.replace(/^prod_/i, '');
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  const isUUID = isValidUUID(productIdOrSlug) || isValidUUID(cleanId);

  // Para o painel do proprietário, a API autenticada devolve também os caminhos
  // privados de entrega. Visitantes seguem recebendo apenas metadados públicos.
  if (typeof window !== 'undefined' && isUUID) {
    try {
      const targetId = isValidUUID(productIdOrSlug) ? productIdOrSlug : cleanId;
      const response = await fetch(`/api/produtos?id=${encodeURIComponent(targetId)}`);
      if (response.ok) {
        const result = await response.json();
        const product = result.product;
        if (product?.images && Array.isArray(product.images)) product.images.sort((a: any, b: any) => a.ordem - b.ordem);
        if (product?.bncc_skills && Array.isArray(product.bncc_skills)) {
          product.bncc_skill_ids = product.bncc_skills.map((item: any) => item.bncc_skill_id);
          delete product.bncc_skills;
        }
        return product as Product;
      }
    } catch {}
  }

  if (isRealSupabase) {
    try {
      let query = supabase
        .from('products')
        .select('*, images:product_images(*), bncc_skills:product_bncc_skills(bncc_skill_id)')
        .is('excluido_em', null);

      if (isUUID) {
        const targetId = isValidUUID(productIdOrSlug) ? productIdOrSlug : cleanId;
        query = query.eq('id', targetId);
      } else {
        query = query.eq('slug', productIdOrSlug);
      }

      const { data, error } = await query.maybeSingle();

      if (!error && data) {
        if (data.excluido_em || data.status === 'excluido') return null;
        if (data.images && Array.isArray(data.images)) {
          data.images.sort((a: any, b: any) => a.ordem - b.ordem);
        }
        if (data.bncc_skills && Array.isArray(data.bncc_skills)) {
          data.bncc_skill_ids = data.bncc_skills.map((item: any) => item.bncc_skill_id);
          delete data.bncc_skills;
        }
        return data as Product;
      }
    } catch (err) {
      console.error('[getProductById] Erro:', err);
    }
  }

  // Fallback Local
  const products = getLocalProducts();
  const found = products.find(p => p.id === productIdOrSlug || p.id === cleanId || p.id === `prod_${productIdOrSlug}` || p.slug === productIdOrSlug) || null;
  if (found && (found.excluido_em || found.status === 'excluido')) return null;
  return found;
}

// 11. Obter Produtos do Marketplace de PLR
export async function getPlrMarketplaceProducts(): Promise<(Product & { store?: Store })[]> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          store:stores (
            id, nome_loja, slug, logo_url
          )
        `)
        .eq('is_plr', true)
        .gt('preco_plr', 0)
        .eq('has_plr_delivery', true)
        .eq('status', 'publicado')
        .is('excluido_em', null)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as (Product & { store?: Store })[];
      }
    } catch (err) {
      console.error('[getPlrMarketplaceProducts] Erro:', err);
    }
  }

  // Fallback Local (Se estiver sem backend ou o backend falhar)
  const products = getLocalProducts();
  const plrProducts = products.filter(p => 
    p.is_plr === true && 
    Number(p.preco_plr || 0) > 0 &&
    Boolean(p.has_plr_delivery || p.plr_license_url) &&
    p.status === 'publicado' && 
    !p.excluido_em
  );
  return plrProducts as (Product & { store?: Store })[];
}

// ============================================================================
// BRINDES (PRODUTOS GRATUITOS)
// ============================================================================

export async function getAllFreeProducts(): Promise<(Product & { store?: Store })[]> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          store:stores (
            id, nome_loja, slug, logo_url
          )
        `)
        .eq('is_free', true)
        .eq('status', 'publicado')
        .is('excluido_em', null)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as (Product & { store?: Store })[];
      }
    } catch (err) {
      console.error('[getAllFreeProducts] Erro:', err);
    }
  }

  // Fallback Local
  const products = getLocalProducts();
  const freeProducts = products.filter(p => 
    p.is_free === true && 
    p.status === 'publicado' && 
    !p.excluido_em
  );
  return freeProducts as (Product & { store?: Store })[];
}

export async function getAllPublicMarketplaceProducts(limit: number = 50): Promise<(Product & { store?: Store })[]> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id')
  );

  if (isRealSupabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          store:stores (
            id, nome_loja, slug, logo_url
          )
        `)
        .eq('status', 'publicado')
        .is('excluido_em', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data) {
        return data as (Product & { store?: Store })[];
      }
    } catch (err) {
      console.error('[getAllPublicMarketplaceProducts] Erro:', err);
    }
  }

  // Fallback Local
  const products = getLocalProducts();
  const publicProducts = products.filter(p => 
    p.status === 'publicado' && 
    !p.excluido_em
  ).slice(0, limit);
  return publicProducts as (Product & { store?: Store })[];
}

export async function incrementProductViews(productId: string): Promise<void> {
  if (!productId || typeof window === 'undefined') return;
  try {
    await supabase.rpc('increment_product_views', { p_product_id: productId });
  } catch (err) {
    console.error('[incrementProductViews] Falha ao incrementar views:', err);
  }
}
