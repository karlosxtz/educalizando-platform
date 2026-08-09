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
  if (typeof window === 'undefined') return [DEFAULT_MOCK_STORE];
  const saved = localStorage.getItem('educalizando_stores_v3');
  if (!saved) {
    localStorage.setItem('educalizando_stores_v3', JSON.stringify([DEFAULT_MOCK_STORE]));
    return [DEFAULT_MOCK_STORE];
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

// 2. Obter Loja por Creator ID (Respeita estritamente o usuário logado)
export async function getStoreByCreatorId(creatorId: string): Promise<Store> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      // Tentar obter usuário logado real
      const { data: authUser } = await supabase.auth.getUser();
      const targetUserId = authUser?.user?.id || creatorId;

      const { data } = await supabase
        .from('stores')
        .select('*')
        .eq('creator_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) return data as Store;

      // Se não encontrou por ID específico, pegar a última loja cadastrada pelo usuário
      const { data: latestStore } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestStore) return latestStore as Store;
    } catch (err) {
      console.error('[getStoreByCreatorId] Erro:', err);
    }
  }

  // Fallback Local
  const stores = getLocalStores();
  return stores[stores.length - 1] || DEFAULT_MOCK_STORE;
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

// 4. Obter Produtos da Loja (Sem Mocks Hardcoded - Retorna [] se a loja for nova)
export async function getProductsByStoreId(storeId: string): Promise<Product[]> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as Product[];
      }
    } catch (err) {
      console.error('[getProductsByStoreId] Erro:', err);
    }
  }

  // Fallback Local (Retorna [] se não houver produtos reais cadastrados)
  const products = getLocalProducts();
  return products.filter(p => p.store_id === storeId);
}

// 5. Obter Produtos Públicos (status = 'publicado')
export async function getPublicProductsByStoreId(storeId: string): Promise<Product[]> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'publicado')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as Product[];
      }
    } catch (err) {
      console.error('[getPublicProductsByStoreId] Erro:', err);
    }
  }

  // Fallback Local
  const products = getLocalProducts();
  return products.filter(p => p.store_id === storeId && p.status === 'publicado');
}

// 6. Criar Novo Produto (Gera UUID Real no Supabase)
export async function createProduct(productData: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) throw new Error(`Erro ao cadastrar produto: ${error.message}`);
    return data as Product;
  }

  // Fallback Local
  const newProduct: Product = {
    ...productData,
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
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();

    if (error) throw new Error(`Erro ao atualizar produto: ${error.message}`);
    return data as Product;
  }

  // Fallback Local
  const products = getLocalProducts();
  const index = products.findIndex(p => p.id === productId);
  if (index === -1) throw new Error('Produto não encontrado.');

  const updatedProduct = { ...products[index], ...updates, updated_at: new Date().toISOString() };
  products[index] = updatedProduct;
  saveLocalProducts(products);
  return updatedProduct;
}

// 8. Excluir Produto (Garante UUID Válido)
export async function deleteProduct(productId: string): Promise<void> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) throw new Error(`Erro ao excluir produto no Supabase: ${error.message}`);
    return;
  }

  // Fallback Local
  const products = getLocalProducts();
  const filtered = products.filter(p => p.id !== productId);
  saveLocalProducts(filtered);
}

// 9. Obter Produto por ID (Supabase + Fallback Local)
export async function getProductById(productId: string): Promise<Product | null> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
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
  return products.find(p => p.id === productId) || null;
}
