import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data: stores, error } = await supabaseAdmin.from('stores').select('*');
  return NextResponse.json({ stores, error });
}
