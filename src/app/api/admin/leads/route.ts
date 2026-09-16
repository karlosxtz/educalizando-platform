import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/api-auth';

export async function GET(request: Request) {
  if (!(await isSuperAdmin(request))) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const search = (searchParams.get('q') || '').trim().toLowerCase();
  const exportCsv = searchParams.get('export') === 'csv';

  let query = supabaseAdmin.from('marketing_leads').select('id,email,source,consented_at,created_at').order('created_at', { ascending: false });
  if (search) query = query.ilike('email', `%${search.replace(/[%_]/g, '\\$&')}%`);
  if (!exportCsv) query = query.limit(500);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.code === '42P01' ? 'A tabela de leads não existe. Execute a migration.' : error.message }, { status: 500 });
  const leads = data || [];

  if (exportCsv) {
    const escape = (value: unknown) => `"${String(value || '').replace(/"/g, '""')}"`;
    const csv = ['E-mail,Origem,Consentimento,Cadastro', ...leads.map((lead) => [lead.email, lead.source, lead.consented_at, lead.created_at].map(escape).join(','))].join('\n');
    return new NextResponse(`\uFEFF${csv}`, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="leads-educalizando.csv"' } });
  }
  return NextResponse.json({ leads, total: leads.length });
}
