import { supabase, isRealSupabaseConfigured } from './supabase';
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
  avatarUrl?: string;
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
  // FIX: condição corrigida — salva somente quando window existe (browser)
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STUDENT_ACCESS_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('[saveLocalStudentAccess] Erro ao salvar no localStorage:', e);
    }
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
          cpf: userMetadata.cpf || '',
          avatarUrl: userMetadata.avatar_url || ''
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
          cpf: userMeta.cpf || '',
          avatarUrl: userMeta.avatar_url || ''
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
  if (authSession.isAuthenticated) {
    return {
      id: authSession.userId || 'student-demo',
      email: authSession.email || 'aluno@educalizando.com',
      fullName: authSession.fullName || 'Aluno Educalizando',
      cpf: authSession.cpf || '12345678901',
      avatarUrl: authSession.avatarUrl || ''
    };
  }
  return null;
}

// 5b. Atualizar Perfil do Aluno (Nome e Avatar)
export async function updateStudentProfile(fullName: string, avatarUrl: string | null) {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        avatar_url: avatarUrl
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    if (typeof window !== 'undefined' && data.user) {
      localStorage.setItem('educalizando_student_session', JSON.stringify(data.user));
    }
    return data;
  } else {
    // Fallback
    await new Promise(resolve => setTimeout(resolve, 600));
    if (typeof window !== 'undefined') {
      const studentSess = localStorage.getItem('educalizando_student_session');
      if (studentSess) {
        try {
          const parsed = JSON.parse(studentSess);
          parsed.user_metadata = {
            ...parsed.user_metadata,
            full_name: fullName,
            avatar_url: avatarUrl
          };
          localStorage.setItem('educalizando_student_session', JSON.stringify(parsed));
        } catch (e) {}
      }
    }
    return true;
  }
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
      const { supabaseAdmin } = await import('./supabase');
      await supabaseAdmin.from('student_product_access').insert([{
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
  if (!productId) return false;

  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      let studentEmail = studentId.includes('@') ? studentId.toLowerCase().trim() : '';
      if (!studentEmail) {
        const session = await getCurrentStudentSession();
        if (session?.email) studentEmail = session.email.toLowerCase().trim();
      }

      let query = supabase
        .from('student_product_access')
        .select('*')
        .eq('product_id', productId);

      if (studentEmail && studentEmail !== studentId) {
        query = query.or(`student_id.eq.${studentId},student_id.eq.${studentEmail}`);
      } else {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        const hasActive = data.some(d => {
          const st = (d.status || '').toLowerCase();
          return st === 'active' || st === 'liberado' || st === 'pago';
        });
        if (hasActive) return true;
      }
    } catch (e) {
      console.error('[checkStudentProductAccess] Erro Supabase:', e);
    }
  }

  // Fallback para local access ou modo dev
  const local = getLocalStudentAccess();
  const hasLocal = local.some(l => 
    (l.studentId === studentId || l.studentId.includes(studentId)) && 
    l.productId === productId
  );
  if (hasLocal) return true;

  // Se o produto está na lista de compras do aluno, autoriza
  try {
    const purchases = await getStudentPurchases(studentId);
    return purchases.some(p => p.product_id === productId || p.product?.id === productId);
  } catch (e) {
    return false; // Garantir FAIL CLOSED em caso de dúvida/erro no banco
  }
}

