import { isSuperAdmin } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  if (!(await isSuperAdmin(request))) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  const { data, error } = await supabaseAdmin.from('admin_audit_logs').select('id, actor_user_id, action, entity_table, entity_id, created_at').order('created_at', { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: 'Não foi possível consultar a auditoria. Confirme a migration.' }, { status: 503 });
  return NextResponse.json({ logs: data || [] });
}
