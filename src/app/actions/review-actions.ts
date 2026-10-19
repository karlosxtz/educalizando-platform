'use server';

import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { Review } from '@/lib/types';
import { writeVerifiedProductReview } from '@/lib/product-review-write';

export async function submitProductReview(params: {
  productId: string; storeId: string; studentId: string; nota: number; comentario?: string;
}): Promise<{ success: boolean; error?: string; data?: Review }> {
  const user = await getRequestUser(new Request('https://www.educalizando.com.br'));
  if (!user) return { success: false, error: 'Faça login para avaliar este material.' };
  return writeVerifiedProductReview(user, params);
}

function formatStudentName(fullName: string): string {
  if (!fullName) return 'Cliente';
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
      .eq('status', 'aprovado')
      .order('created_at', { ascending: false });

    if (error || !reviews) return [];

    const verified = new Set<string>();
    if (reviews.length) {
      const buyers = [...new Set(reviews.map(review => review.student_id).filter(Boolean))];
      for (let offset = 0; offset < buyers.length; offset += 100) {
        const ids = buyers.slice(offset, offset + 100);
        const [items, access] = await Promise.all([
          supabaseAdmin.from('order_items').select('order:orders!inner(student_id,store_id,status)').eq('product_id', productId).eq('order.status', 'paid').in('order.student_id', ids),
          supabaseAdmin.from('student_product_access').select('order:orders!inner(student_id,store_id,status)').eq('product_id', productId).eq('status', 'ACTIVE').eq('order.status', 'paid').in('order.student_id', ids),
        ]);
        for (const result of [items, access]) if (!result.error) for (const item of result.data || []) {
          const order = Array.isArray(item.order) ? item.order[0] : item.order;
          if (order?.student_id && order.store_id) verified.add(`${order.student_id}:${order.store_id}`);
        }
      }
    }

    // Busca os nomes formatados
    const enhancedReviews = await Promise.all(reviews.map(async (review) => {
      let studentName = 'Cliente';
      let avatarUrl = null;
      if (review.student_id) {
        try {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(review.student_id);
          const fullName = userData?.user?.user_metadata?.full_name;
          avatarUrl = userData?.user?.user_metadata?.avatar_url || null;
          if (fullName) {
            studentName = formatStudentName(fullName);
          }
        } catch (_e) {
          // Ignores
        }
      }
      return {
        ...review,
        verified_purchase: verified.has(`${review.student_id}:${review.store_id}`),
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
