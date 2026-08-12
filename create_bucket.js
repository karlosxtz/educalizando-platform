const { createClient } = require('@supabase/supabase-js');


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Using Service Role Key if available to bypass RLS for bucket creation
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkAndCreateBucket() {
  console.log('Fetching buckets...');
  const { data: buckets, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error('Error fetching buckets:', error);
    return;
  }
  
  console.log('Existing buckets:', buckets.map(b => b.name));
  
  const bucketName = 'product-files';
  const bucketExists = buckets.some(b => b.name === bucketName);
  
  if (bucketExists) {
    console.log(`Bucket "${bucketName}" already exists.`);
  } else {
    console.log(`Bucket "${bucketName}" not found. Creating it...`);
    const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
      public: false,
      allowedMimeTypes: ['application/pdf', 'application/zip', 'application/x-zip-compressed'],
      fileSizeLimit: 15728640 // 15MB
    });
    
    if (createError) {
      console.error('Error creating bucket:', createError);
    } else {
      console.log('Bucket created successfully:', data);
    }
  }
}

checkAndCreateBucket();
