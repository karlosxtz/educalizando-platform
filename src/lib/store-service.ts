import { supabase, supabaseAdmin } from './supabase';
import { Store, Product } from './types';

// Store Padrão de Exemplo para Fallback Offline
export const DEFAULT_MOCK_STORE: Store = {
  id: 'store-demo',
  creator_id: 'creator-demo',
  nome_loja: 'Minha Loja de Infoprodutos',
  slug: 'minha-loja',
  descricao: 'Apostilas esquematizadas, e-books interativos e simulados preparatórios.',
  logo_url: null,
  banner_url: null,
  cor_primaria: '#2563eb',
  asaas_subaccount_id: null,
  created_at: new Date().toISOString()
};

// Helper para localStorage
function getLocalStores(): Store[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('educalizando_stores_v3');
  if (!saved) {
    return [];
  }
  return JSON.parse(saved);
}

function saveLocalStores(stores: Store[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('educalizando_stores_v3', JSON.stringify(stores));
  }
}

function getDeletedProductIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const saved = localStorage.getItem('educalizando_deleted_products_v1');
    if (saved) {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (e) {}
  return new Set();
}

function addDeletedProductId(id: string) {
  if (typeof window === 'undefined' || !id) return;
  try {
    const clean = id.replace(/^prod_/i, '');
    const set = getDeletedProductIds();
    set.add(id);
    set.add(clean);
    set.add(`prod_${clean}`);
    localStorage.setItem('educalizando_deleted_products_v1', JSON.stringify(Array.from(set)));
  } catch (e) {}
}

function removeDeletedProductId(id: string) {
  if (typeof window === 'undefined' || !id) return;
  try {
    const clean = id.replace(/^prod_/i, '');
    const set = getDeletedProductIds();
    set.delete(id);
    set.delete(clean);
    set.delete(`prod_${clean}`);
    localStorage.setItem('educalizando_deleted_products_v1', JSON.stringify(Array.from(set)));
  } catch (e) {}
}

function getLocalProducts(): Product[] {
  if (typeof window === 'undefined') return [];
  const deletedIds = getDeletedProductIds();
  const saved = localStorage.getItem('educalizando_products_v3');
  if (!saved) return [];
  try {
    const prods: Product[] = JSON.parse(saved);
    return Array.isArray(prods) ? prods.filter(p => !deletedIds.has(p.id) && !deletedIds.has(p.id.replace(/^prod_/i, ''))) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalProducts(products: Product[]) {
  if (typeof window !== 'undefined') {
    const deletedIds = getDeletedProductIds();
    const cleanList = products.filter(p => !deletedIds.has(p.id) && !deletedIds.has(p.id.replace(/^prod_/i, '')));
    localStorage.setItem('educalizando_products_v3', JSON.stringify(cleanList));
  }
}

// 1. Obter Loja por Slug em Tempo Real
export async function getStoreBySlug(slug: string): Promise<Store | null> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      // Use supabaseAdmin to bypass RLS on server-side (public store page)
      const { data, error } = await supabaseAdmin
        .from('stores')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (!error && data) {
        return data as Store;
      }
      if (error) {
        console.warn(`[getStoreBySlug] Erro ao consultar slug "${slug}":`, error.message);
      }
    } catch (err) {
      console.error(`[getStoreBySlug] Exceção na busca de "${slug}":`, err);
    }
  }

  // Fallback Local
  const stores = getLocalStores();
  const found = stores.find(s => s.slug === slug);
  if (found) return found;

  if (slug === 'minha-loja' || slug === 'prof-ricardo') {
    return DEFAULT_MOCK_STORE;
  }

  return null;
}

