import { supabaseAdmin } from './supabase';
import type { CreatorClubListing } from './types';
import { creatorClubMaterialEligible } from './creator-club';

export async function getPublicCreatorClubsByStoreId(storeId: string): Promise<CreatorClubListing[]> {
  try {
    const { data: clubs, error } = await supabaseAdmin.from('creator_clubs').select('id,name,slug,description,cover_url,monthly_price,club_type,created_at').eq('store_id', storeId).eq('status', 'published').order('created_at', { ascending: false });
    if (error) throw error;
    const ids = (clubs || []).map((club) => club.id);
    const { data: materials, error: materialError } = ids.length ? await supabaseAdmin.from('creator_club_materials').select('club_id,products!inner(is_plr,has_plr_delivery)').in('club_id', ids).eq('products.status', 'publicado').eq('products.store_id', storeId).is('products.excluido_em', null) : { data: [], error: null };
    if (materialError) throw materialError;
    return (clubs || []).map((club) => ({ id: club.id, name: club.name, slug: club.slug, description: club.description || '', cover_url: club.cover_url, club_type: club.club_type, monthly_price: Number(club.monthly_price), material_count: (materials || []).filter((item) => item.club_id === club.id && creatorClubMaterialEligible(club.club_type, (Array.isArray(item.products) ? item.products[0] : item.products) || {}, true)).length }));
  } catch (error) {
    console.warn('[Creator Clubs] Clubes indisponíveis na vitrine:', error);
    return [];
  }
}
