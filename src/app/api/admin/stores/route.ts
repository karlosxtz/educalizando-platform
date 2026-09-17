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

    // Uma exclusão em cascata destruiria catálogo, pedidos e acessos. A loja
    // só pode ser apagada quando ainda não possui operação vinculada.
    const [{ count: productsCount, error: productsError }, { count: kitsCount, error: kitsError }, { count: purchasesCount, error: purchasesError }] = await Promise.all([
      supabaseAdmin.from('products').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
      supabaseAdmin.from('kits').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
      supabaseAdmin.from('purchases').select('id', { count: 'exact', head: true }).eq('store_id', storeId)
    ]);
    if (productsError || kitsError || purchasesError) throw productsError || kitsError || purchasesError;
    if (productsCount || kitsCount || purchasesCount) {
      return NextResponse.json({
        error: `Esta loja possui ${productsCount || 0} produto(s), ${kitsCount || 0} kit(s) ou ${purchasesCount || 0} compra(s) vinculada(s). A exclusão foi bloqueada para preservar o histórico.`
      }, { status: 409 });
    }

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