// 2. Obter a Loja do Criador Atualmente Autenticado (100% Dinâmico por Usuário Logado)
export async function getCurrentCreatorStore(): Promise<Store> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser?.user) {
        const userId = authUser.user.id;
        const userEmail = (authUser.user.email || '').toLowerCase().trim();
        const userMeta = authUser.user.user_metadata || {};

        // Buscar loja existente — NÃO criar automaticamente
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('*')
          .eq('creator_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (storeError) {
          console.error('[getCurrentCreatorStore] Supabase query error:', storeError.message);
        }

        if (storeData) {
          if (storeData.nome_loja && storeData.nome_loja.includes('@')) {
            const cleanName = userMeta.full_name ? `Loja de ${userMeta.full_name}` : 'Minha Loja';
            storeData.nome_loja = cleanName;
          }
          return storeData as Store;
        }

        // Se NÃO tem loja, retornar um placeholder sem gravar no banco.
        // Isso evita que afiliados virem criadores phantom no F5.
        return {
          id: '',
          creator_id: userId,
          nome_loja: userMeta.full_name || 'Usuário',
          slug: '',
          descricao: '',
          logo_url: null,
          banner_url: null,
          cor_primaria: '#093b6c',
          asaas_subaccount_id: null,
          created_at: new Date().toISOString()
        };
      }
    } catch (err) {
      console.error('[getCurrentCreatorStore] Erro:', err);
    }
  }

  // Tentar buscar a sessão gravada no localStorage para o criador logado
  if (typeof window !== 'undefined') {
    const rawCreatorSession = localStorage.getItem('educalizando_creator_session');
    if (rawCreatorSession) {
      try {
        const session = JSON.parse(rawCreatorSession);
        const stores = getLocalStores();
        const found = stores.find(s => s.creator_id === session.id || s.id === session.storeId || s.slug === session.storeSlug);
        if (found) return found;

        // Se a sessão local existe mas a loja ainda não foi salva no array local:
        const newLocalStore: Store = {
          id: session.storeId || `store_${session.id || Date.now()}`,
          creator_id: session.id || 'creator-active',
          nome_loja: session.storeName || session.fullName || 'Minha Loja',
          slug: session.storeSlug || 'loja',
          descricao: `Loja oficial de infoprodutos de ${session.fullName || 'Criador'}.`,
          logo_url: null,
          banner_url: null,
          cor_primaria: '#093b6c',
          asaas_subaccount_id: null,
          created_at: new Date().toISOString()
        };
        stores.push(newLocalStore);
        saveLocalStores(stores);
        return newLocalStore;
      } catch (e) {}
    }
  }

  // Se o usuário é um novo criador sem sessão configurada ainda
  return {
    id: 'store-active-user',
    creator_id: 'creator-active-user',
    nome_loja: 'Minha Loja',
    slug: 'minha-loja',
    descricao: 'Cadastre seus produtos e comece a vender no Educalizando.',
    logo_url: null,
    banner_url: null,
    cor_primaria: '#093b6c',
    asaas_subaccount_id: null,
    created_at: new Date().toISOString()
  };
}

export async function getStoreByCreatorId(creatorId: string): Promise<Store> {
  if (!creatorId || creatorId === 'creator-ricardo' || creatorId === 'creator-demo') {
    return getCurrentCreatorStore();
  }
  
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const { data } = await supabase
        .from('stores')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) return data as Store;
    } catch (err) {
      console.error('[getStoreByCreatorId] Erro:', err);
    }
  }

  return getCurrentCreatorStore();
}

// 3. Atualizar Dados da Loja
export async function updateStore(storeId: string, updates: Partial<Store>): Promise<Store> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    if (!storeId || storeId === '' || storeId.startsWith('store_')) {
      // Significa que o usuário ainda não tem uma loja real no banco de dados.
      // Vamos criar a loja para ele.
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error("Usuário não autenticado para criar loja.");
      
      const { data, error } = await supabase
        .from('stores')
        .insert({
          creator_id: userData.user.id,
          nome_loja: updates.nome_loja || 'Minha Loja',
          slug: updates.slug || `loja-${Date.now()}`,
          ...updates
        })
        .select()
        .single();
        
      if (error) throw new Error(error.message);
      return data as Store;
    }

    const { data, error } = await supabase
      .from('stores')
      .update(updates)
      .eq('id', storeId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Store;
  }

  // Fallback Local
  const stores = getLocalStores();
  const index = stores.findIndex(s => s.id === storeId);
  const updatedStore = {
    ...(stores[index] || DEFAULT_MOCK_STORE),
    ...updates,
    updated_at: new Date().toISOString()
  };

  if (index >= 0) stores[index] = updatedStore;
  else stores.push(updatedStore);

  saveLocalStores(stores);
  return updatedStore;
}

