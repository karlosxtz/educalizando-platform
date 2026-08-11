import { supabase } from './supabase';
import { Purchase, Product, Kit, Store } from './types';
import { getPublicProductsByStoreId } from './store-service';
import { getPublicKitsByStoreId } from './kit-service';

export interface StudentAuthSession {
  isAuthenticated: boolean;
  role: 'student' | 'creator' | null;
  userId?: string;
  email?: string;
  fullName?: string;
  cpf?: string;
}

export interface StudentProductAccessRecord {
  id: string;
  studentId: string;
  productId: string;
  orderId?: string;
  storeId: string;
  status: 'ACTIVE' | 'REVOKED';
  grantedAt: string;
}

export interface GroupedStudentStore {
  store: Store;
  purchasesCount: number;
}

const LOCAL_STUDENT_ACCESS_KEY = 'educalizando_student_product_access_v1';

function getLocalStudentAccess(): StudentProductAccessRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STUDENT_ACCESS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalStudentAccess(list: StudentProductAccessRecord[]) {
  if (typeof window === 'undefined') {
    try {
      localStorage.setItem(LOCAL_STUDENT_ACCESS_KEY, JSON.stringify(list));
    } catch (e) {}
  }
}

// 1. Obter Papel e Sessão do Usuário Autenticado
export async function getAuthenticatedUserRole(): Promise<StudentAuthSession> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const { data } = await supabase.auth.getUser();
      if (data && data.user) {
        const userMetadata = data.user.user_metadata || {};
        const rawRole = userMetadata.role || (userMetadata.is_creator ? 'creator' : 'student');
        const role = (rawRole === 'creator' || rawRole === 'seller' || rawRole === 'admin') ? 'creator' : 'student';

        // Sincronizar localmente no navegador
        if (typeof window !== 'undefined' && role === 'student') {
          localStorage.setItem('educalizando_student_session', JSON.stringify(data.user));
        }

        return {
          isAuthenticated: true,
          role,
          userId: data.user.id,
          email: data.user.email || '',
          fullName: userMetadata.full_name || 'Aluno Educalizando',
          cpf: userMetadata.cpf || ''
        };
      }
    } catch (e) {
      console.warn('[getAuthenticatedUserRole] Supabase error:', e);
    }
  }

  // Fallback para sessão gravada no navegador
  if (typeof window !== 'undefined') {
    const studentSess = localStorage.getItem('educalizando_student_session');
    if (studentSess) {
      try {
        const parsed = JSON.parse(studentSess);
        const userMeta = parsed.user_metadata || {};
        return {
          isAuthenticated: true,
          role: 'student',
          userId: parsed.id || 'student-demo',
          email: parsed.email || 'aluno@educalizando.com',
          fullName: userMeta.full_name || 'Aluno Educalizando',
          cpf: userMeta.cpf || ''
        };
      } catch (e) {}
    }

    const creatorSess = localStorage.getItem('educalizando_creator_session');
    if (creatorSess) {
      try {
        const parsed = JSON.parse(creatorSess);
        return {
          isAuthenticated: true,
          role: 'creator',
          userId: parsed.id || 'creator-demo',
          email: parsed.email || 'prof.ricardo@gmail.com',
          fullName: parsed.user_metadata?.full_name || 'Prof. Ricardo'
        };
      } catch (e) {}
    }
  }

  return { isAuthenticated: false, role: null };
}

// 2. Cadastrar Novo Aluno no Supabase Auth
export async function registerStudentInSupabase({
  email,
  password,
  fullName,
  cpf
}: {
  email: string;
  password: string;
  fullName: string;
  cpf?: string;
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
          cpf: cpf ? cpf.replace(/\D/g, '') : undefined,
          role: 'student'
        }
      }
    });

    if (authError) throw new Error(authError.message);

    if (typeof window !== 'undefined' && authData.user) {
      localStorage.setItem('educalizando_student_session', JSON.stringify(authData.user));
    }

    return { user: authData.user };
  } else {
    await new Promise(resolve => setTimeout(resolve, 600));
    const mockUser = {
      id: `student_${Date.now()}`,
      email,
      user_metadata: { full_name: fullName, cpf: cpf ? cpf.replace(/\D/g, '') : '12345678901', role: 'student' }
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('educalizando_student_session', JSON.stringify(mockUser));
    }
    return { user: mockUser };
  }
}

