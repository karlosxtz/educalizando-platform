import { invalidatePublicCatalog } from '@/lib/public-cache-invalidation';
import { calculateProductSeoScore } from '@/lib/product-seo-score';
import { getRequestUser } from '@/lib/api-auth';
import { platformPublicImageUrl,resolveBucket,uploadObject } from '@/lib/object-storage';
import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

type Change = { id?: unknown; expectedUpdatedAt?: unknown; titulo?: unknown; descricao?: unknown; plr_descricao?: unknown; tags?: unknown; seasonal_tags?: unknown; category_id?: unknown; education_level_id?: unknown; age_range?: unknown; format_details?: unknown };

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
  if (changes.length > 30) return NextResponse.json({ error: 'Revise até 30 materiais por salvamento.' }, { status: 400 });
  if (changes.some((change: Change) => change.expectedUpdatedAt !== undefined && change.expectedUpdatedAt !== null && (typeof change.expectedUpdatedAt !== 'string' || !Number.isFinite(Date.parse(change.expectedUpdatedAt))))) return NextResponse.json({ error: 'Versão do material inválida. Gere novamente a proposta.' }, { status: 400 });
  const { data: store } = await supabaseAdmin.from('stores').select('id, slug').eq('id', storeId).eq('creator_id', user.id).maybeSingle();
  if (!store) return NextResponse.json({ error: 'Loja não encontrada ou sem permissão.' }, { status: 403 });

  const ids = changes.map((item: Change) => typeof item.id === 'string' ? item.id : '').filter(Boolean);
  const { data: owned, error: readError } = await supabaseAdmin.from('products').select('id, slug, capa_url, titulo, updated_at').eq('store_id', storeId).in('id', ids).neq('status', 'excluido').is('excluido_em', null);
  if (readError) return NextResponse.json({ error: 'Não foi possível conferir os materiais antes de salvar.' }, { status: 503 });
  for (const change of changes as Change[]) {
    const current = (owned || []).find(product => product.id === change.id);
    if (current && change.expectedUpdatedAt !== undefined && change.expectedUpdatedAt !== (current.updated_at ?? null)) return NextResponse.json({ error: 'Este material foi editado depois da geração. Gere uma proposta atualizada para preservar as alterações recentes.' }, { status: 409 });
  }
  const ownedIds = new Set((owned || []).map(product => product.id));
  const updated: string[] = [];
  const savedProducts: Array<Record<string, unknown>> = [];
  const seoResults: Array<{ id: string; score: number; issues: string[] }> = [];

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
      ...(!current?.slug ? { slug: `${(nextTitle || current?.titulo || 'material').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'material'}-${change.id}` } : {}),
      ...(nextTitle ? { titulo: nextTitle } : {}),
      ...(typeof change.descricao === 'string' && change.descricao.trim() ? { descricao: change.descricao.trim().slice(0, 8000) } : {}),
      ...(typeof change.plr_descricao === 'string' && change.plr_descricao.trim() ? { plr_descricao: change.plr_descricao.trim().slice(0, 8000) } : {}),
      ...(Array.isArray(change.tags) ? { tags: strings(change.tags, 10).map(tag => tag.toLowerCase()) } : {}),
      ...(Array.isArray(change.seasonal_tags) ? { seasonal_tags: strings(change.seasonal_tags, 48) } : {}),
      ...(change.category_id === null || uuid(change.category_id) ? { category_id: uuid(change.category_id) } : {}),
      ...(change.education_level_id === null || uuid(change.education_level_id) ? { education_level_id: uuid(change.education_level_id) } : {}),
      ...(typeof change.age_range === 'string' || change.age_range === null ? { age_range: typeof change.age_range === 'string' ? change.age_range.trim().slice(0, 120) || null : null } : {}),
      ...(typeof change.format_details === 'string' || change.format_details === null ? { format_details: typeof change.format_details === 'string' ? change.format_details.trim().slice(0, 180) || null : null } : {}),
      ...(automaticCover ? { capa_url: automaticCover } : {}),
      updated_at: new Date().toISOString(),
    };
    let query = supabaseAdmin.from('products').update(update).eq('id', change.id).eq('store_id', storeId).neq('status', 'excluido').is('excluido_em', null);
    if (change.expectedUpdatedAt !== undefined) query = change.expectedUpdatedAt === null ? query.is('updated_at', null) : query.eq('updated_at', change.expectedUpdatedAt);
    const { data: saved, error } = await query.select('id,titulo,descricao,plr_descricao,capa_url,category_id,education_level_id,category_ids,education_level_ids,tags,seasonal_tags,age_range,format_details,slug,updated_at');
    if (error) return NextResponse.json({ error: `Não foi possível salvar um dos materiais: ${error.message}` }, { status: 500 });
    if (!saved?.length) return NextResponse.json({ error: 'O material mudou durante o salvamento. Recarregue o cadastro antes de tentar novamente.', updatedIds: updated }, { status: 409 });
    updated.push(change.id);
    savedProducts.push(saved[0]);
    seoResults.push({ id: change.id, ...calculateProductSeoScore(saved[0]) });
    if (current?.slug) {
      revalidatePath(`/produto/${current.slug}`, 'page');
      revalidatePath(`/loja/${store.slug}/produto/${current.slug}`, 'page');
    }
  }
  await invalidatePublicCatalog();
  revalidatePath('/dashboard/produtos', 'page');
  revalidatePath(`/loja/${store.slug}`, 'page');
  return NextResponse.json({ success: true, updatedIds: updated, seoResults, savedProducts }, { headers: { 'Cache-Control': 'private, no-store' } });
}
