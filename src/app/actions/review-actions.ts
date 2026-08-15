'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { Review } from '@/lib/types';

export async function submitProductReview(params: {
  productId: string;
  storeId: string;
  studentId: string;
  nota: number;
  comentario?: string;
}): Promise<{ success: boolean; error?: string; data?: Review }> {
  try {
    const isRealSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
    );

    if (!isRealSupabase) {
      return { success: false, error: 'Funcionalidade requer banco de dados real configurado.' };
    }

    if (params.nota < 1 || params.nota > 5) {
      return { success: false, error: 'A nota deve ser entre 1 e 5.' };
    }

    // 2. Validar se o aluno realmente COMPROU o produto verificando orders e order_items
    // Como a tabela 'purchases' antiga está obsoleta, buscamos a origem real da compra (checkout).
    
    // Obter o email do aluno usando o ID (já que orders usa buyer_email)
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(params.studentId);
    const studentEmail = userData?.user?.email?.toLowerCase().trim();

    if (!studentEmail) {
      return { success: false, error: 'Aluno não encontrado ou sem email cadastrado.' };
    }

    // Buscar pedidos pagos deste aluno
    const { data: paidOrders } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('buyer_email', studentEmail)
      .eq('status', 'paid');

    let hasBought = false;

    if (paidOrders && paidOrders.length > 0) {
      const orderIds = paidOrders.map(o => o.id);
      
      // Verificar se o produto está em algum dos pedidos pagos
      const { data: boughtItems } = await supabaseAdmin
        .from('order_items')
        .select('id')
        .eq('product_id', params.productId)
        .in('order_id', orderIds)
        .limit(1);
        
      if (boughtItems && boughtItems.length > 0) {
        hasBought = true;
      }
    }
    
    // Fallback: se for uma compra antiga concedida manualmente ou num formato legado, 
    // checar a tabela student_product_access que é a ponte atual de liberação
    if (!hasBought) {
      const { data: manualAccess } = await supabaseAdmin
        .from('student_product_access')
        .select('id')
        .eq('product_id', params.productId)
        .eq('status', 'ACTIVE')
        .or(`student_id.eq.${params.studentId},student_id.eq.${studentEmail}`)
        .limit(1);
        
      if (manualAccess && manualAccess.length > 0) {
        hasBought = true;
      }
    }

    if (!hasBought) {
      return { success: false, error: 'Apenas alunos que compraram este material podem avaliá-lo.' };
    }

    const payload = {
      product_id: params.productId,
      student_id: params.studentId,
      store_id: params.storeId,
      nota: params.nota,
      comentario: params.comentario || null
    };

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .upsert(payload, { onConflict: 'product_id, student_id', ignoreDuplicates: false })
      .select()
      .single();

    if (error) {
      console.error('[submitProductReview] Erro ao salvar:', error);
      return { success: false, error: 'Erro ao salvar avaliação: ' + error.message };
    }

    return { success: true, data: data as Review };

  } catch (err: any) {
    console.error('[submitProductReview] Exceção:', err);
    return { success: false, error: 'Ocorreu um erro inesperado ao salvar a avaliação.' };
  }
}

function formatStudentName(fullName: string): string {
  if (!fullName) return 'Aluno verificado';
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const last = parts[parts.length - 1];
  return `${first} ${last.charAt(0).toUpperCase()}.`;
}

export async function getProductReviewsWithNames(productId: string): Promise<Review[]> {
  try {
    const isRealSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
    );

    if (!isRealSupabase) return [];

    const { data: reviews, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error || !reviews) return [];

    // Busca os nomes formatados
    const enhancedReviews = await Promise.all(reviews.map(async (review) => {
      let studentName = 'Aluno verificado';
      let avatarUrl = null;
      if (review.student_id) {
        try {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(review.student_id);
          const fullName = userData?.user?.user_metadata?.full_name;
          avatarUrl = userData?.user?.user_metadata?.avatar_url || null;
          if (fullName) {
            studentName = formatStudentName(fullName);
          }
        } catch (e) {
          // Ignores
        }
      }
      return {
        ...review,
        student_name: studentName,
        avatar_url: avatarUrl
      } as Review;
    }));

    return enhancedReviews;

  } catch (err) {
    console.error('[getProductReviewsWithNames] Exceção:', err);
    return [];
  }
}
