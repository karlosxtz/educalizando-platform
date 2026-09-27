import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { getRequestUser } from '@/lib/api-auth';

const isValidUUID = (str: string | null | undefined): boolean => {
  if (!str) return false;
  const clean = str.replace(/^kit_/i, '');
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
};

async function getOwnedStore(userId: string, storeId: string) {
  const { data } = await supabaseAdmin.from('stores').select('id').eq('id', storeId).eq('creator_id', userId).maybeSingle();
  return data;
}

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  const storeId = new URL(request.url).searchParams.get('storeId') || '';
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  if (!await getOwnedStore(user.id, storeId)) return NextResponse.json({ error: 'Loja não encontrada ou sem permissão.' }, { status: 403 });
  const { data, error } = await supabaseAdmin.from('kits').select('*, kit_items(id, kit_id, product_id, products(*))').eq('store_id', storeId).is('excluido_em', null).neq('status', 'excluido').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Não foi possível carregar os combos.' }, { status: 500 });
  return NextResponse.json({ kits: (data || []).map((kit: any) => ({ ...kit, products: (kit.kit_items || []).map((item: any) => item.products).filter(Boolean), items: kit.kit_items || [] })) });
}

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const storeId = typeof body.storeId === 'string' ? body.storeId : '';
  const productIds = Array.isArray(body.productIds) ? [...new Set((body.productIds as unknown[]).filter((id): id is string => typeof id === 'string'))] : [];
  if (!await getOwnedStore(user.id, storeId)) return NextResponse.json({ error: 'Loja não encontrada ou sem permissão.' }, { status: 403 });
  if (typeof body.titulo !== 'string' || body.titulo.trim().length < 4 || productIds.length < 2 || !(Number(body.preco_kit) > 0)) return NextResponse.json({ error: 'Informe título, preço e ao menos dois materiais para o combo.' }, { status: 400 });
  const { data: products } = await supabaseAdmin.from('products').select('id, status').eq('store_id', storeId).in('id', productIds).eq('status', 'publicado').is('excluido_em', null);
  if (!products || products.length !== productIds.length) return NextResponse.json({ error: 'Escolha somente materiais publicados da sua loja.' }, { status: 400 });
  const { data: deliveries } = await supabaseAdmin.from('product_deliveries').select('product_id, arquivo_url').in('product_id', productIds);
  const finalFiles = new Set((deliveries || []).filter(item => Boolean(item.arquivo_url)).map(item => item.product_id));
  if (finalFiles.size !== productIds.length) return NextResponse.json({ error: 'Cada item do combo precisa ter o arquivo do produto final configurado. Arquivos e links de PLR não são usados em combos.' }, { status: 400 });
  const { data: kit, error } = await supabaseAdmin.from('kits').insert({ store_id: storeId, titulo: body.titulo.trim().slice(0, 160), descricao: typeof body.descricao === 'string' ? body.descricao.trim().slice(0, 8000) || null : null, capa_url: typeof body.capa_url === 'string' ? body.capa_url : null, preco_kit: Number(body.preco_kit), status: body.status === 'rascunho' ? 'rascunho' : 'publicado' }).select().single();
  if (error || !kit) return NextResponse.json({ error: 'Não foi possível salvar o combo.' }, { status: 500 });
  const { error: itemsError } = await supabaseAdmin.from('kit_items').insert(productIds.map(product_id => ({ kit_id: kit.id, product_id })));
  if (itemsError) { await supabaseAdmin.from('kits').delete().eq('id', kit.id); return NextResponse.json({ error: 'Não foi possível vincular os materiais ao combo.' }, { status: 500 }); }
  revalidatePath('/', 'layout'); revalidatePath('/buscar', 'page'); revalidatePath('/dashboard/kits', 'page'); revalidatePath('/loja/[slug]', 'page');
  return NextResponse.json({ kit: { ...kit, products: [] } }, { status: 201 });
}

export async function DELETE(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do kit/combo é obrigatório para exclusão.' }, { status: 400 });
    }

    const cleanId = id.replace(/^kit_/i, '');
    const validUUID = isValidUUID(cleanId) ? cleanId : (isValidUUID(id) ? id : null);

    console.log(`[API /api/kits DELETE] Executando Soft Delete. ID bruto: "${id}", cleanId: "${cleanId}", validUUID: "${validUUID}"`);

    // Soft Delete Definitivo no Supabase: preserva integridade relacional
    if (validUUID) {
      const { data: ownedKit } = await supabaseAdmin
        .from('kits')
        .select('id, store:stores!inner(creator_id)')
        .eq('id', validUUID)
        .eq('stores.creator_id', user.id)
        .maybeSingle();

      if (!ownedKit) {
        return NextResponse.json({ error: 'Kit não encontrado ou sem permissão.' }, { status: 403 });
      }

      const { error: err1 } = await supabaseAdmin
        .from('kits')
        .update({
          excluido_em: new Date().toISOString(),
          status: 'excluido',
          updated_at: new Date().toISOString()
        })
        .eq('id', validUUID);

      if (err1) {
        console.warn('[API /api/kits DELETE] Tentando fallback para status:', err1.message);
        const { error: err2 } = await supabaseAdmin
          .from('kits')
          .update({
            status: 'excluido',
            updated_at: new Date().toISOString()
          })
          .eq('id', validUUID);

        if (err2) {
          try {
            await supabaseAdmin.from('kit_items').delete().eq('kit_id', validUUID);
            await supabaseAdmin.from('kit_products').delete().eq('kit_id', validUUID);
            await supabaseAdmin.from('coupon_products').delete().eq('kit_id', validUUID);
            await supabaseAdmin.from('kits').delete().eq('id', validUUID);
          } catch (delErr) {}
        }
      }

      console.log(`[API /api/kits DELETE] Kit ${validUUID} processado com sucesso.`);
    }

    // Purga imediata do cache do Next.js
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/loja/[slug]', 'page');
      revalidatePath('/dashboard', 'page');
      revalidatePath('/dashboard/kits', 'page');
    } catch (e) {}

    return NextResponse.json({ success: true, softDeleted: true, id, validUUID });
  } catch (err: any) {
    console.error('[API /api/kits DELETE] Exceção:', err);
    return NextResponse.json({ error: err.message || 'Erro interno ao excluir kit.' }, { status: 500 });
  }
}
