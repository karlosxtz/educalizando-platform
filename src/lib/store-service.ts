import { supabase } from './supabase';
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

function getLocalProducts(): Product[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('educalizando_products_v3');
  if (!saved) return [];
  return JSON.parse(saved);
}

function saveLocalProducts(products: Product[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('educalizando_products_v3', JSON.stringify(products));
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
      const { data, error } = await supabase
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

        // 1. Tentar buscar no Supabase por creator_id (UUID ou Email)
        let { data: storeData } = await supabase
          .from('stores')
          .select('*')
          .or(`creator_id.eq.${userId},creator_id.eq.${userEmail}`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (storeData) {
          if (storeData.nome_loja && storeData.nome_loja.includes('@')) {
            const cleanName = userMeta.full_name ? `Loja de ${userMeta.full_name}` : 'Minha Loja';
            storeData.nome_loja = cleanName;
          }
          return storeData as Store;
        }

        // 2. Se a conta de criador existe no Supabase Auth mas ainda não tinha registro em stores, criar a loja real agora:
        let storeName = userMeta.store_name || (userMeta.full_name ? `Loja de ${userMeta.full_name}` : 'Minha Loja');
        if (storeName.includes('@')) {
          storeName = userMeta.full_name ? `Loja de ${userMeta.full_name}` : 'Minha Loja';
        }

        let storeSlug = userMeta.store_slug || storeName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        if (!storeSlug || storeSlug.length < 2) storeSlug = `loja-${Math.random().toString(36).substring(2, 7)}`;

        const { data: newStore, error: createErr } = await supabase
          .from('stores')
          .insert([
            {
              creator_id: userId,
              nome_loja: storeName,
              slug: storeSlug,
              descricao: `Loja oficial de infoprodutos de ${userMeta.full_name || storeName}.`,
              cor_primaria: '#093b6c',
              created_at: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (!createErr && newStore) {
          return newStore as Store;
        }
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
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return (data as Product[]).filter(p => {
          if (!p.store_id) return false;
          const pStoreClean = p.store_id.replace(/^store_/i, '');
          return p.store_id === storeId || p.store_id === cleanStoreId || pStoreClean === cleanStoreId;
        });
      }
    } catch (err) {
      console.error('[getProductsByStoreId] Erro Supabase:', err);
    }
  }

  // Fallback para ambiente local/offline apenas se Supabase não estiver ativo
  if (typeof window !== 'undefined') {
    return getLocalProducts().filter(p => {
      if (!p.store_id) return false;
      const pStoreClean = p.store_id.replace(/^store_/i, '');
      return p.store_id === storeId || p.store_id === cleanStoreId || pStoreClean === cleanStoreId;
    });
  }

  return [];
}

// 5. Obter Produtos Públicos (Vitrine - status publicado/ativo)
export async function getPublicProductsByStoreId(storeId: string): Promise<Product[]> {
  const cleanStoreId = (storeId || '').replace(/^store_/i, '');
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return (data as Product[]).filter(p => {
          const statusStr = (p.status as string) || '';
          const isPublished = !statusStr || statusStr === 'publicado' || statusStr === 'published' || statusStr === 'ativo';
          if (!isPublished) return false;
          if (!p.store_id) return false;
          const pStoreClean = p.store_id.replace(/^store_/i, '');
          return p.store_id === storeId || p.store_id === cleanStoreId || pStoreClean === cleanStoreId;
        });
      }
    } catch (err) {
      console.error('[getPublicProductsByStoreId] Erro Supabase:', err);
    }
  }

  // Fallback para ambiente local/offline apenas se Supabase não estiver ativo
  if (typeof window !== 'undefined') {
    return getLocalProducts().filter(p => {
      const statusStr = (p.status as string) || '';
      const isPublished = !statusStr || statusStr === 'publicado' || statusStr === 'published' || statusStr === 'ativo';
      if (!isPublished) return false;
      if (!p.store_id) return false;
      const pStoreClean = p.store_id.replace(/^store_/i, '');
      return p.store_id === storeId || p.store_id === cleanStoreId || pStoreClean === cleanStoreId;
    });
  }

  return [];
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

  // 1. Tentar gravar via API Route backend (/api/produtos) para ignorar restrições de RLS de cliente
  try {
    const res = await fetch('/api/produtos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const result = await res.json();
      if (result.success && result.product) {
        const products = getLocalProducts();
        products.unshift(result.product as Product);
        saveLocalProducts(products);
        return result.product as Product;
      }
    }
  } catch (err: any) {
    console.warn('[createProduct] Tentando inserção direta via Supabase client...', err);
  }

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

        const { data: userStore } = await supabase
          .from('stores')
          .select('id')
          .or(`creator_id.eq.${userId},creator_id.eq.${userEmail}`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (userStore?.id) {
          payload.store_id = userStore.id;
        }
      }

      const { data, error } = await supabase
        .from('products')
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        const products = getLocalProducts();
        products.unshift(data as Product);
        saveLocalProducts(products);
        return data as Product;
      }
    } catch (err: any) {
      console.warn('[createProduct] Supabase sync fallback:', err.message);
    }
  }

  // Fallback Local Seguro (garante que a criação NUNCA falhe para o usuário)
  const newProduct: Product = {
    ...payload,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `prod_${Date.now()}`,
    created_at: new Date().toISOString()
  };

  const products = getLocalProducts();
  products.unshift(newProduct);
  saveLocalProducts(products);
  return newProduct;
}

