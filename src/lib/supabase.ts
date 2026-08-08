import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummykeyforlocaltesting';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  storeName,
  category
}: {
  email: string;
  password: string;
  fullName: string;
  storeName: string;
  category: string;
}) {
  const storeSlug = storeName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (isRealSupabaseConfigured()) {
    // A. Supabase Auth signUp
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          store_name: storeName,
          store_slug: storeSlug
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
          nome_loja: storeName,
          slug: storeSlug,
          descricao: `Loja oficial de materiais didáticos de ${fullName}.`,
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

    return { user: authData.user, storeSlug: storeData.slug };
  } else {
    // Fallback de Simulação Local
    await new Promise((resolve) => setTimeout(resolve, 800));

    const mockCreator = {
      creator_id: `creator_${Math.random().toString(36).substring(2, 9)}`,
      nome_loja: storeName,
      slug: storeSlug,
      descricao: `Loja oficial de materiais didáticos de ${fullName}.`,
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

    return data;
  } else {
    // Fallback de Simulação Local
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('educalizando_session', JSON.stringify({ email, userId: 'creator-ricardo' }));
    }

    return { user: { email, id: 'creator-ricardo' } };
  }
}

// 3. Logout (signOut)
export async function signOutUser() {
  if (isRealSupabaseConfigured()) {
    await supabase.auth.signOut();
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem('educalizando_session');
  }
}

// 4. Recuperação de Senha (resetPasswordForEmail)
export async function resetPasswordForEmail(email: string) {
  if (isRealSupabaseConfigured()) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login?reset=true`
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
