import { NextResponse } from 'next/server';
import { getRequestUser, isSuperAdmin } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

function databaseMessage(error: { code?: string; message?: string }) {
  if (error.code === '42P01') return 'Aplique a migration 20260920_add_customer_refund_requests.sql para ativar as solicitações de reembolso.';
  return error.message || 'Não foi possível carregar as solicitações.';
}

export async function GET(request: Request) {
  try {
    if (!(await isSuperAdmin(request))) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    const { data, error } = await supabaseAdmin
      .from('order_refund_requests')
      .select('id, order_id, requester_email, reason, status, review_note, created_at, reviewed_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) return NextResponse.json({ error: databaseMessage(error) }, { status: 500 });
    return NextResponse.json({ success: true, requests: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Não foi possível carregar as solicitações.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await isSuperAdmin(request))) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    const admin = await getRequestUser(request);
    if (!admin?.id) return NextResponse.json({ error: 'Sessão administrativa inválida.' }, { status: 401 });
    const body = await request.json().catch(() => null);
    const id = typeof body?.id === 'string' ? body.id : '';
    const reviewNote = typeof body?.reviewNote === 'string' ? body.reviewNote.trim() : '';
    if (!id || reviewNote.length < 5 || reviewNote.length > 1000) {
      return NextResponse.json({ error: 'Informe uma justificativa entre 5 e 1.000 caracteres.' }, { status: 422 });
    }
    const { data, error } = await supabaseAdmin
      .from('order_refund_requests')
      .update({ status: 'REJECTED', review_note: reviewNote, reviewed_by: admin.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('status', 'PENDING')
      .select('id')
      .maybeSingle();
    if (error) return NextResponse.json({ error: databaseMessage(error) }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Esta solicitação já foi analisada ou não existe.' }, { status: 409 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Não foi possível recusar a solicitação.' }, { status: 500 });
  }
}