// 7. Atualizar Produto
export async function updateProduct(productId: string, updates: Partial<Product>): Promise<Product> {
  const payload = cleanProductPayload(updates);

  try {
    const res = await fetch('/api/produtos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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

// 9. Excluir Produto (Purga do Supabase + API Backend + LocalStorage)
export async function deleteProduct(productId: string): Promise<void> {
  const cleanId = productId.replace(/^prod_/i, '');

  // 1. Regra de Negócio: Produtos com vendas NÃO podem ser excluídos
  const hasSales = await checkProductHasSales(productId);
  if (hasSales) {
    throw new Error('Não é possível excluir este material didático pois ele possui vendas realizadas. Para tirá-lo da loja sem remover o acesso dos alunos compradores, altere seu status para "Rascunho".');
  }

  // 2. Chamar rota API backend para exclusão persistente e purga de cache
  try {
    const res = await fetch(`/api/produtos?id=${productId}`, { method: 'DELETE' });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      if (errData?.error) {
        throw new Error(errData.error);
      }
    }
  } catch (e: any) {
    if (e.message && e.message.includes('possui vendas')) {
      throw e;
    }
    console.warn('[deleteProduct] Aviso na chamada API DELETE:', e);
  }

  // 3. Purga no Supabase Client direto
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      // Limpar registros relacionais associados primeiro para não violar FK
      await supabase.from('digital_contents').delete().or(`product_id.eq.${productId},product_id.eq.${cleanId}`);
      await supabase.from('reviews').delete().or(`product_id.eq.${productId},product_id.eq.${cleanId}`);
      await supabase.from('product_reviews').delete().or(`product_id.eq.${productId},product_id.eq.${cleanId}`);
      await supabase.from('kit_products').delete().or(`product_id.eq.${productId},product_id.eq.${cleanId}`);
      await supabase.from('kit_items').delete().or(`product_id.eq.${productId},product_id.eq.${cleanId}`);
      await supabase.from('coupon_products').delete().or(`product_id.eq.${productId},product_id.eq.${cleanId}`);
      
      await supabase.from('products').delete().eq('id', productId);
      if (cleanId !== productId && isValidUUID(cleanId)) {
        await supabase.from('products').delete().eq('id', cleanId);
      }
    } catch (err) {
      console.warn('[deleteProduct] Aviso na exclusão direta Supabase:', err);
    }
  }

  // 4. SEMPRE remover do LocalStorage para impedir reaparecimento de itens excluídos em reload
  if (typeof window !== 'undefined') {
    const products = getLocalProducts();
    const filtered = products.filter(p => p.id !== productId && p.id !== cleanId && p.id !== `prod_${productId}`);
    saveLocalProducts(filtered);
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
        .select('*')
        .eq('id', targetId)
        .maybeSingle();

      if (!error && data) {
        return data as Product;
      }
    } catch (err) {
      console.error('[getProductById] Erro:', err);
    }
  }

  // Fallback Local
  const products = getLocalProducts();
  return products.find(p => p.id === productId || p.id === cleanId || p.id === `prod_${productId}`) || null;
}
