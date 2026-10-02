import { isSuperAdmin } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  if (!(await isSuperAdmin(request))) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }
  const { data: stores, error } = await supabaseAdmin.from('stores').select('*');
  return NextResponse.json({ stores, error });
}
