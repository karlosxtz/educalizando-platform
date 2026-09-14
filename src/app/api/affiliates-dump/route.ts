import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!(await isSuperAdmin(request))) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }
  const { data, error } = await supabaseAdmin.from('affiliates').select('*');
  return NextResponse.json({ data, error });
}
