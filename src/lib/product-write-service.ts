import { supabase } from './supabase';
import { generateSlug } from './string-utils';
import { Product } from './types';
import { addDeletedProductId, getLocalProducts, removeDeletedProductId, saveLocalProducts } from './product-local-storage';

export const isValidUUID = (str: string | null | undefined): boolean => {
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
  if ('category_ids' in cleaned) {
    cleaned.category_ids = Array.from(new Set((Array.isArray(cleaned.category_ids) ? cleaned.category_ids : [])
      .map((id: unknown) => sanitizeUUID(typeof id === 'string' ? id : null))
      .filter(Boolean))).slice(0, 5);
    cleaned.category_id = cleaned.category_ids[0] || null;
  }
  if ('education_level_id' in cleaned) {
    cleaned.education_level_id = sanitizeUUID(cleaned.education_level_id);
  }
  if ('education_level_ids' in cleaned) {
    cleaned.education_level_ids = Array.from(new Set((Array.isArray(cleaned.education_level_ids) ? cleaned.education_level_ids : [])
      .map((id: unknown) => sanitizeUUID(typeof id === 'string' ? id : null))
      .filter(Boolean))).slice(0, 5);
    cleaned.education_level_id = cleaned.education_level_ids[0] || null;
  }
  return cleaned as T;
}

// 6. Criar Novo Produto (Persiste diretamente no Supabase via backend API /api/produtos)
export async function createProduct(productData: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
  const payload = cleanProductPayload(productData);
  if (payload.titulo) {
    payload.slug = generateSlug(payload.titulo);
  }

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
      } catch (_e) {}
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
  if (payload.titulo) {
    payload.slug = generateSlug(payload.titulo);
  }

  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    let token = '';
    if (typeof window !== 'undefined') {
      const rawSession = localStorage.getItem('educalizando_creator_session');
      if (rawSession) {
        try {
          const sess = JSON.parse(rawSession);
          if (sess.access_token) token = sess.access_token;
        } catch (_e) {}
      }
    }
    const { data: authSession } = await supabase.auth.getSession();
    if (authSession?.session?.access_token) {
      token = authSession.session.access_token;
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let res: Response;
    try {
      res = await fetch('/api/produtos', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id: productId, updates: payload })
      });
    } catch (networkErr: any) {
      throw new Error(`Falha de rede ao atualizar produto: ${networkErr.message}.`);
    }

    const result = await res.json().catch(() => null);

    if (!res.ok) {
      const errMsg = result?.error || `Erro ${res.status} ao atualizar produto no servidor.`;
      console.error('[updateProduct] Erro retornado pela API:', errMsg);
      throw new Error(errMsg);
    }

    if (!result?.success || !result?.product) {
      throw new Error('O servidor não retornou os dados atualizados.');
    }

    const created = result.product as Product;
    const products = getLocalProducts();
    const idx = products.findIndex(p => p.id === productId);
    if (idx >= 0) products[idx] = created;
    else products.unshift(created);
    saveLocalProducts(products);
    return created;
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
    category_ids: payload.category_ids || (payload.category_id ? [payload.category_id] : []),
    education_level_id: payload.education_level_id || null,
    education_level_ids: payload.education_level_ids || (payload.education_level_id ? [payload.education_level_id] : []),
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
    } catch (_e) {}
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
        } catch (_e) {}
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
    // A decisão de exclusão pertence exclusivamente ao servidor, que verifica
    // compras finais, licenças PLR e acessos antigos antes de alterar o produto.
    // Nunca contorne essa política com uma escrita direta pelo navegador.
    if (e?.name === 'TypeError' || e?.message?.includes('fetch')) {
      throw new Error('Não foi possível confirmar com segurança se este produto pode ser excluído. Verifique a conexão e tente novamente.');
    }
    throw e;
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
      } catch (_e) {}
    }
  }
}

// 10. Obter Produto por ID ou Slug (Supabase + Fallback Local)
