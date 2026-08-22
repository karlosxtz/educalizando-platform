import 'dotenv/config';
import { supabaseAdmin } from './src/lib/supabase';

async function check() {
  const { data: profiles, error: err1 } = await supabaseAdmin.from('affiliate_profiles').select('user_id, slug, nome');
  console.log('Profiles:', profiles, err1);
  
  const { data: affiliations, error: err2 } = await supabaseAdmin.from('affiliates').select('user_id, store_id, product_id, status');
  console.log('Affiliations:', affiliations, err2);

  const { data: products, error: err3 } = await supabaseAdmin.from('products').select('id, nome_produto, status');
  console.log('Products:', products, err3);
}

check();
