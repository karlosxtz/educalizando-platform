import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    if (!(await isSuperAdmin(request))) {
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
    if (!(await isSuperAdmin(request))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json({ error: 'ID do produto obrigatório' }, { status: 400 });
    }

    // Nunca removemos fisicamente: pedidos pagos, acessos e lançamentos
    // financeiros precisam continuar auditáveis mesmo após moderação.
    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ excluido_em: new Date().toISOString(), status: 'rascunho', updated_at: new Date().toISOString() })
      .eq('id', productId)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await isSuperAdmin(request))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const productId = typeof body.id === 'string' ? body.id : '';
    if (!productId) return NextResponse.json({ error: 'ID do produto obrigatório' }, { status: 400 });

    // A restauração retorna como rascunho para que o criador revise o material
    // antes de voltar a exibi-lo publicamente.
    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ excluido_em: null, status: 'rascunho', updated_at: new Date().toISOString() })
      .eq('id', productId)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