// 3. Login de Aluno
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

    if (typeof window !== 'undefined' && data.user) {
      localStorage.setItem('educalizando_student_session', JSON.stringify(data.user));
    }

    return data;
  } else {
    await new Promise(resolve => setTimeout(resolve, 600));
    const mockUser = {
      id: 'student-demo',
      email,
      user_metadata: { full_name: 'Aluno Educalizando', cpf: '12345678901', role: 'student' }
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('educalizando_student_session', JSON.stringify(mockUser));
    }
    return { user: { email, id: 'student-demo' } };
  }
}

// 4. Encerrar Sessão do Aluno
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

// 5. Obter Sessão Atual do Aluno
export async function getCurrentStudentSession() {
  const authSession = await getAuthenticatedUserRole();
  if (authSession.isAuthenticated && authSession.role === 'student') {
    return {
      id: authSession.userId || 'student-demo',
      email: authSession.email || 'aluno@educalizando.com',
      fullName: authSession.fullName || 'Aluno Educalizando',
      cpf: authSession.cpf || '12345678901'
    };
  }
  return null;
}

// 6. Conceder Acesso ao Material Comprado (student_product_access)
export async function grantStudentProductAccess(data: {
  studentId: string;
  productId: string;
  orderId?: string;
  storeId: string;
}): Promise<StudentProductAccessRecord> {
  const now = new Date().toISOString();
  const recordId = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newRecord: StudentProductAccessRecord = {
    id: recordId,
    studentId: data.studentId,
    productId: data.productId,
    orderId: data.orderId,
    storeId: data.storeId,
    status: 'ACTIVE',
    grantedAt: now
  };

  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      await supabase.from('student_product_access').insert([{
        id: newRecord.id,
        student_id: newRecord.studentId,
        product_id: newRecord.productId,
        order_id: newRecord.orderId,
        store_id: newRecord.storeId,
        status: newRecord.status,
        granted_at: newRecord.grantedAt
      }]);
    } catch (e) {
      console.error('[grantStudentProductAccess] Erro Supabase:', e);
    }
  }

  const local = getLocalStudentAccess();
  const exists = local.some(l => l.studentId === data.studentId && l.productId === data.productId && l.status === 'ACTIVE');
  if (!exists) {
    local.unshift(newRecord);
    saveLocalStudentAccess(local);
  }

  return newRecord;
}

// 7. Verificar se o Aluno possui Acesso Ativo ao Material (Entitlement Check)
export async function checkStudentProductAccess({
  studentId,
  productId
}: {
  studentId: string;
  productId: string;
}): Promise<boolean> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const { data, error } = await supabase
        .from('student_product_access')
        .select('*')
        .eq('student_id', studentId)
        .eq('product_id', productId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (!error && data) return true;
    } catch (e) {
      console.error('[checkStudentProductAccess] Erro Supabase:', e);
    }
  }

  const local = getLocalStudentAccess();
  return local.some(l => l.studentId === studentId && l.productId === productId && l.status === 'ACTIVE');
}

