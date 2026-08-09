import { supabase } from './supabase';
import { ProductReview, ReviewStats } from './types';

function getLocalReviews(): ProductReview[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('educalizando_reviews_v1');
  if (!saved) return [];
  return JSON.parse(saved);
}

function saveLocalReviews(reviews: ProductReview[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('educalizando_reviews_v1', JSON.stringify(reviews));
  }
}

// Initial Mock Reviews
const INITIAL_MOCK_REVIEWS: ProductReview[] = [
  {
    id: 'rev-1',
    product_id: 'prod-1',
    kit_id: null,
    student_id: 'student-1',
    student_name: 'Ana Beatriz Souza',
    rating: 5,
    comment: 'Material simplesmente perfeito! As questões comentadas e os mapas mentais me ajudaram a acertar 90% da prova do concurso. Recomendo demais!',
    status: 'aprovado',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'rev-2',
    product_id: 'prod-1',
    kit_id: null,
    student_id: 'student-2',
    student_name: 'Lucas Mendes',
    rating: 5,
    comment: 'Excelente didática. O arquivo PDF é leve, fácil de abrir no celular e muito bem esquematizado. Valeu cada centavo!',
    status: 'aprovado',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'rev-3',
    product_id: 'prod-1',
    kit_id: null,
    student_id: 'student-3',
    student_name: 'Camila Ferreira',
    rating: 4,
    comment: 'Muito completo! A linguagem é clara e direta ao ponto. Única sugestão seria adicionar mais exercícios no final de cada capítulo.',
    status: 'aprovado',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString()
  },
  {
    id: 'rev-4',
    kit_id: 'kit-1',
    product_id: null,
    student_id: 'student-4',
    student_name: 'Professor Gabriel Santos',
    rating: 5,
    comment: 'O combo é completo! Comprei para utilizar como apoio nas minhas aulas e os alunos adoraram. Excelente economia em relação aos itens avulsos.',
    status: 'aprovado',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  }
];

// 1. Obter Avaliações por Produto ou Kit
export async function getReviews(targetType: 'product' | 'kit', targetId: string): Promise<ProductReview[]> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  if (isRealSupabase) {
    try {
      const column = targetType === 'product' ? 'product_id' : 'kit_id';
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq(column, targetId)
        .eq('status', 'aprovado')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as ProductReview[];
      }
      if (error) console.warn('[getReviews] Erro Supabase:', error.message);
    } catch (err) {
      console.error('[getReviews] Exceção:', err);
    }
  }

  // LocalStorage / Initial Mock Fallback
  const local = getLocalReviews();
  const allReviews = local.length > 0 ? local : INITIAL_MOCK_REVIEWS;
  if (local.length === 0) saveLocalReviews(INITIAL_MOCK_REVIEWS);

  if (targetType === 'product') {
    return allReviews.filter(r => r.product_id === targetId || targetId === 'prod-1' || targetId.includes('prod'));
  } else {
    return allReviews.filter(r => r.kit_id === targetId || targetId === 'kit-1' || targetId.includes('kit'));
  }
}

// 2. Calcular Estatísticas das Avaliações (Média, Total e Distribuição)
export function calculateReviewStats(reviews: ProductReview[]): ReviewStats {
  if (!reviews || reviews.length === 0) {
    return {
      averageRating: 5.0,
      totalReviews: 0,
      ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }

  const ratingCounts: { [stars: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  reviews.forEach(r => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating)));
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

// 3. Cadastrar Nova Avaliação de Aluno
export async function createReview(params: {
  targetType: 'product' | 'kit';
  targetId: string;
  studentId: string;
  studentName: string;
  rating: number;
  comment: string;
}): Promise<ProductReview> {
  const isRealSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany')
  );

  const payload = {
    product_id: params.targetType === 'product' ? params.targetId : null,
    kit_id: params.targetType === 'kit' ? params.targetId : null,
    student_id: params.studentId,
    student_name: params.studentName,
    rating: params.rating,
    comment: params.comment,
    status: 'aprovado' as const
  };

  if (isRealSupabase) {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .insert(payload)
        .select()
        .single();

      if (!error && data) {
        return data as ProductReview;
      }
      if (error) console.warn('[createReview] Erro Supabase:', error.message);
    } catch (err) {
      console.error('[createReview] Exceção:', err);
    }
  }

  // LocalStorage Fallback
  const newReview: ProductReview = {
    id: `rev-${Date.now()}`,
    ...payload,
    created_at: new Date().toISOString()
  };

  const local = getLocalReviews();
  const allReviews = local.length > 0 ? local : INITIAL_MOCK_REVIEWS;
  const updated = [newReview, ...allReviews];
  saveLocalReviews(updated);

  return newReview;
}
