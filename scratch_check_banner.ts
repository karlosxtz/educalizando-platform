import 'dotenv/config';
import { supabaseAdmin } from './src/lib/supabase';

async function check() {
  const { data: profiles, error } = await supabaseAdmin
    .from('affiliate_profiles')
    .select('user_id, slug, banner_url, logo_url, cor_primaria')
    .not('banner_url', 'is', null)
    .limit(1);
    
  console.log('Profile with banner:', profiles, error);
}

check();
