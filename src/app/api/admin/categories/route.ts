import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/api-auth';

function slugify(value: unknown) {
  return typeof value === 'string'
    ? value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : '';
}

export async function GET(request: Request) {
  try {
    if (!(await isSuperAdmin(request))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .is('store_id', null) // Apenas categorias globais
      .order('nome', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, categories });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isSuperAdmin(request))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const nome = typeof body.nome === 'string' ? body.nome.trim().slice(0, 100) : '';
    const slug = slugify(body.slug || nome);

    if (!nome || !slug) {
      return NextResponse.json({ error: 'Informe um nome e uma URL amigável válidos.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('categories')
      .insert([{ nome, slug }]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await isSuperAdmin(request))) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id : '';
    const nome = typeof body.nome === 'string' ? body.nome.trim().slice(0, 100) : '';
    const slug = slugify(body.slug || nome);
    if (!id || !nome || !slug) {
      return NextResponse.json({ error: 'Informe categoria, nome e URL amigável válidos.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.from('categories')
      .update({ nome, slug })
      .eq('id', id)
      .is('store_id', null)
      .select('id, nome, slug')
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Categoria global não encontrada.' }, { status: 404 });
    return NextResponse.json({ success: true, category: data });
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
    }

    const { count, error: countError } = await supabaseAdmin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id)
      .is('excluido_em', null);
    if (countError) throw countError;
    if (count) {
      return NextResponse.json({ error: `Esta categoria está vinculada a ${count} material(is). Reclassifique-os antes de excluí-la.` }, { status: 409 });
    }

    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id)
      .is('store_id', null);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
