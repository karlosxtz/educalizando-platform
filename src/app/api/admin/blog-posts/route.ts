import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/api-auth';

function normalizeSlug(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 120);
}

function sanitizePost(input: Record<string, unknown>) {
  const title = typeof input.title === 'string' ? input.title.trim().slice(0, 180) : '';
  const excerpt = typeof input.excerpt === 'string' ? input.excerpt.trim().slice(0, 360) : '';
  const content = typeof input.content === 'string' ? input.content.trim() : '';
  const slug = normalizeSlug(input.slug || title);
  const status = input.status === 'published' ? 'published' : 'draft';
  if (title.length < 8 || excerpt.length < 40 || !content || !slug) throw new Error('Preencha título, resumo (mínimo de 40 caracteres) e conteúdo do artigo.');
  return {
    title, slug, excerpt, content, status,
    cover_url: typeof input.cover_url === 'string' && input.cover_url.trim() ? input.cover_url.trim().slice(0, 2000) : null,
    seo_title: typeof input.seo_title === 'string' && input.seo_title.trim() ? input.seo_title.trim().slice(0, 180) : null,
    seo_description: typeof input.seo_description === 'string' && input.seo_description.trim() ? input.seo_description.trim().slice(0, 320) : null,
    published_at: status === 'published' ? (typeof input.published_at === 'string' && input.published_at ? input.published_at : new Date().toISOString()) : null,
    updated_at: new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  if (!(await isSuperAdmin(request))) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const { data, error } = await supabaseAdmin.from('blog_posts').select('*').order('updated_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.code === '42P01' ? 'A tabela de blog não existe. Execute a migration.' : error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  if (!(await isSuperAdmin(request))) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  try {
    const post = sanitizePost(await request.json());
    const { data, error } = await supabaseAdmin.from('blog_posts').insert({ ...post, created_at: new Date().toISOString() }).select().single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Não foi possível criar o artigo.' }, { status: 400 }); }
}

export async function PUT(request: Request) {
  if (!(await isSuperAdmin(request))) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  try {
    const body = await request.json();
    if (typeof body.id !== 'string') return NextResponse.json({ error: 'Artigo inválido.' }, { status: 400 });
    const post = sanitizePost(body);
    const { data, error } = await supabaseAdmin.from('blog_posts').update(post).eq('id', body.id).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Não foi possível atualizar o artigo.' }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  if (!(await isSuperAdmin(request))) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Artigo inválido.' }, { status: 400 });
  const { error } = await supabaseAdmin.from('blog_posts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