// 8. Obter Compras/Matrículas do Aluno
export async function getStudentPurchases(studentId: string): Promise<Purchase[]> {
  const localAccess = getLocalStudentAccess().filter(a => a.studentId === studentId && a.status === 'ACTIVE');

  if (localAccess.length === 0) {
    const demoProd: Product = {
      id: 'prod-demo-1',
      store_id: 'store-demo',
      titulo: 'Apostila de Matemática ENEM 2026',
      descricao: 'Material completo com 500 questões resolvidas',
      preco: 49.90,
      tipo: 'pdf',
      status: 'publicado',
      capa_url: '/branding/logo-educalizando.png',
      arquivo_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      created_at: new Date().toISOString()
    };

    const demoStore: Store = {
      id: 'store-demo',
      creator_id: 'creator-demo',
      nome_loja: 'Prof. Ricardo Silva',
      slug: 'prof-ricardo',
      descricao: 'Apostilas e simulados preparatórios para vestibulares e concursos',
      logo_url: '/branding/logo-educalizando.png',
      banner_url: null,
      cor_primaria: '#093b6c',
      asaas_subaccount_id: null,
      created_at: new Date().toISOString()
    };

    return [
      {
        id: 'pur_demo_1',
        student_id: studentId,
        store_id: 'store-demo',
        product_id: 'prod-demo-1',
        status: 'liberado',
        created_at: new Date().toISOString(),
        product: demoProd,
        store: demoStore
      }
    ];
  }

  return localAccess.map(acc => {
    const p: Product = {
      id: acc.productId,
      store_id: acc.storeId,
      titulo: 'Material Didático Digital',
      descricao: 'Material completo adquirido na plataforma',
      preco: 49.90,
      tipo: 'pdf',
      status: 'publicado',
      capa_url: '/branding/logo-educalizando.png',
      arquivo_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      created_at: acc.grantedAt
    };

    const s: Store = {
      id: acc.storeId,
      creator_id: 'creator-demo',
      nome_loja: 'Prof. Ricardo Silva',
      slug: 'prof-ricardo',
      descricao: 'Loja do Criador',
      logo_url: '/branding/logo-educalizando.png',
      banner_url: null,
      cor_primaria: '#093b6c',
      asaas_subaccount_id: null,
      created_at: acc.grantedAt
    };

    return {
      id: acc.id,
      student_id: acc.studentId,
      store_id: acc.storeId,
      product_id: acc.productId,
      status: 'liberado',
      created_at: acc.grantedAt,
      product: p,
      store: s
    };
  });
}

// 9. Obter Lojas do Aluno Agrupadas
export async function getStudentStoresGrouped(studentId: string): Promise<GroupedStudentStore[]> {
  const purchases = await getStudentPurchases(studentId);
  const storeMap = new Map<string, { store: Store; count: number }>();

  purchases.forEach(pur => {
    if (pur.store) {
      const existing = storeMap.get(pur.store.id);
      if (existing) {
        existing.count += 1;
      } else {
        storeMap.set(pur.store.id, { store: pur.store, count: 1 });
      }
    }
  });

  return Array.from(storeMap.values()).map(v => ({
    store: v.store,
    purchasesCount: v.count
  }));
}

// 10. Obter Materiais Adquiridos por Loja Específica
export async function getStudentPurchasesByStoreId(studentId: string, storeId: string): Promise<{ store: Store; purchases: Purchase[] }> {
  const purchases = await getStudentPurchases(studentId);
  const filtered = purchases.filter(p => p.store_id === storeId);
  const store: Store = filtered[0]?.store || {
    id: storeId,
    creator_id: 'creator-demo',
    nome_loja: 'Prof. Ricardo Silva',
    slug: 'prof-ricardo',
    descricao: 'Loja de materiais didáticos',
    logo_url: '/branding/logo-educalizando.png',
    banner_url: null,
    cor_primaria: '#093b6c',
    asaas_subaccount_id: null,
    created_at: new Date().toISOString()
  };

  return { store, purchases: filtered };
}

// 11. Obter Detalhes de uma Compra por ID
export async function getStudentPurchaseById(purchaseId: string, studentId: string): Promise<Purchase | null> {
  const purchases = await getStudentPurchases(studentId);
  return purchases.find(p => p.id === purchaseId || p.product_id === purchaseId) || purchases[0] || null;
}

// 12. Gerar Signed URL Seguro para Download de Arquivo Privado (Item 27 da Especificação)
export async function generateSignedFileUrl(pathOrUrl: string): Promise<string> {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const { data, error } = await supabase.storage.from('infoproducts').createSignedUrl(pathOrUrl, 3600);
      if (!error && data?.signedUrl) return data.signedUrl;
    } catch (e) {
      console.error('[generateSignedFileUrl] Erro Supabase Storage:', e);
    }
  }
  return pathOrUrl;
}
