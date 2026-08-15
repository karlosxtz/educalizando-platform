import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data: dbData } = await supabase
    .from('products')
    .select('id, titulo, arquivo_url')
    .ilike('arquivo_url', '%3so4r%');
    
  const { data: storageData, error: storageError } = await supabase
    .storage
    .from('product-files')
    .list();

  return NextResponse.json({
    dbData,
    storageData: storageData?.slice(0, 50),
    storageError
  });
}
