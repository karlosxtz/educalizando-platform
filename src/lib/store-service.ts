import { supabase } from './supabase';
import { Store, Product } from './types';

// Mock Data de Exemplo Inicial (para teste local e fallback imediato)
export const INITIAL_MOCK_STORE: Store = {
  id: 'store-prof-ricardo',
  creator_id: 'creator-ricardo',
  nome_loja: 'Prof. Ricardo Silva',
  slug: 'prof-ricardo',
  descricao: 'Apostilas esquematizadas, e-books interativos e simulados preparatórios para o ENEM e Vestibulares de Medicina.',
  logo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  banner_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80',
  cor_primaria: '#ff5722',
  asaas_subaccount_id: null,
  created_at: new Date().toISOString()
};

export const INITIAL_MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    store_id: 'store-prof-ricardo',
    titulo: 'Combo Definitivo ENEM: 1.000 Questões Comentadas + Redação 1000',
    descricao: 'Material didático completo com apostilas em PDF, 50 mapas mentais coloridos e modelos de introdução coringa.',
    tipo: 'pdf',
    preco: 67.90,
    capa_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
    arquivo_url: 'https://example.com/material-enem.pdf',
    status: 'publicado',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-2',
    store_id: 'store-prof-ricardo',
    titulo: 'Caderno Digital de Geometria Plana & Espacial Descomplicada',
    descricao: 'Teoria esquematizada com passo a passo e resolução de todas as questões dos últimos 5 anos do ENEM.',
    tipo: 'ebook',
    preco: 39.90,
    capa_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80',
    arquivo_url: 'https://example.com/geometria.pdf',
    status: 'publicado',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-3',
    store_id: 'store-prof-ricardo',
    titulo: 'Simulado Inédito Redação & Matemática (Gabarito em Vídeo)',
    descricao: 'Rascunho de simulado preparatório para a reta final.',
    tipo: 'simulado',
    preco: 29.90,
    capa_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
    arquivo_url: null,
    status: 'rascunho',
    created_at: new Date().toISOString()
  }
];

// Helper para localStorage
function getLocalStores(): Store[] {
  if (typeof window === 'undefined') return [INITIAL_MOCK_STORE];
  const saved = localStorage.getItem('educalizando_stores_v2');
  if (!saved) {
    localStorage.setItem('educalizando_stores_v2', JSON.stringify([INITIAL_MOCK_STORE]));
    return [INITIAL_MOCK_STORE];
  }
  return JSON.parse(saved);
}

function saveLocalStores(stores: Store[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('educalizando_stores_v2', JSON.stringify(stores));
  }
}

function getLocalProducts(): Product[] {
  if (typeof window === 'undefined') return INITIAL_MOCK_PRODUCTS;
  const saved = localStorage.getItem('educalizando_products_v2');
  if (!saved) {
    localStorage.setItem('educalizando_products_v2', JSON.stringify(INITIAL_MOCK_PRODUCTS));
    return INITIAL_MOCK_PRODUCTS;
  }
  return JSON.parse(saved);
}

function saveLocalProducts(products: Product[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('educalizando_products_v2', JSON.stringify(products));
  }
}

// 1. Obter Loja por Slug com Diagnóstico & Fallback Seguro
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
        console.log(`[getStoreBySlug] Loja "${slug}" encontrada com sucesso no Supabase Postgres.`);
        return data as Store;
      }
      if (error) {
        console.warn(`[getStoreBySlug] Erro na query do Supabase para slug "${slug}":`, error.message);
      }
    } catch (err) {
      console.error(`[getStoreBySlug] Exceção na consulta de "${slug}":`, err);
    }
  }

  // Fallback Local & Loja Padrão de Teste (garante que prof-ricardo nunca dê 404 se o banco estiver limpo)
  const stores = getLocalStores();
  const found = stores.find(s => s.slug === slug);
  if (found) return found;

  if (slug === INITIAL_MOCK_STORE.slug || slug.includes('prof-ricardo')) {
    return INITIAL_MOCK_STORE;
  }

  return null;
}

// 2. Obter Loja por Creator ID (ou Loja Padrão do Dashboard)
export async function getStoreByCreatorId(creatorId: string): Promise<Store> {
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
        .maybeSingle();

      if (data) return data as Store;
    } catch (err) {
      console.error('[getStoreByCreatorId] Erro ao buscar por creator_id:', err);
    }
  }

  // Fallback Local
  const stores = getLocalStores();
  return stores[0] || INITIAL_MOCK_STORE;
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
    ...(stores[index] || INITIAL_MOCK_STORE),
    ...updates,
    updated_at: new Date().toISOString()
  };

  if (index >= 0) stores[index] = updatedStore;
  else stores.push(updatedStore);

  saveLocalStores(stores);
  return updatedStore;
}

// 4. Obter Todos os Produtos de uma Loja (Painel do Criador)
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

      if (!error && data && data.length > 0) return data as Product[];
    } catch (err) {
      console.error('[getProductsByStoreId] Erro ao buscar produtos:', err);
    }
  }

  // Fallback Local
  const products = getLocalProducts();
  return products.filter(p => p.store_id === storeId || p.store_id === INITIAL_MOCK_STORE.id);
}

// 5. Obter Produtos Públicos (status = 'publicado') para a Vitrine
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

      if (!error && data && data.length > 0) return data as Product[];
    } catch (err) {
      console.error('[getPublicProductsByStoreId] Erro ao buscar produtos públicos:', err);
    }
  }

  // Fallback Local
  const products = getLocalProducts();
  const filtered = products.filter(p => (p.store_id === storeId || p.store_id === INITIAL_MOCK_STORE.id) && p.status === 'publicado');
  return filtered.length > 0 ? filtered : INITIAL_MOCK_PRODUCTS.filter(p => p.status === 'publicado');
}

// 6. Criar Novo Produto
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

    if (error) throw new Error(error.message);
    return data as Product;
  }

  // Fallback Local
  const newProduct: Product = {
    ...productData,
    id: `prod_${Date.now()}`,
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

    if (error) throw new Error(error.message);
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

// 8. Excluir Produto
export async function deleteProduct(productId: string): Promise<void> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) throw new Error(error.message);
    return;
  }

  // Fallback Local
  const products = getLocalProducts();
  const filtered = products.filter(p => p.id !== productId);
  saveLocalProducts(filtered);
}
