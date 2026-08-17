import { supabase } from './supabase';
import { Review, ReviewStats } from './types';

const isRealSupabase = () => Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
);

export interface ReviewsPage {
  data: Review[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ReviewFilters {
  page?: number;        // 1-indexed, padrão 1
  pageSize?: number;    // padrão 20
  status?: 'aprovado' | 'pendente' | 'oculto'; // padrão sem filtro
}

// 1. Obter Avaliações por Produto (com paginação)
export async function getReviews(productId: string, filters: ReviewFilters = {}): Promise<ReviewsPage> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const empty: ReviewsPage = { data: [], total: 0, page, pageSize, hasMore: false };

  if (!isRealSupabase()) return empty;

  try {
    let query = supabase
      .from('reviews')
      .select('*', { count: 'exact' })
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.warn('[getReviews] Erro Supabase:', error.message);
      return empty;
    }

    const total = count ?? 0;
    return {
      data: (data ?? []) as Review[],
      total,
      page,
      pageSize,
      hasMore: from + pageSize < total
    };
  } catch (err) {
    console.error('[getReviews] Exceção:', err);
    return empty;
  }
}

// 2. Obter Avaliações por Loja (painel do criador) com paginação
export async function getReviewsByStoreId(storeId: string, filters: ReviewFilters = {}): Promise<ReviewsPage> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const empty: ReviewsPage = { data: [], total: 0, page, pageSize, hasMore: false };

  if (!isRealSupabase()) return empty;

  try {
    let query = supabase
      .from('reviews')
      .select('*', { count: 'exact' })
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.warn('[getReviewsByStoreId] Erro Supabase:', error.message);
      return empty;
    }

    const total = count ?? 0;
    return {
      data: (data ?? []) as Review[],
      total,
      page,
      pageSize,
      hasMore: from + pageSize < total
    };
  } catch (err) {
    console.error('[getReviewsByStoreId] Exceção:', err);
    return empty;
  }
}

// 3. Reviews do Aluno numa loja específica
export async function getStudentReviewsByStore(studentId: string, storeId: string): Promise<Review[]> {
  if (!isRealSupabase()) return [];

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('student_id', studentId)
      .eq('store_id', storeId)
      .limit(50);

    if (!error && data) return data as Review[];
  } catch (err) {
    console.error('[getStudentReviewsByStore] Exceção:', err);
  }

  return [];
}

// 4. Calcular Estatísticas das Avaliações (Média, Total e Distribuição)
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



