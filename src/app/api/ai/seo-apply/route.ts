import { getRequestUser } from '@/lib/api-auth';
import { platformPublicImageUrl,resolveBucket,uploadObject } from '@/lib/object-storage';
import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

type Change = { id?: unknown; titulo?: unknown; descricao?: unknown; plr_descricao?: unknown; tags?: unknown; seasonal_tags?: unknown; category_id?: unknown; education_level_id?: unknown; age_range?: unknown; format_details?: unknown };

const uuid = (value: unknown) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value : null;

const strings = (value: unknown, max: number) => Array.isArray(value)
  ? value.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(Boolean).slice(0, max)
  : [];

const escapeSvg = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[character] || character));

async function createAutomaticCover(userId: string, productId: string, title: string) {
  const bucket = resolveBucket('product-covers');
  const key = `uploads/${userId}/seo-covers/${productId}-${Date.now()}.svg`;
  const words = title.slice(0, 100).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  for (const [wordIndex, word] of words.entries()) {
    const current = lines.at(-1) || '';
    if (!current || `${current} ${word}`.length > 28) lines.push(word);
    else lines[lines.length - 1] = `${current} ${word}`;
    if (lines.length === 3 && wordIndex < words.length - 1) {
      lines[2] = `${lines[2].replace(/[.…]*$/, '')}…`;
      break;
    }
  }
  const titleLines = lines.map((line, index) => `<tspan x="80" dy="${index === 0 ? 0 : 92}">${escapeSvg(line)}</tspan>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#4f46e5"/><stop offset=".55" stop-color="#7c3aed"/><stop offset="1" stop-color="#db2777"/></linearGradient></defs><rect width="1200" height="900" rx="48" fill="url(#g)"/><circle cx="1050" cy="130" r="190" fill="#fff" opacity=".10"/><circle cx="120" cy="800" r="260" fill="#fff" opacity=".08"/><text x="80" y="115" fill="#fff" font-family="Arial, sans-serif" font-size="34" font-weight="700" letter-spacing="5">EDUCALIZANDO</text><text x="80" y="330" fill="#fff" font-family="Arial, sans-serif" font-size="78" font-weight="900">${titleLines}</text><rect x="80" y="720" width="440" height="86" rx="43" fill="#fff" opacity=".95"/><text x="300" y="775" text-anchor="middle" fill="#5b21b6" font-family="Arial, sans-serif" font-size="31" font-weight="800">MATERIAL PEDAGÓGICO</text></svg>`;
  await uploadObject({ bucket, key, body: Buffer.from(svg), contentType: 'image/svg+xml' });
  return platformPublicImageUrl(bucket, key);
}

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const { storeId, changes } = await request.json().catch(() => ({}));
  if (!storeId || !Array.isArray(changes) || !changes.length) return NextResponse.json({ error: 'Nenhuma alteração foi selecionada.' }, { status: 400 });
  const { data: store } = await supabaseAdmin.from('stores').select('id, slug').eq('id', storeId).eq('creator_id', user.id).maybeSingle();
  if (!store) return NextResponse.json({ error: 'Loja não encontrada ou sem permissão.' }, { status: 403 });

  const ids = changes.map((item: Change) => typeof item.id === 'string' ? item.id : '').filter(Boolean);
  const { data: owned } = await supabaseAdmin.from('products').select('id, slug, capa_url, titulo').eq('store_id', storeId).in('id', ids).neq('status', 'excluido').is('excluido_em', null);
  const ownedIds = new Set((owned || []).map(product => product.id));
  const updated: string[] = [];

  for (const change of changes as Change[]) {
    if (typeof change.id !== 'string' || !ownedIds.has(change.id)) continue;
    const nextTitle = typeof change.titulo === 'string' && change.titulo.trim().length >= 4 ? change.titulo.trim().slice(0, 160) : null;
    const current = (owned || []).find(product => product.id === change.id);
    let automaticCover: string | null = null;
    if (!current?.capa_url) {
      try {
        automaticCover = await createAutomaticCover(user.id, change.id, nextTitle || current?.titulo || 'Material pedagógico');
      } catch (error) {
        console.error('[SEO apply] Falha ao criar a capa automática:', error);
        return NextResponse.json({ error: 'Não foi possível criar a capa automática no armazenamento. Tente novamente.' }, { status: 503 });
      }
    }
    const update = {
      // O endereço público é permanente: otimizar o título nunca altera o slug.
      ...(nextTitle ? { titulo: nextTitle } : {}),
      ...(typeof change.descricao === 'string' && change.descricao.trim() ? { descricao: change.descricao.trim().slice(0, 8000) } : {}),
      ...(typeof change.plr_descricao === 'string' && change.plr_descricao.trim() ? { plr_descricao: change.plr_descricao.trim().slice(0, 8000) } : {}),
      ...(Array.isArray(change.tags) ? { tags: strings(change.tags, 10).map(tag => tag.toLowerCase()) } : {}),
      ...(Array.isArray(change.seasonal_tags) ? { seasonal_tags: strings(change.seasonal_tags, 48) } : {}),
      ...(uuid(change.category_id) ? { category_id: uuid(change.category_id) } : {}),
      ...(uuid(change.education_level_id) ? { education_level_id: uuid(change.education_level_id) } : {}),
      ...(typeof change.age_range === 'string' && change.age_range.trim() ? { age_range: change.age_range.trim().slice(0, 120) } : {}),
      ...(typeof change.format_details === 'string' && change.format_details.trim() ? { format_details: change.format_details.trim().slice(0, 180) } : {}),
      ...(automaticCover ? { capa_url: automaticCover } : {}),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabaseAdmin.from('products').update(update).eq('id', change.id).eq('store_id', storeId);
    if (error) return NextResponse.json({ error: `Não foi possível salvar um dos materiais: ${error.message}` }, { status: 500 });
    updated.push(change.id);
    if (current?.slug) {
      revalidatePath(`/produto/${current.slug}`, 'page');
      revalidatePath(`/loja/${store.slug}/produto/${current.slug}`, 'page');
    }
  }
  revalidatePath('/', 'layout');
  revalidatePath('/dashboard/produtos', 'page');
  revalidatePath(`/loja/${store.slug}`, 'page');
  return NextResponse.json({ success: true, updatedIds: updated });
}
