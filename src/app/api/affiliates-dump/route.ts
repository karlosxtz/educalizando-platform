import { isSuperAdmin } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!(await isSuperAdmin(request))) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }
  const { data, error } = await supabaseAdmin.from('affiliates').select('*');
  return NextResponse.json({ data, error });
}