// 4. Obter Produtos da Loja (Dashboard)
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
      let query = supabase
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
    // Use supabaseAdmin to bypass RLS for server-side public reads
    const db = supabaseAdmin;
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

    // --- Step 4: Enrich with review data ---
    const { data: reviewsData } = await db
      .from('reviews')
      .select('product_id, nota')
      .eq('store_id', validStoreId);

    console.log('[getPublicProductsByStoreId] total products before filter:', allProducts.length);
    return allProducts
      .filter(p => !deletedIds.has(p.id) && !deletedIds.has(p.id.replace(/^prod_/i, '')))
      .map(p => {
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


const isValidUUID = (str: string | null | undefined): boolean => {
  if (!str) return false;
  const clean = str.replace(/^store_/i, '');
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
};

const sanitizeUUID = (str: string | null | undefined): string | null => {
  if (!str) return null;
  const clean = str.replace(/^store_/i, '');
  return isValidUUID(clean) ? clean : null;
};

function cleanProductPayload<T extends Record<string, any>>(data: T): T {
  const cleaned: any = { ...data };
  if ('store_id' in cleaned && cleaned.store_id) {
    const rawStoreId = cleaned.store_id.toString();
    const cleanId = rawStoreId.replace(/^store_/i, '');
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId)) {
      cleaned.store_id = cleanId;
    }
  }
  if ('category_id' in cleaned) {
    cleaned.category_id = sanitizeUUID(cleaned.category_id);
  }
  if ('education_level_id' in cleaned) {
    cleaned.education_level_id = sanitizeUUID(cleaned.education_level_id);
  }
  return cleaned as T;
}

// 6. Criar Novo Produto (Persiste diretamente no Supabase via backend API /api/produtos)
export async function createProduct(productData: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
  let payload = cleanProductPayload(productData);

  // Validação antecipada: store_id deve ser um UUID válido
  if (!payload.store_id || !isValidUUID(payload.store_id)) {
    throw new Error(
      'Não é possível criar o produto: a loja ainda não foi configurada. ' +
      'Acesse "Configurações da Loja" e salve os dados da sua loja antes de cadastrar produtos.'
    );
  }

  // 1. Obter token de autenticação
  let token = '';
  if (typeof window !== 'undefined') {
    const rawSession = localStorage.getItem('educalizando_creator_session');
    if (rawSession) {
      try {
        const sess = JSON.parse(rawSession);
        if (sess.access_token) token = sess.access_token;
      } catch (e) {}
    }
  }
  const { data: authSession } = await supabase.auth.getSession();
  if (authSession?.session?.access_token) {
    token = authSession.session.access_token;
  }

  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente para cadastrar produtos.');
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  headers['Authorization'] = `Bearer ${token}`;

  // 2. Chamar API backend — ÚNICA fonte de verdade
  let res: Response;
  try {
    res = await fetch('/api/produtos', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
  } catch (networkErr: any) {
    throw new Error(`Falha de rede ao criar produto: ${networkErr.message}. Verifique sua conexão.`);
  }

  const result = await res.json().catch(() => null);

  if (!res.ok) {
    // Propagar o erro real da API para o frontend — NÃO cair em fallback
    const errMsg = result?.error || `Erro ${res.status} ao criar produto no servidor.`;
    console.error('[createProduct] Erro retornado pela API:', errMsg);
    throw new Error(errMsg);
  }

  if (!result?.success || !result?.product) {
    throw new Error('O servidor não retornou o produto criado. Tente novamente.');
  }

  // 3. Sucesso: atualizar cache local com o produto real do banco
  const created = result.product as Product;
  removeDeletedProductId(created.id);
  const localProducts = getLocalProducts();
  localProducts.unshift(created);
  saveLocalProducts(localProducts);

  return created;
}

// 7. Atualizar Produto
export async function updateProduct(productId: string, updates: Partial<Product>): Promise<Product> {
  const payload = cleanProductPayload(updates);

  try {
    let token = '';
    if (typeof window !== 'undefined') {
      const rawSession = localStorage.getItem('educalizando_creator_session');
      if (rawSession) {
        try {
          const sess = JSON.parse(rawSession);
          if (sess.access_token) token = sess.access_token;
        } catch (e) {}
      }
    }
    const { data: authSession } = await supabase.auth.getSession();
    if (authSession?.session?.access_token) {
      token = authSession.session.access_token;
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/produtos', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ id: productId, updates: payload })
    });

    if (res.ok) {
      const result = await res.json();
      if (result.success && result.product) {
        const products = getLocalProducts();
        const idx = products.findIndex(p => p.id === productId);
        if (idx >= 0) products[idx] = result.product as Product;
        else products.unshift(result.product as Product);
        saveLocalProducts(products);
        return result.product as Product;
      }
    }
  } catch (err: any) {
    console.warn('[updateProduct] Tentando atualização direta via Supabase client...', err);
  }

  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', productId)
        .select()
        .single();

      if (!error && data) {
        const products = getLocalProducts();
        const idx = products.findIndex(p => p.id === productId);
        if (idx >= 0) products[idx] = data as Product;
        else products.unshift(data as Product);
        saveLocalProducts(products);
        return data as Product;
      }
    } catch (err) {
      console.warn('[updateProduct] Supabase update notice:', err);
    }
  }

  // Fallback Local
  const products = getLocalProducts();
  const index = products.findIndex(p => p.id === productId);
  if (index >= 0) {
    const updatedProduct = { ...products[index], ...payload, updated_at: new Date().toISOString() };
    products[index] = updatedProduct;
    saveLocalProducts(products);
    return updatedProduct;
  }

  const updatedProduct: Product = {
    id: productId,
    store_id: payload.store_id || 'store-active',
    titulo: payload.titulo || 'Produto Sem Título',
    descricao: payload.descricao || null,
    tipo: payload.tipo || 'pdf',
    preco: payload.preco || 0,
    is_plr: payload.is_plr,
    preco_plr: payload.preco_plr,
    plr_license_url: payload.plr_license_url || null,
    capa_url: payload.capa_url || null,
    arquivo_url: payload.arquivo_url || null,
    status: payload.status || 'publicado',
    category_id: payload.category_id || null,
    education_level_id: payload.education_level_id || null,
    created_at: new Date().toISOString()
  };

  products.unshift(updatedProduct);
  saveLocalProducts(products);
  return updatedProduct;
}

