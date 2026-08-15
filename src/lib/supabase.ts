import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummykeyforlocaltesting';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export function isRealSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );
}

// 1. Cadastro Completo com Validação Estrita do Insert em stores
export async function registerCreatorInSupabase({
  email,
  password,
  fullName,
  cpf,
  storeName,
  category
}: {
  email: string;
  password: string;
  fullName: string;
  cpf: string;
  storeName: string;
  category: string;
}) {
  const cleanCpf = cpf.replace(/\D/g, '');
  
  // Garantir que o nome da loja seja humano e não o e-mail
  let realStoreName = storeName && !storeName.includes('@') ? storeName.trim() : `Loja de ${fullName.split(' ')[0]}`;
  if (!realStoreName || realStoreName.length < 2) {
    realStoreName = `Loja de ${fullName}`;
  }

  let storeSlug = realStoreName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!storeSlug || storeSlug.length < 2) {
    storeSlug = `loja-${Math.random().toString(36).substring(2, 7)}`;
  }

  if (isRealSupabaseConfigured()) {
    // A. Supabase Auth signUp com Metadata de Criador
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          cpf: cleanCpf,
          store_name: realStoreName,
          store_slug: storeSlug,
          role: 'creator',
          is_creator: true
        }
      }
    });

    if (authError) throw new Error(authError.message);

    const userId = authData.user?.id;
    if (!userId) {
      throw new Error('Falha ao obter ID do usuário criado.');
    }

    // B. Inserção estrita na tabela stores (com tratamento de erro se falhar)
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .insert([
        {
          creator_id: userId,
          nome_loja: realStoreName,
          slug: storeSlug,
          descricao: `Loja oficial de infoprodutos de ${fullName}.`,
          cor_primaria: '#ff5722',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (storeError) {
      console.error('Erro ao salvar loja no banco:', storeError);
      throw new Error(`Conta criada, mas ocorreu um erro ao registrar sua loja: ${storeError.message}`);
    }

    const createdStore = {
      id: storeData.id,
      creator_id: userId,
      nome_loja: storeData.nome_loja,
      slug: storeData.slug,
      descricao: storeData.descricao || `Loja oficial de infoprodutos de ${fullName}.`,
      logo_url: storeData.logo_url || null,
      banner_url: storeData.banner_url || null,
      cor_primaria: storeData.cor_primaria || '#ff5722',
      asaas_subaccount_id: storeData.asaas_subaccount_id || null,
      created_at: storeData.created_at || new Date().toISOString()
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('educalizando_creator_session', JSON.stringify({
        id: userId,
        email,
        cpf: cleanCpf,
        storeId: createdStore.id,
        storeSlug: createdStore.slug,
        fullName,
        storeName
      }));

      const existingStoresKey = 'educalizando_stores_v3';
      const existingStores = JSON.parse(localStorage.getItem(existingStoresKey) || '[]');
      existingStores.push(createdStore);
      localStorage.setItem(existingStoresKey, JSON.stringify(existingStores));
      
      // Sincronizar Cookie para Middleware (Hiper Seguro)
      try {
        await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: authData.session?.access_token,
            refresh_token: authData.session?.refresh_token
          })
        });
      } catch (e) {
        console.error('Erro ao sincronizar cookie seguro no registro:', e);
      }
    }

    return { user: authData.user, storeSlug: storeData.slug };
  } else {
    // Fallback de Simulação Local
    await new Promise((resolve) => setTimeout(resolve, 800));

    const mockCreator = {
      creator_id: `creator_${Math.random().toString(36).substring(2, 9)}`,
      nome_loja: storeName,
      slug: storeSlug,
      descricao: `Loja oficial de infoprodutos de ${fullName}.`,
      cor_primaria: '#ff5722',
      created_at: new Date().toISOString()
    };

    if (typeof window !== 'undefined') {
      const existing = JSON.parse(localStorage.getItem('educalizando_creators') || '[]');
      existing.push(mockCreator);
      localStorage.setItem('educalizando_creators', JSON.stringify(existing));
      localStorage.setItem('educalizando_session', JSON.stringify({ email, userId: mockCreator.creator_id }));
    }

    return { user: { email, id: mockCreator.creator_id }, storeSlug };
  }
}

// 2. Login de Usuário (signInWithPassword)
export async function signInUser({ email, password }: { email: string; password: string }) {
  if (isRealSupabaseConfigured()) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message);
    }

    if (typeof window !== 'undefined' && data?.user) {
      // Limpar qualquer sessão antiga gravada no navegador
      localStorage.removeItem('educalizando_creator_session');
      localStorage.removeItem('educalizando_session');
      localStorage.removeItem('educalizando_student_session');

      const userMeta = data.user.user_metadata || {};
      const cleanStoreName = userMeta.store_name && !userMeta.store_name.includes('@')
        ? userMeta.store_name
        : (userMeta.full_name ? `Loja de ${userMeta.full_name}` : `Loja de ${email.split('@')[0]}`);

      const cleanStoreSlug = userMeta.store_slug || cleanStoreName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

      localStorage.setItem('educalizando_creator_session', JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        cpf: userMeta.cpf || '',
        fullName: userMeta.full_name || email.split('@')[0],
        storeName: cleanStoreName,
        storeSlug: cleanStoreSlug
      }));
      
      // Sincronizar Cookie para Middleware (Hiper Seguro)
      try {
        await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: data.session?.access_token,
            refresh_token: data.session?.refresh_token
          })
        });
      } catch (e) {
        console.error('Erro ao sincronizar cookie seguro:', e);
      }
    }

    return data;
  } else {
    // Fallback de Simulação Local
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('educalizando_creator_session');
      localStorage.setItem('educalizando_session', JSON.stringify({ email, userId: `creator_${email.replace(/[^a-z0-9]/g, '_')}` }));
      localStorage.setItem('educalizando_creator_session', JSON.stringify({
        id: `creator_${email.replace(/[^a-z0-9]/g, '_')}`,
        email,
        storeName: `Loja de ${email.split('@')[0]}`,
        storeSlug: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-')
      }));
    }

    return { user: { email, id: `creator_${email.replace(/[^a-z0-9]/g, '_')}` } };
  }
}

// 3. Logout (signOut)
export async function signOutUser() {
  if (isRealSupabaseConfigured()) {
    await supabase.auth.signOut();
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem('educalizando_session');
    localStorage.removeItem('educalizando_creator_session');
    localStorage.removeItem('educalizando_student_session');
    localStorage.removeItem('educalizando_stores_v3');
    
    try {
      await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'SIGNED_OUT' })
      });
    } catch (e) {}
  }
}

// 4. Recuperação de Senha (resetPasswordForEmail)
export async function resetPasswordForEmail(email: string) {
  if (isRealSupabaseConfigured()) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/login?reset=true`
    });
    if (error) throw new Error(error.message);
  } else {
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
  return true;
}

// 5. Obter Sessão Atual
export async function getCurrentUserSession() {
  if (isRealSupabaseConfigured()) {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } else {
    if (typeof window !== 'undefined') {
      const sess = localStorage.getItem('educalizando_session');
      return sess ? JSON.parse(sess) : { email: 'prof.ricardo@gmail.com' };
    }
    return { email: 'prof.ricardo@gmail.com' };
  }
}
