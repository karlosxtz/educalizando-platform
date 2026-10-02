import { supabase } from './supabase';
import { getCurrentStudentSession, getLocalStudentAccess, type GroupedStudentStore } from './student-service';
import { Purchase, Store } from './types';

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
            const { data: originalDelivery } = await supabase
              .from('product_deliveries')
              .select('arquivo_url')
              .eq('product_id', prodData.id)
              .maybeSingle();
            const originalUrl = originalDelivery?.arquivo_url || null;
            const isCreatorExternalLink = /^https:\/\//i.test(originalUrl || '') && !/supabase\.co\//i.test(originalUrl || '');
            realPurchases.push({
              id: acc.id,
              order_id: acc.order_id || null,
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
                plr_license_url: prodData.has_plr_delivery ? `/api/aluno/materiais/${prodData.id}/download?type=plr` : null,
                capa_url: prodData.capa_url,
                arquivo_url: prodData.has_original_delivery ? (isCreatorExternalLink ? originalUrl : `/api/aluno/materiais/${prodData.id}/download`) : null,
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
        order_id: acc.orderId || null,
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
