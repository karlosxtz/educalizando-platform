import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { generateSlug } from '@/lib/string-utils';

type Change = { id?: unknown; titulo?: unknown; descricao?: unknown; tags?: unknown; seasonal_tags?: unknown };

const strings = (value: unknown, max: number) => Array.isArray(value)
  ? value.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(Boolean).slice(0, max)
  : [];

async function uniqueProductSlug(title: string, excludeId: string) {
  const base = generateSlug(title).slice(0, 110) || 'produto';
  const { data } = await supabaseAdmin.from('products').select('id, slug').ilike('slug', `${base}%`);
  const used = new Set((data || []).filter(product => product.id !== excludeId).map(product => product.slug).filter(Boolean));
  if (!used.has(base)) return base;
  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const { storeId, changes } = await request.json().catch(() => ({}));
  if (!storeId || !Array.isArray(changes) || !changes.length) return NextResponse.json({ error: 'Nenhuma alteração foi selecionada.' }, { status: 400 });
  const { data: store } = await supabaseAdmin.from('stores').select('id, slug').eq('id', storeId).eq('creator_id', user.id).maybeSingle();
  if (!store) return NextResponse.json({ error: 'Loja não encontrada ou sem permissão.' }, { status: 403 });

  const ids = changes.map((item: Change) => typeof item.id === 'string' ? item.id : '').filter(Boolean);
  const { data: owned } = await supabaseAdmin.from('products').select('id, slug').eq('store_id', storeId).in('id', ids).neq('status', 'excluido').is('excluido_em', null);
  const ownedIds = new Set((owned || []).map(product => product.id));
  const updated: string[] = [];

  for (const change of changes as Change[]) {
    if (typeof change.id !== 'string' || !ownedIds.has(change.id)) continue;
    const nextTitle = typeof change.titulo === 'string' && change.titulo.trim().length >= 4 ? change.titulo.trim().slice(0, 160) : null;
    const current = (owned || []).find(product => product.id === change.id);
    const nextSlug = nextTitle ? await uniqueProductSlug(nextTitle, change.id) : null;
    const update = {
      ...(nextTitle ? { titulo: nextTitle, slug: nextSlug } : {}),
      ...(typeof change.descricao === 'string' && change.descricao.trim() ? { descricao: change.descricao.trim().slice(0, 8000) } : {}),
      ...(Array.isArray(change.tags) ? { tags: strings(change.tags, 10).map(tag => tag.toLowerCase()) } : {}),
      ...(Array.isArray(change.seasonal_tags) ? { seasonal_tags: strings(change.seasonal_tags, 48) } : {}),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabaseAdmin.from('products').update(update).eq('id', change.id).eq('store_id', storeId);
    if (error) return NextResponse.json({ error: `Não foi possível salvar um dos materiais: ${error.message}` }, { status: 500 });
    updated.push(change.id);
    if (current?.slug) {
      revalidatePath(`/produto/${current.slug}`, 'page');
      revalidatePath(`/loja/${store.slug}/produto/${current.slug}`, 'page');
    }
    if (nextSlug) {
      revalidatePath(`/produto/${nextSlug}`, 'page');
      revalidatePath(`/loja/${store.slug}/produto/${nextSlug}`, 'page');
    }
  }
  revalidatePath('/', 'layout');
  revalidatePath('/dashboard/produtos', 'page');
  revalidatePath(`/loja/${store.slug}`, 'page');
  return NextResponse.json({ success: true, updatedIds: updated });
}
