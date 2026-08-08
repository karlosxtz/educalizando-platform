import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummykeyforlocaltesting';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function registerCreatorInSupabase({
  email,
  password,
  fullName,
  storeName,
  category
}: {
  email: string;
  password: string;
  fullName: string;
  storeName: string;
  category: string;
}) {
  const storeSlug = storeName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // Check if live Supabase key is configured
  const isRealSupabaseConfigured = 
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('xyzcompany');

  if (isRealSupabaseConfigured) {
    // 1. Supabase Auth signUp
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          store_name: storeName,
          store_slug: storeSlug
        }
      }
    });

    if (authError) throw new Error(authError.message);

    const userId = authData.user?.id || `usr_${Date.now()}`;

    // 2. Insert into creators table with multi-tenant creator_id / tenant_id
    const { error: dbError } = await supabase.from('creators').insert([
      {
        creator_id: userId,
        tenant_id: `tenant_${storeSlug}`,
        full_name: fullName,
        email,
        store_name: storeName,
        store_slug: storeSlug,
        category,
        created_at: new Date().toISOString()
      }
    ]);

    if (dbError) {
      console.warn('Postgres table insert warning:', dbError.message);
    }

    return { user: authData.user, storeSlug };
  } else {
    // Fallback simulation for seamless local testing
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const mockCreator = {
      creator_id: `creator_${Math.random().toString(36).substring(2, 9)}`,
      tenant_id: `tenant_${storeSlug}`,
      full_name: fullName,
      email,
      store_name: storeName,
      store_slug: storeSlug,
      category,
      created_at: new Date().toISOString()
    };

    // Save to local storage for testing persistence
    const existing = JSON.parse(localStorage.getItem('educalizando_creators') || '[]');
    existing.push(mockCreator);
    localStorage.setItem('educalizando_creators', JSON.stringify(existing));

    return { user: { email, id: mockCreator.creator_id }, storeSlug };
  }
}
