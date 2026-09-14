import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    if (!(await isSuperAdmin(request))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { data: stores, error } = await supabaseAdmin
      .from('stores')
      .select('*, products(count)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, stores });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await isSuperAdmin(request))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('id');

    if (!storeId) {
      return NextResponse.json({ error: 'ID da loja obrigatório' }, { status: 400 });
    }

    // Excluir loja (ON DELETE CASCADE vai limpar produtos, kits, etc)
    const { error } = await supabaseAdmin
      .from('stores')
      .delete()
      .eq('id', storeId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
