import { supabase } from './supabase';
import { Purchase, Product, Kit, Store } from './types';
import { getPublicProductsByStoreId } from './store-service';
import { getPublicKitsByStoreId } from './kit-service';

// Mock/Default fallback for local testing
function getLocalPurchases(): Purchase[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('educalizando_student_purchases_v1');
  if (!saved) return [];
  return JSON.parse(saved);
}

function saveLocalPurchases(purchases: Purchase[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('educalizando_student_purchases_v1', JSON.stringify(purchases));
  }
}

// 1. Cadastrar Novo Aluno no Supabase Auth
export async function registerStudentInSupabase({
  email,
  password,
  fullName
}: {
  email: string;
  password: string;
  fullName: string;
}) {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'student'
        }
      }
    });

    if (authError) throw new Error(authError.message);
    return { user: authData.user };
  } else {
    // Fallback Local
    await new Promise(resolve => setTimeout(resolve, 600));
    const mockUser = {
      id: `student_${Date.now()}`,
      email,
      user_metadata: { full_name: fullName, role: 'student' }
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('educalizando_student_session', JSON.stringify(mockUser));
    }
    return { user: mockUser };
  }
}

// 2. Login de Aluno
export async function signInStudent({ email, password }: { email: string; password: string }) {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message);
    }
    return data;
  } else {
    // Fallback Local
    await new Promise(resolve => setTimeout(resolve, 600));
    const mockUser = {
      id: 'student-demo',
      email,
      user_metadata: { full_name: 'Aluno Educalizando', role: 'student' }
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('educalizando_student_session', JSON.stringify(mockUser));
    }
    return { user: { email, id: 'student-demo' } };
  }
}

// 3. Encerrar Sessão do Aluno
export async function signOutStudent() {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    await supabase.auth.signOut();
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem('educalizando_student_session');
  }
}

// 4. Obter Sessão Atual do Aluno
export async function getCurrentStudentSession() {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      return {
        id: data.user.id,
        email: data.user.email || '',
        fullName: data.user.user_metadata?.full_name || 'Aluno Educalizando'
      };
    }
    return null;
  } else {
    if (typeof window !== 'undefined') {
      const sess = localStorage.getItem('educalizando_student_session');
      if (sess) {
        const parsed = JSON.parse(sess);
        return {
          id: parsed.id || 'student-demo',
          email: parsed.email || 'aluno@educalizando.com',
          fullName: parsed.user_metadata?.full_name || 'Aluno Demo'
        };
      }
    }
    return {
      id: 'student-demo',
      email: 'aluno@educalizando.com',
      fullName: 'Aluno Demo Educalizando'
    };
  }
}

// 5. Obter Compras/Matrículas do Aluno
export async function getStudentPurchases(studentId: string): Promise<Purchase[]> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          product:products (*),
          kit:kits (
            *,
            kit_items (
              id,
              product_id,
              products (*)
            )
          ),
          store:stores (*)
        `)
        .eq('student_id', studentId)
        .eq('status', 'liberado')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((p: any) => {
          let kitObj = p.kit;
          if (kitObj && kitObj.kit_items) {
            const kitProds = kitObj.kit_items.map((item: any) => item.products).filter(Boolean);
            kitObj = { ...kitObj, products: kitProds };
          }
          return {
            ...p,
            kit: kitObj
          } as Purchase;
        });
      }
      if (error) {
        console.warn('[getStudentPurchases] Erro Supabase:', error.message);
      }
    } catch (err) {
      console.error('[getStudentPurchases] Exceção:', err);
    }
  }

  // Fallback Local
  const localPurchases = getLocalPurchases().filter(p => p.student_id === studentId);
  if (localPurchases.length > 0) return localPurchases;

  // População automática de amostra de teste local se o aluno ainda não tiver compras criadas
  const mockStore: Store = {
    id: 'store-demo',
    creator_id: 'creator-ricardo',
    nome_loja: 'Prof. Ricardo Silva',
    slug: 'prof-ricardo',
    descricao: 'Apostilas ilustradas e e-books esquematizados para ENEM e Vestibulares.',
    logo_url: null,
    banner_url: null,
    cor_primaria: '#2563eb',
    asaas_subaccount_id: null,
    created_at: new Date().toISOString()
  };

  const samplePurchases: Purchase[] = [
    {
      id: 'pur_demo_1',
      student_id: studentId,
      store_id: 'store-demo',
      status: 'liberado',
      created_at: new Date().toISOString(),
      store: mockStore,
      product: {
        id: 'prod_demo_pdf',
        store_id: 'store-demo',
        titulo: 'Apostila Ilustrada de História do Brasil - ENEM 2026',
        descricao: 'Resumo completo e esquematizado de toda a história do Brasil com mapas mentais e questões comentadas.',
        tipo: 'pdf',
        preco: 29.90,
        capa_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
        arquivo_url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
        status: 'publicado',
        created_at: new Date().toISOString()
      }
    },
    {
      id: 'pur_demo_2',
      student_id: studentId,
      store_id: 'store-demo',
      status: 'liberado',
      created_at: new Date().toISOString(),
      store: mockStore,
      product: {
        id: 'prod_demo_video',
        store_id: 'store-demo',
        titulo: 'Curso em Vídeo: Técnica de Redação Nota 1000',
        descricao: 'Videoaula passo a passo com estrutura pronta de introdução, desenvolvimento e proposta de intervenção.',
        tipo: 'video',
        preco: 49.90,
        capa_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
        arquivo_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        status: 'publicado',
        created_at: new Date().toISOString()
      }
    }
  ];

  saveLocalPurchases(samplePurchases);
  return samplePurchases;
}

// 6. Obter Detalhes de uma Compra Específica com Validação do Aluno
export async function getStudentPurchaseById(purchaseId: string, studentId: string): Promise<Purchase | null> {
  const allPurchases = await getStudentPurchases(studentId);
  const found = allPurchases.find(p => p.id === purchaseId && p.student_id === studentId);
  return found || null;
}

// 7. Gerar URL Assinada Temporária para PDF (Segurança contra link direto)
export async function generateSignedFileUrl(filePath: string): Promise<string> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase && filePath && !filePath.startsWith('http')) {
    try {
      const { data, error } = await supabase.storage
        .from('product-files')
        .createSignedUrl(filePath, 3600); // Válido por 1 hora (3600 segundos)

      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }
    } catch (err) {
      console.error('[generateSignedFileUrl] Erro ao assinar URL:', err);
    }
  }

  // Fallback se for URL completa ou dev
  return filePath;
}
