import { supabaseAdmin } from './supabase';
import type { CreatorClubListing } from './types';

export async function getPublicCreatorClubsByStoreId(storeId: string): Promise<CreatorClubListing[]> {
  try {
    const { data: clubs, error } = await supabaseAdmin.from('creator_clubs').select('id,name,slug,description,cover_url,monthly_price,created_at').eq('store_id', storeId).eq('status', 'published').order('created_at', { ascending: false });
    if (error) throw error;
    const ids = (clubs || []).map((club) => club.id);
    const { data: materials, error: materialError } = ids.length ? await supabaseAdmin.from('creator_club_materials').select('club_id').in('club_id', ids) : { data: [], error: null };
    if (materialError) throw materialError;
    return (clubs || []).map((club) => ({ id: club.id, name: club.name, slug: club.slug, description: club.description || '', cover_url: club.cover_url, monthly_price: Number(club.monthly_price), material_count: (materials || []).filter((item) => item.club_id === club.id).length }));
  } catch (error) {
    console.warn('[Creator Clubs] Clubes indisponíveis na vitrine:', error);
    return [];
  }
}