// 8. Obter Compras/Matrículas do Aluno (Estritamente Materiais Pagos/Ativos)
export async function getStudentPurchases(studentId: string): Promise<Purchase[]> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  const realPurchases: Purchase[] = [];

  // Tentar obter o e-mail associado ao aluno para garantir correspondência total
  let studentEmail = studentId.includes('@') ? studentId.toLowerCase().trim() : '';
  if (!studentEmail) {
    const session = await getCurrentStudentSession();
    if (session?.email) studentEmail = session.email.toLowerCase().trim();
  }

  if (isRealSupabase) {
    try {
      // Buscar registros ativos de acesso no student_product_access por ID ou Email
      let query = supabase
        .from('student_product_access')
        .select('*')
        .eq('status', 'ACTIVE');

      if (studentEmail && studentEmail !== studentId) {
        query = query.or(`student_id.eq.${studentId},student_id.eq.${studentEmail}`);
      } else {
        query = query.eq('student_id', studentId);
      }

      const { data: accesses, error } = await query;

      if (!error && accesses && accesses.length > 0) {
        for (const acc of accesses) {
          // Buscar Produto
          const { data: prodData } = await supabase
            .from('products')
            .select('*')
            .eq('id', acc.product_id)
            .is('excluido_em', null)
            .maybeSingle();

          // Buscar Loja
          const { data: storeData } = await supabase
            .from('stores')
            .select('*')
            .eq('id', acc.store_id)
            .maybeSingle();

          // Buscar info de PLR do Pedido
          let isPlrPurchase = false;
          if (acc.order_id) {
            const { data: orderData } = await supabase
              .from('orders')
              .select('is_plr_purchase')
              .eq('id', acc.order_id)
              .maybeSingle();
            if (orderData) {
              isPlrPurchase = orderData.is_plr_purchase === true;
            }
          }

          if (prodData) {
            realPurchases.push({
              id: acc.id,
              student_id: acc.student_id,
              store_id: acc.store_id,
              product_id: acc.product_id,
              status: 'liberado',
              is_plr_purchase: isPlrPurchase,
              created_at: acc.granted_at || acc.created_at || new Date().toISOString(),
              product: {
                id: prodData.id,
                store_id: prodData.store_id,
                titulo: prodData.titulo,
                descricao: prodData.descricao || '',
                preco: Number(prodData.preco || 0),
                tipo: prodData.tipo || 'pdf',
                status: prodData.status || 'publicado',
                is_plr: prodData.is_plr,
                plr_license_url: prodData.plr_license_url,
                capa_url: prodData.capa_url,
                arquivo_url: prodData.arquivo_url,
                created_at: prodData.created_at
              },
              store: storeData ? {
                id: storeData.id,
                creator_id: storeData.creator_id,
                nome_loja: storeData.nome_loja,
                slug: storeData.slug,
                descricao: storeData.descricao,
                logo_url: storeData.logo_url,
                banner_url: storeData.banner_url,
                cor_primaria: storeData.cor_primaria || '#093b6c',
                asaas_subaccount_id: storeData.asaas_subaccount_id,
                created_at: storeData.created_at
              } : undefined
            });
          }
        }
      }
    } catch (e) {
      console.error('[getStudentPurchases] Erro na query principal:', e);
      return []; // FAIL CLOSED: Se a query falhar, não exibe materiais fantasmas
    }
  }

  // Buscar acessos gravados no localStorage para compras locais
  const localAccess = getLocalStudentAccess().filter(a => 
    (a.studentId === studentId || (studentEmail && a.studentId === studentEmail)) && 
    a.status === 'ACTIVE'
  );

  localAccess.forEach(acc => {
    const existsInReal = realPurchases.some(rp => rp.product_id === acc.productId);
    if (!existsInReal) {
      realPurchases.push({
        id: acc.id,
        student_id: acc.studentId,
        store_id: acc.storeId,
        product_id: acc.productId,
        status: 'liberado',
        created_at: acc.grantedAt,
        product: {
          id: acc.productId,
          store_id: acc.storeId,
          titulo: 'Material Adquirido',
          descricao: 'Acesso liberado após confirmação do pagamento.',
          preco: 0,
          tipo: 'pdf',
          status: 'publicado',
          is_plr: false,
          plr_license_url: null,
          capa_url: '/branding/logo-educalizando.png',
          arquivo_url: '',
          created_at: acc.grantedAt
        },
        store: {
          id: acc.storeId,
          creator_id: 'creator-owner',
          nome_loja: 'Loja Educalizando',
          slug: 'loja',
          descricao: 'Loja Oficial',
          logo_url: '/branding/logo-educalizando.png',
          banner_url: null,
          cor_primaria: '#093b6c',
          asaas_subaccount_id: null,
          created_at: acc.grantedAt
        }
      });
    }
  });

  return realPurchases;
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
      const { data, error } = await supabase.storage.from('product-files').createSignedUrl(pathOrUrl, 3600);
      if (!error && data?.signedUrl) return data.signedUrl;
    } catch (e) {
      console.error('[generateSignedFileUrl] Erro Supabase Storage:', e);
    }
  }
  return pathOrUrl;
}
