const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const envStr = fs.readFileSync(envPath, 'utf-8');
const envs = {};
envStr.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [key, ...vals] = line.split('=');
    envs[key.trim()] = vals.join('=').trim().replace(/^"|"$/g, '');
  }
});

const supabaseUrl = envs['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envs['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: store, error: storeErr } = await supabase
    .from('stores')
    .select('id, creator_id')
    .eq('slug', 'eduardortrt')
    .single();

  if (storeErr || !store) {
    console.error('Error finding store:', storeErr);
    return;
  }

  console.log('Store found:', store.id);

  const tx = {
    id: `tx_manual_${Date.now()}`,
    store_id: store.id,
    type: 'SALE',
    gross_amount: 150.00,
    net_amount: 150.00,
    platform_fee_amount: 0.00,
    asaas_fee_amount: 0.00,
    description: 'Bônus de Saldo Adicionado Manualmente pelo Suporte',
    created_at: new Date().toISOString()
  };

  const { error: txErr } = await supabase
    .from('wallet_transactions')
    .insert([tx]);

  if (txErr) {
    console.error('Error inserting transaction:', txErr);
  } else {
    console.log('Successfully added manual balance of R$ 150.00 to store eduardortrt');
  }
}

main();
