import { supabase } from './supabase';
import { Kit, KitItem, Product } from './types';
import { getProductById } from './store-service';

const isValidUUID = (str: string | null | undefined): boolean => {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

function getDeletedKitIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const saved = localStorage.getItem('educalizando_deleted_kits_v1');
    if (saved) {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (e) {}
  return new Set();
}

function addDeletedKitId(id: string) {
  if (typeof window === 'undefined' || !id) return;
  try {
    const clean = id.replace(/^kit_/i, '');
    const set = getDeletedKitIds();
    set.add(id);
    set.add(clean);
    set.add(`kit_${clean}`);
    localStorage.setItem('educalizando_deleted_kits_v1', JSON.stringify(Array.from(set)));
  } catch (e) {}
}

function removeDeletedKitId(id: string) {
  if (typeof window === 'undefined' || !id) return;
  try {
    const clean = id.replace(/^kit_/i, '');
    const set = getDeletedKitIds();
    set.delete(id);
    set.delete(clean);
    set.delete(`kit_${clean}`);
    localStorage.setItem('educalizando_deleted_kits_v1', JSON.stringify(Array.from(set)));
  } catch (e) {}
}

// Mock/Default fallback helpers for offline dev environment
function getLocalKits(): Kit[] {
  if (typeof window === 'undefined') return [];
  const deletedIds = getDeletedKitIds();
  const saved = localStorage.getItem('educalizando_kits_v1');
  if (!saved) return [];
  try {
    const kits: Kit[] = JSON.parse(saved);
    return Array.isArray(kits) ? kits.filter(k => !deletedIds.has(k.id) && !deletedIds.has(k.id.replace(/^kit_/i, ''))) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalKits(kits: Kit[]) {
  if (typeof window !== 'undefined') {
    const deletedIds = getDeletedKitIds();
    const cleanList = kits.filter(k => !deletedIds.has(k.id) && !deletedIds.has(k.id.replace(/^kit_/i, '')));
    localStorage.setItem('educalizando_kits_v1', JSON.stringify(cleanList));
  }
}

// 1. Obter todos os Kits de uma loja (Painel do Criador)
export async function getKitsByStoreId(storeId: string): Promise<Kit[]> {
  const deletedIds = getDeletedKitIds();
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const { data, error } = await supabase
        .from('kits')
        .select(`
          *,
          kit_items (
            id,
            kit_id,
            product_id,
            products (*)
          )
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data
          .filter((k: any) => !deletedIds.has(k.id) && !deletedIds.has((k.id || '').replace(/^kit_/i, '')))
          .map((k: any) => {
            const products: Product[] = (k.kit_items || [])
              .map((item: any) => item.products)
              .filter(Boolean);
            return {
              ...k,
              products,
              items: k.kit_items
            } as Kit;
          });
      }
      if (error) {
        console.warn('[getKitsByStoreId] Erro ao consultar Supabase:', error.message);
      }
    } catch (err) {
      console.error('[getKitsByStoreId] Exceção:', err);
    }
  }

  // Fallback Local Storage
  const localKits = getLocalKits().filter(k => k.store_id === storeId && !deletedIds.has(k.id) && !deletedIds.has((k.id || '').replace(/^kit_/i, '')));
  return localKits;
}

// 2. Obter Kits Públicos (status = 'publicado') para a Vitrine
export async function getPublicKitsByStoreId(storeId: string): Promise<Kit[]> {
  const deletedIds = getDeletedKitIds();
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const { data, error } = await supabase
        .from('kits')
        .select(`
          *,
          kit_items (
            id,
            kit_id,
            product_id,
            products (*)
          )
        `)
        .eq('store_id', storeId)
        .eq('status', 'publicado')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data
          .filter((k: any) => !deletedIds.has(k.id) && !deletedIds.has((k.id || '').replace(/^kit_/i, '')))
          .map((k: any) => {
            const products: Product[] = (k.kit_items || [])
              .map((item: any) => item.products)
              .filter(Boolean);
            return {
              ...k,
              products,
              items: k.kit_items
            } as Kit;
          });
      }
      if (error) {
        console.warn('[getPublicKitsByStoreId] Erro ao consultar Supabase:', error.message);
      }
    } catch (err) {
      console.error('[getPublicKitsByStoreId] Exceção:', err);
    }
  }

  // Fallback Local Storage
  return getLocalKits().filter(k => 
    k.store_id === storeId && 
    k.status === 'publicado' && 
    !deletedIds.has(k.id) && 
    !deletedIds.has((k.id || '').replace(/^kit_/i, ''))
  );
}

// 3. Obter Kit por ID com seus Produtos Inclusos
export async function getKitById(kitId: string): Promise<Kit | null> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const { data, error } = await supabase
        .from('kits')
        .select(`
          *,
          kit_items (
            id,
            kit_id,
            product_id,
            products (*)
          )
        `)
        .eq('id', kitId)
        .maybeSingle();

      if (!error && data) {
        const products: Product[] = (data.kit_items || [])
          .map((item: any) => item.products)
          .filter(Boolean);
        return {
          ...data,
          products,
          items: data.kit_items
        } as Kit;
      }
    } catch (err) {
      console.error('[getKitById] Erro:', err);
    }
  }

  // Fallback Local
  const localKits = getLocalKits();
  return localKits.find(k => k.id === kitId) || null;
}

// 4. Criar Novo Kit (com vinculação N:N dos produtos da loja)
export async function createKit(
  kitData: Omit<Kit, 'id' | 'created_at'>,
  productIds: string[]
): Promise<Kit> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    // Insere Kit
    const { data: newKit, error: kitError } = await supabase
      .from('kits')
      .insert([{
        store_id: kitData.store_id,
        titulo: kitData.titulo,
        descricao: kitData.descricao,
        capa_url: kitData.capa_url,
        preco_kit: kitData.preco_kit,
        status: kitData.status
      }])
      .select()
      .single();

    if (kitError) throw new Error(`Erro ao cadastrar kit: ${kitError.message}`);

    // Insere Itens no kit_items
    if (productIds.length > 0) {
      const itemsToInsert = productIds.map(pid => ({
        kit_id: newKit.id,
        product_id: pid
      }));

      const { error: itemsError } = await supabase
        .from('kit_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Erro ao vincular produtos ao kit:', itemsError.message);
      }
    }

    return getKitById(newKit.id) as Promise<Kit>;
  }

  // Fallback Local
  const newKitId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `kit_${Date.now()}`;
  
  // Buscar detalhes dos produtos locais
  const fetchedProducts: Product[] = [];
  for (const pid of productIds) {
    const prod = await getProductById(pid);
    if (prod) fetchedProducts.push(prod);
  }

  const newKit: Kit = {
    ...kitData,
    id: newKitId,
    created_at: new Date().toISOString(),
    products: fetchedProducts,
    items: productIds.map(pid => ({
      id: `ki_${Date.now()}_${pid}`,
      kit_id: newKitId,
      product_id: pid,
      created_at: new Date().toISOString()
    }))
  };

  const kits = getLocalKits();
  kits.unshift(newKit);
  saveLocalKits(kits);

  return newKit;
}

// 5. Atualizar Kit Existente
export async function updateKit(
  kitId: string,
  updates: Partial<Kit>,
  productIds?: string[]
): Promise<Kit> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    const { data: updatedKit, error: kitError } = await supabase
      .from('kits')
      .update({
        titulo: updates.titulo,
        descricao: updates.descricao,
        capa_url: updates.capa_url,
        preco_kit: updates.preco_kit,
        status: updates.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', kitId)
      .select()
      .single();

    if (kitError) throw new Error(`Erro ao atualizar kit: ${kitError.message}`);

    if (productIds) {
      // Re-vincular produtos: deletar antigos e criar novos
      await supabase.from('kit_items').delete().eq('kit_id', kitId);

      if (productIds.length > 0) {
        const itemsToInsert = productIds.map(pid => ({
          kit_id: kitId,
          product_id: pid
        }));
        await supabase.from('kit_items').insert(itemsToInsert);
      }
    }

    return getKitById(kitId) as Promise<Kit>;
  }

  // Fallback Local
  const kits = getLocalKits();
  const index = kits.findIndex(k => k.id === kitId);
  if (index === -1) throw new Error('Kit não encontrado.');

  let updatedProducts = kits[index].products || [];
  if (productIds) {
    updatedProducts = [];
    for (const pid of productIds) {
      const prod = await getProductById(pid);
      if (prod) updatedProducts.push(prod);
    }
  }

  const updatedKitObj: Kit = {
    ...kits[index],
    ...updates,
    products: updatedProducts,
    updated_at: new Date().toISOString()
  };

  kits[index] = updatedKitObj;
  saveLocalKits(kits);

  return updatedKitObj;
}

// 6. Verificar se o Kit Possui Vendas
export async function checkKitHasSales(kitId: string): Promise<boolean> {
  if (!kitId) return false;
  const cleanId = kitId.replace(/^kit_/i, '');
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  const targetUUID = isValidUUID(cleanId) ? cleanId : (isValidUUID(kitId) ? kitId : null);

  if (isRealSupabase && targetUUID) {
    try {
      const { data: orderItem } = await supabase
        .from('order_items')
        .select('id')
        .eq('product_id', targetUUID)
        .limit(1)
        .maybeSingle();

      if (orderItem?.id) return true;

      const { data: accessItem } = await supabase
        .from('student_product_access')
        .select('id')
        .eq('product_id', targetUUID)
        .limit(1)
        .maybeSingle();

      if (accessItem?.id) return true;

      const { data: purchaseItem } = await supabase
        .from('purchases')
        .select('id')
        .eq('kit_id', targetUUID)
        .limit(1)
        .maybeSingle();

      if (purchaseItem?.id) return true;
    } catch (e) {
      console.warn('[checkKitHasSales] Aviso ao verificar vendas:', e);
    }
  }

  // Verificar em localStorage
  if (typeof window !== 'undefined') {
    try {
      const rawOrders = localStorage.getItem('educalizando_orders_v2') || localStorage.getItem('educalizando_orders');
      if (rawOrders) {
        const orders = JSON.parse(rawOrders);
        if (Array.isArray(orders)) {
          const hasSold = orders.some(ord => 
            Array.isArray(ord.items) && ord.items.some((it: any) => 
              it.productId === kitId || it.productId === cleanId || it.kitId === kitId || it.kitId === cleanId
            )
          );
          if (hasSold) return true;
        }
      }
    } catch (e) {}
  }

  return false;
}

// 7. Excluir Kit
export async function deleteKit(kitId: string): Promise<void> {
  const cleanId = kitId.replace(/^kit_/i, '');

  const hasSales = await checkKitHasSales(kitId);
  if (hasSales) {
    throw new Error('Não é possível excluir este combo/kit pois ele possui vendas realizadas. Altere seu status para "Rascunho" para ocultá-lo da vitrine.');
  }

  // 1. Adicionar à blacklist de kits excluídos
  addDeletedKitId(kitId);
  addDeletedKitId(cleanId);

  // 2. Chamar rota API backend com Service Role Admin
  try {
    const res = await fetch(`/api/kits?id=${kitId}`, { method: 'DELETE' });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      if (errData?.error) {
        throw new Error(errData.error);
      }
    }
  } catch (e: any) {
    if (e.message && e.message.includes('possui vendas')) throw e;
    console.warn('[deleteKit] Aviso na chamada API DELETE:', e);
  }

  const targetUUID = isValidUUID(cleanId) ? cleanId : (isValidUUID(kitId) ? kitId : null);

  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase && targetUUID) {
    try {
      await supabase.from('kit_items').delete().eq('kit_id', targetUUID);
      await supabase.from('kit_products').delete().eq('kit_id', targetUUID);
      await supabase.from('coupon_products').delete().eq('kit_id', targetUUID);
      
      const { error } = await supabase.from('kits').delete().eq('id', targetUUID);
      if (error) throw new Error(`Erro ao excluir kit: ${error.message}`);
    } catch (err: any) {
      if (err.message && err.message.includes('possui vendas')) throw err;
      console.warn('[deleteKit] Aviso na exclusão direta Supabase:', err);
    }
  }

  // SEMPRE remover de todas as chaves do LocalStorage para impedir itens fantasmas
  if (typeof window !== 'undefined') {
    const filterFn = (k: any) => k && k.id !== kitId && k.id !== cleanId && k.id !== `kit_${kitId}` && k.id !== `kit_${cleanId}`;
    const kits = getLocalKits().filter(filterFn);
    saveLocalKits(kits);

    try {
      ['educalizando_kits_v1', 'educalizando_kits'].forEach(k => {
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
