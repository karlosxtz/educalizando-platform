import { supabase } from './supabase';
import { Review, ReviewStats } from './types';

// 1. Obter Avaliações por Produto
export async function getReviews(productId: string): Promise<Review[]> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Formatar student_name se possível
        return data.map((r: any) => ({
          ...r,
          student_name: r.users?.raw_user_meta_data?.full_name || 'Aluno verificado'
        })) as Review[];
      }
      if (error) console.warn('[getReviews] Erro Supabase:', error.message);
    } catch (err) {
      console.error('[getReviews] Exceção:', err);
    }
  }

  return [];
}

export async function getStudentReviewsByStore(studentId: string, storeId: string): Promise<Review[]> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('student_id', studentId)
        .eq('store_id', storeId);

      if (!error && data) {
        return data as Review[];
      }
    } catch (err) {
      console.error('[getStudentReviewsByStore] Exceção:', err);
    }
  }

  return [];
}

// 2. Calcular Estatísticas das Avaliações (Média, Total e Distribuição)
export function calculateReviewStats(reviews: Review[]): ReviewStats {
  if (!reviews || reviews.length === 0) {
    return {
      averageRating: 0.0,
      totalReviews: 0,
      ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }

  const ratingCounts: { [stars: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  reviews.forEach(r => {
    const star = Math.min(5, Math.max(1, Math.round(r.nota)));
    ratingCounts[star] = (ratingCounts[star] || 0) + 1;
    sum += star;
  });

  const averageRating = Number((sum / reviews.length).toFixed(1));

  return {
    averageRating,
    totalReviews: reviews.length,
    ratingCounts
  };
}


