import { normalizeStoreSocialLinks } from './social-links';
import { allowsLocalDevelopmentFallback,supabase } from './supabase';
import { Store } from './types';

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

export * from './product-service';

// 1. Obter Loja por Slug em Tempo Real
export async function getStoreBySlug(slug: string): Promise<Store | null> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      // Use supabase to respect RLS
      const { data, error } = await supabase
        .from('stores')
        .select('id, creator_id, nome_loja, slug, descricao, logo_url, banner_url, cor_primaria, asaas_subaccount_id, whatsapp, instagram, layout_theme, author_image_url, author_bio, youtube, tiktok, facebook, website, button_style, welcome_message, meta_pixel_id, google_analytics_id, bulk_discount_enabled, bulk_discount_minimum, bulk_discount_percentage, affiliate_program_enabled, affiliate_commission_type, affiliate_commission_rate, exclusive_material_requests_enabled, created_at, updated_at')
        .eq('slug', slug)
        .maybeSingle();

      if (!error && data) {
        return normalizeStoreSocialLinks(data as Store);
      }
      if (error) {
        console.warn(`[getStoreBySlug] Erro ao consultar slug "${slug}":`, error.message);
      }
    } catch (err) {
      console.error(`[getStoreBySlug] Exceção na busca de "${slug}":`, err);
    }
  }

  if (!allowsLocalDevelopmentFallback()) return null;

  // Fallback local somente para desenvolvimento explicitamente habilitado.
  const stores = getLocalStores();
  const found = stores.find(s => s.slug === slug);
  if (found) return normalizeStoreSocialLinks(found);

  if (slug === 'minha-loja' || slug === 'prof-ricardo') {
    return normalizeStoreSocialLinks(DEFAULT_MOCK_STORE);
  }

  return null;
}

export async function getStoreById(storeId: string): Promise<Store | null> {
  const cleanId = storeId.replace(/^store_/i, '');
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, creator_id, nome_loja, slug, descricao, logo_url, banner_url, cor_primaria, asaas_subaccount_id, whatsapp, instagram, layout_theme, author_image_url, author_bio, youtube, tiktok, facebook, website, button_style, welcome_message, meta_pixel_id, google_analytics_id, bulk_discount_enabled, bulk_discount_minimum, bulk_discount_percentage, affiliate_program_enabled, affiliate_commission_type, affiliate_commission_rate, exclusive_material_requests_enabled, created_at, updated_at')
        .eq('id', cleanId)
        .maybeSingle();

      if (!error && data) {
        return normalizeStoreSocialLinks(data as Store);
      }
    } catch (err) {
      console.error(`[getStoreById] Exceção na busca:`, err);
    }
  }

  if (!allowsLocalDevelopmentFallback()) return null;

  // Fallback local somente para desenvolvimento explicitamente habilitado.
  const stores = getLocalStores();
  const found = stores.find(s => s.id === storeId || s.id === cleanId);
  if (found) return normalizeStoreSocialLinks(found);

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
        const _userEmail = (authUser.user.email || '').toLowerCase().trim();
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
          return normalizeStoreSocialLinks(storeData as Store);
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
        if (found) return normalizeStoreSocialLinks(found);

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
        return normalizeStoreSocialLinks(newLocalStore);
      } catch (_e) {}
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

      if (data) return normalizeStoreSocialLinks(data as Store);
    } catch (err) {
      console.error('[getStoreByCreatorId] Erro:', err);
    }
  }

  return getCurrentCreatorStore();
}

// 3. Atualizar Dados da Loja
export async function updateStore(storeId: string, updates: Partial<Store>): Promise<Store> {
  const normalizedUpdates = normalizeStoreSocialLinks(updates);
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
          nome_loja: normalizedUpdates.nome_loja || 'Minha Loja',
          slug: normalizedUpdates.slug || `loja-${Date.now()}`,
          ...normalizedUpdates
        })
        .select()
        .single();
        
      if (error) throw new Error(error.message);
      return normalizeStoreSocialLinks(data as Store);
    }

    const { data, error } = await supabase
      .from('stores')
      .update(normalizedUpdates)
      .eq('id', storeId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return normalizeStoreSocialLinks(data as Store);
  }

  // Fallback Local
  const stores = getLocalStores();
  const index = stores.findIndex(s => s.id === storeId);
  const updatedStore = {
    ...(stores[index] || DEFAULT_MOCK_STORE),
    ...normalizedUpdates,
    updated_at: new Date().toISOString()
  };

  if (index >= 0) stores[index] = updatedStore;
  else stores.push(updatedStore);

  saveLocalStores(stores);
  return normalizeStoreSocialLinks(updatedStore);
}

export async function getTopMarketplaceStores(limit: number = 4): Promise<Store[]> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id')
  );

  if (isRealSupabase) {
    try {
      const query = supabase
        .from('stores')
        .select('id, nome_loja, slug, descricao, logo_url, banner_url, cor_primaria, created_at, updated_at')
        .neq('slug', 'eduardoadmin')
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data, error } = await query;

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

export async function getAllPublicStores(): Promise<Store[]> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id') &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const query = supabase
        .from('stores')
        .select('id, nome_loja, slug, descricao, logo_url, banner_url, created_at, updated_at')
        .neq('slug', 'eduardoadmin')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (!error && data) {
        return data as Store[];
      }
    } catch (err) {
      console.error('[getAllPublicStores] Erro:', err);
    }
  }

  // Fallback Local
  return getLocalStores();
}
