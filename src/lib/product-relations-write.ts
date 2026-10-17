import type { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

/** Preserve existing gallery rows until the replacement is successfully inserted. */
export async function replaceProductImages(db: SupabaseClient, productId: string, urls: string[]) {
  const { data: previous, error: readError } = await db.from('product_images').select('id').eq('product_id', productId);
  if (readError) throw readError;
  if (urls.length) {
    const { error } = await db.from('product_images').insert(urls.map((url, ordem) => ({ id: randomUUID(), product_id: productId, url, ordem })));
    if (error) throw error;
  }
  const oldIds = (previous || []).map(row => row.id);
  if (oldIds.length) {
    const { error } = await db.from('product_images').delete().eq('product_id', productId).in('id', oldIds);
    if (error) throw error;
  }
}

/** BNCC has a composite primary key, allowing safe retries through upsert. */
export async function replaceProductSkills(db: SupabaseClient, productId: string, skillIds: string[]) {
  const { data: previous, error: readError } = await db.from('product_bncc_skills').select('bncc_skill_id').eq('product_id', productId);
  if (readError) throw readError;
  if (skillIds.length) {
    const { error } = await db.from('product_bncc_skills').upsert(skillIds.map(bncc_skill_id => ({ product_id: productId, bncc_skill_id })), { onConflict: 'product_id,bncc_skill_id' });
    if (error) throw error;
  }
  const selected = new Set(skillIds);
  const removed = (previous || []).map(row => row.bncc_skill_id).filter(id => !selected.has(id));
  if (removed.length) {
    const { error } = await db.from('product_bncc_skills').delete().eq('product_id', productId).in('bncc_skill_id', removed);
    if (error) throw error;
  }
}
