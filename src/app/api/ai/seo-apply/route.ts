import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

type Change = { id?: unknown; titulo?: unknown; descricao?: unknown; tags?: unknown; seasonal_tags?: unknown };

const strings = (value: unknown, max: number) => Array.isArray(value)
  ? value.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(Boolean).slice(0, max)
  : [];

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const { storeId, changes } = await request.json().catch(() => ({}));
  if (!storeId || !Array.isArray(changes) || !changes.length) return NextResponse.json({ error: 'Nenhuma alteração foi selecionada.' }, { status: 400 });
  const { data: store } = await supabaseAdmin.from('stores').select('id').eq('id', storeId).eq('creator_id', user.id).maybeSingle();
  if (!store) return NextResponse.json({ error: 'Loja não encontrada ou sem permissão.' }, { status: 403 });

  const ids = changes.map((item: Change) => typeof item.id === 'string' ? item.id : '').filter(Boolean);
  const { data: owned } = await supabaseAdmin.from('products').select('id').eq('store_id', storeId).in('id', ids).neq('status', 'excluido').is('excluido_em', null);
  const ownedIds = new Set((owned || []).map(product => product.id));
  const updated: string[] = [];

  for (const change of changes as Change[]) {
    if (typeof change.id !== 'string' || !ownedIds.has(change.id)) continue;
    const update = {
      ...(typeof change.titulo === 'string' && change.titulo.trim().length >= 4 ? { titulo: change.titulo.trim().slice(0, 160) } : {}),
      ...(typeof change.descricao === 'string' && change.descricao.trim() ? { descricao: change.descricao.trim().slice(0, 8000) } : {}),
      tags: strings(change.tags, 20).map(tag => tag.toLowerCase()),
      seasonal_tags: strings(change.seasonal_tags, 48),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabaseAdmin.from('products').update(update).eq('id', change.id).eq('store_id', storeId);
    if (error) return NextResponse.json({ error: `Não foi possível salvar um dos materiais: ${error.message}` }, { status: 500 });
    updated.push(change.id);
  }
  return NextResponse.json({ success: true, updatedIds: updated });
}
