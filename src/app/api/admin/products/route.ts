import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

async function checkSuperAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value;
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'rafinhaagathathamy@gmail.com';
    return payload.email === superAdminEmail;
  } catch (e) {
    return false;
  }
}

export async function GET() {
  try {
    if (!(await checkSuperAdmin())) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('*, store:stores(nome_loja, slug)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, products });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await checkSuperAdmin())) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json({ error: 'ID do produto obrigatório' }, { status: 400 });
    }

    // Excluir produto fisicamente (Super Admin tem esse poder)
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