// 8. Verificar se o Produto Possui Vendas Registradas
export async function checkProductHasSales(productId: string): Promise<boolean> {
  if (!productId) return false;
  const cleanId = productId.replace(/^prod_/i, '');
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      // 1. Verificar em order_items
      const { data: orderItem } = await supabase
        .from('order_items')
        .select('id')
        .or(`product_id.eq.${productId},product_id.eq.${cleanId}`)
        .limit(1)
        .maybeSingle();

      if (orderItem?.id) return true;

      // 2. Verificar em student_product_access
      const { data: accessItem } = await supabase
        .from('student_product_access')
        .select('id')
        .or(`product_id.eq.${productId},product_id.eq.${cleanId}`)
        .limit(1)
        .maybeSingle();

      if (accessItem?.id) return true;

      // 3. Verificar em purchases
      const { data: purchaseItem } = await supabase
        .from('purchases')
        .select('id')
        .or(`product_id.eq.${productId},product_id.eq.${cleanId}`)
        .limit(1)
        .maybeSingle();

      if (purchaseItem?.id) return true;
    } catch (e) {
      console.warn('[checkProductHasSales] Erro ao consultar vendas no Supabase:', e);
    }
  }

  // Verificar em localStorage (para testes e fallback offline)
  if (typeof window !== 'undefined') {
    try {
      const rawOrders = localStorage.getItem('educalizando_orders_v2') || localStorage.getItem('educalizando_orders');
      if (rawOrders) {
        const orders = JSON.parse(rawOrders);
        if (Array.isArray(orders)) {
          const hasSold = orders.some(ord => 
            Array.isArray(ord.items) && ord.items.some((it: any) => 
              it.productId === productId || it.productId === cleanId || it.product_id === productId || it.product_id === cleanId
            )
          );
          if (hasSold) return true;
        }
      }

      const rawAccess = localStorage.getItem('educalizando_student_product_access_v1');
      if (rawAccess) {
        const accesses = JSON.parse(rawAccess);
        if (Array.isArray(accesses)) {
          const hasAcc = accesses.some((acc: any) => 
            acc.productId === productId || acc.productId === cleanId || acc.product_id === productId || acc.product_id === cleanId
          );
          if (hasAcc) return true;
        }
      }
    } catch (e) {}
  }

  return false;
}

