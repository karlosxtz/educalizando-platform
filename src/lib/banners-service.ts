import { supabase } from './supabase';

export interface MainBanner {
  id: string;
  title: string | null;
  image_desktop_url: string;
  image_mobile_url: string | null;
  link_url: string | null;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

export async function getActiveBanners(): Promise<MainBanner[]> {
  try {
    const { data, error } = await supabase
      .from('main_banners')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active banners:', error);
      return [];
    }

    return data as MainBanner[];
  } catch (err) {
    console.error('Exception fetching active banners:', err);
    return [];
  }
}

export async function getAllBanners(): Promise<MainBanner[]> {
  const { data, error } = await supabase
    .from('main_banners')
    .select('*')
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as MainBanner[];
}

export async function createBanner(banner: Partial<MainBanner>): Promise<MainBanner> {
  const { data, error } = await supabase
    .from('main_banners')
    .insert([banner])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as MainBanner;
}

export async function updateBanner(id: string, updates: Partial<MainBanner>): Promise<MainBanner> {
  const { data, error } = await supabase
    .from('main_banners')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as MainBanner;
}

export async function deleteBanner(id: string): Promise<void> {
  const { error } = await supabase
    .from('main_banners')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function reorderBanners(orderedIds: string[]): Promise<void> {
  const updates = orderedIds.map((id, index) => ({
    id,
    order_index: index,
  }));

  const { error } = await supabase
    .from('main_banners')
    .upsert(updates);

  if (error) {
    throw new Error(error.message);
  }
}
