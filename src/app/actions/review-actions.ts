'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { Review } from '@/lib/types';
import { getStudentPurchases } from '@/lib/student-service';

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

    const purchases = await getStudentPurchases(params.studentId);
    const hasBought = purchases.some(p => p.product_id === params.productId && (p.status === 'pago' || p.status === 'liberado'));
    
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
    return { success: false, error: err.message || 'Erro inesperado ao salvar avaliação.' };
  }
}