// 9. Excluir Produto (Soft Delete Definitivo no Supabase + API Backend + LocalStorage)
export async function deleteProduct(productId: string, storeId: string): Promise<void> {
  const cleanId = productId.replace(/^prod_/i, '');
  const cleanStoreId = storeId.replace(/^store_/i, '');

  let backendSuccess = false;

  // 1. Chamar rota API backend para Soft Delete definitivo via Supabase Admin
  try {
    let token = '';
    if (typeof window !== 'undefined') {
      const rawSession = localStorage.getItem('educalizando_creator_session');
      if (rawSession) {
        try {
          const sess = JSON.parse(rawSession);
          if (sess.access_token) token = sess.access_token;
        } catch (e) {}
      }
    }
    const { data: authSession } = await supabase.auth.getSession();
    if (authSession?.session?.access_token) {
      token = authSession.session.access_token;
    }

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/produtos?id=${productId}&store_id=${cleanStoreId}`, { 
      method: 'DELETE',
      headers 
    });
    const result = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = result?.error || `Erro HTTP ${res.status} ao excluir produto.`;
      console.error('[deleteProduct] Erro real retornado pela API backend:', errorMsg);
      throw new Error(errorMsg);
    }

    if (!result?.success) {
      console.error('[deleteProduct] API retornou resposta sem success:', result);
      throw new Error('A API não confirmou a exclusão do produto.');
    }

    console.log(`[deleteProduct] Soft delete confirmado pela API para ${productId}`);
    backendSuccess = true;
  } catch (e: any) {
    // Se for um erro de rede (fetch falhou), tentar fallback direto
    if (e.name === 'TypeError' || e.message?.includes('fetch')) {
      console.warn('[deleteProduct] Erro de rede, tentando fallback direto via Supabase client...');
      
      const isRealSupabase = Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL && 
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
      );

      if (isRealSupabase) {
        const targetUUID = isValidUUID(cleanId) ? cleanId : (isValidUUID(productId) ? productId : null);
        if (targetUUID) {
          // Tentar excluido_em + status
          const { data, error } = await supabase
            .from('products')
            .update({
              excluido_em: new Date().toISOString(),
              status: 'excluido',
              updated_at: new Date().toISOString()
            })
            .eq('id', targetUUID)
            .select('id')
            .maybeSingle();

          if (!error && data) {
            backendSuccess = true;
          } else {
            // Tentar apenas excluido_em
            const { data: d2, error: e2 } = await supabase
              .from('products')
              .update({
                excluido_em: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', targetUUID)
              .select('id')
              .maybeSingle();

            if (!e2 && d2) {
              backendSuccess = true;
            } else {
              console.error('[deleteProduct] Fallback direto Supabase também falhou:', e2?.message);
              throw new Error('Falha de conexão com o banco para excluir produto.');
            }
          }
        }
      }
    } else {
      // Re-lançar erros reais da API
      throw e;
    }
  }

  // 2. Apenas se o backend foi bem sucedido, limpamos do UI (Fim da Deleção Fake)
  if (backendSuccess) {
    addDeletedProductId(productId);
    addDeletedProductId(cleanId);

    if (typeof window !== 'undefined') {
      const filterFn = (p: any) => p && p.id !== productId && p.id !== cleanId && p.id !== `prod_${productId}` && p.id !== `prod_${cleanId}`;
      
      const products = getLocalProducts().filter(filterFn);
      saveLocalProducts(products);

      try {
        ['educalizando_products_v3', 'educalizando_products_v2', 'educalizando_products_v1', 'educalizando_products'].forEach(k => {
          const raw = localStorage.getItem(k);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              localStorage.setItem(k, JSON.stringify(list.filter(filterFn)));
            }
          }
        });
      } catch (e) {}
    }
  }
}

// 10. Obter Produto por ID (Supabase + Fallback Local)
export async function getProductById(productId: string): Promise<Product | null> {
  if (!productId) return null;

  const cleanId = productId.replace(/^prod_/i, '');
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  const isUUID = isValidUUID(productId) || isValidUUID(cleanId);

  if (isRealSupabase && isUUID) {
    try {
      const targetId = isValidUUID(productId) ? productId : cleanId;
      const { data, error } = await supabase
        .from('products')
        .select('*, images:product_images(*)')
        .eq('id', targetId)
        .is('excluido_em', null)
        .maybeSingle();

      if (!error && data) {
        if (data.excluido_em || data.status === 'excluido') return null;
        if (data.images && Array.isArray(data.images)) {
          data.images.sort((a: any, b: any) => a.ordem - b.ordem);
        }
        return data as Product;
      }
    } catch (err) {
      console.error('[getProductById] Erro:', err);
    }
  }

  // Fallback Local
  const products = getLocalProducts();
  const found = products.find(p => p.id === productId || p.id === cleanId || p.id === `prod_${productId}`) || null;
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

export async function getTopMarketplaceStores(limit: number = 4): Promise<Store[]> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id')
  );

  if (isRealSupabase) {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data) {
        return data as Store[];
      }
    } catch (err) {
      console.error('[getTopMarketplaceStores] Erro:', err);
    }
  }

  // Fallback Local
  const stores = getLocalStores();
  return stores.slice(0, limit);
}
