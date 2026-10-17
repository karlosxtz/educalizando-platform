import 'server-only';
import { cache } from 'react';
import { supabase } from './supabase';

/** Use every approved rating, not just the first review page or stored marketing counters. */
export const readPublicReviewSummary = cache(async (productId: string) => {
  let count = 0;
  let sum = 0;
  for (let from = 0; from < 100000; from += 1000) {
    const { data, error } = await supabase.from('reviews').select('id,nota')
      .eq('product_id', productId).eq('status', 'aprovado')
      .gte('nota', 1).lte('nota', 5).order('id').range(from, from + 999);
    if (error || !data) return { review_count: 0, average_rating: undefined };
    for (const review of data) {
      const rating = Number(review.nota);
      if (Number.isFinite(rating) && rating >= 1 && rating <= 5) { count++; sum += rating; }
    }
    if (data.length < 1000) return { review_count: count, average_rating: count ? Number((sum / count).toFixed(1)) : undefined };
  }
  // Never publish a partial aggregate if a catalogue outgrows this safe read budget.
  return { review_count: 0, average_rating: undefined };
});
