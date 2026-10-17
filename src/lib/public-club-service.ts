import { cache } from 'react';
import { supabaseAdmin } from './supabase';
import { normalizePublicAssetUrl } from './public-links';

export type PublicClubData = {
  club: { id: string; name: string; slug: string; description: string; cover_url: string | null; monthly_price: number; club_type: 'final' | 'plr'; stores: { nome_loja: string; slug: string; logo_url: string | null } | { nome_loja: string; slug: string; logo_url: string | null }[] };
  products: Array<{ id: string; titulo: string; capa_url: string | null; slug: string | null }>;
};

export const getPublicClub = cache(async (slug: string): Promise<PublicClubData | null> => {
  const { data: club, error } = await supabaseAdmin.from('creator_clubs')
    .select('id,name,slug,description,cover_url,monthly_price,club_type,store_id,stores(nome_loja,slug,logo_url)')
    .eq('slug', slug).eq('status', 'published').maybeSingle();
  if (error) throw error;
  if (!club) return null;
  const { data: links, error: linksError } = await supabaseAdmin.from('creator_club_materials').select('product_id').eq('club_id', club.id);
  if (linksError) throw linksError;
  const ids = (links || []).map(item => item.product_id);
  let query = supabaseAdmin.from('products').select('id,titulo,capa_url,slug').in('id', ids)
    .eq('store_id', club.store_id).eq('status', 'publicado').is('excluido_em', null);
  if (club.club_type === 'plr') query = query.eq('is_plr', true).eq('has_plr_delivery', true);
  const { data: products, error: productError } = ids.length ? await query : { data: [], error: null };
  if (productError) throw productError;
  const { store_id: _storeId, ...publicClub } = club;
  const stores = publicClub.stores as PublicClubData['club']['stores'];
  return { club: { ...publicClub, cover_url: normalizePublicAssetUrl(publicClub.cover_url),
    stores: Array.isArray(stores)
      ? stores.map(store => ({ ...store, logo_url: normalizePublicAssetUrl(store.logo_url) }))
      : stores ? { ...stores, logo_url: normalizePublicAssetUrl(stores.logo_url) } : stores },
    products: (products || []).map(product => ({ ...product, capa_url: normalizePublicAssetUrl(product.capa_url) })) } as PublicClubData;
});
