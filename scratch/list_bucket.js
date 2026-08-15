const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = envFile.split('\n').reduce((acc, line) => {
  if (line && line.includes('=')) {
    const [key, ...val] = line.split('=');
    acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  }
  return acc;
}, {});

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listFiles() {
  const { data, error } = await supabase.storage.from('product-files').list();
  if (error) {
    console.error('Error listing files:', error);
    return;
  }
  console.log('Files/folders in root:');
  console.log(data);
  
  // also get product table contents
  const { data: dbData } = await supabase.from('products').select('id, titulo, arquivo_url').ilike('arquivo_url', '%3so4r%');
  console.log('DB data:', dbData);
}

listFiles();
