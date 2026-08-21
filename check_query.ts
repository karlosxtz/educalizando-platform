import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  const { data, error } = await supabaseAdmin
    .from('affiliates')
    .select(`
      *,
      product:products(id, titulo, capa_url)
    `)
    .neq('status', 'cancelado')
    .order('created_at', { ascending: false });

  console.log('Error:', error);
  console.log('Data:', data?.length);
  if (data?.length) {
    console.log('Sample:', data[0]);
  }
}

check();
