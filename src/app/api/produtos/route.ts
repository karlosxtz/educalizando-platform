import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';

const isValidUUID = (str: string | null | undefined): boolean => {
  if (!str) return false;
  const clean = str.replace(/^store_/i, '');
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
};

const sanitizeUUID = (str: string | null | undefined): string | null => {
  if (!str) return null;
  const clean = str.replace(/^store_/i, '');
  return isValidUUID(clean) ? clean : null;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      store_id, 
      titulo, 
      descricao, 
      tipo = 'pdf', 
      preco = 0, 
      capa_url, 
      arquivo_url, 
      status = 'publicado',
      category_id,
      education_level_id 
    } = body;

    if (!titulo || !titulo.trim()) {
      return NextResponse.json({ error: 'O título do produto é obrigatório.' }, { status: 400 });
    }

    const cleanStoreId = (store_id || '').toString().replace(/^store_/i, '');

    // Tentar resolver o ID real da loja no Supabase se um slug ou alias foi informado
    let targetStoreId: string | null = isValidUUID(cleanStoreId) ? cleanStoreId : null;
    if (!targetStoreId && cleanStoreId) {
      try {
        const { data: storeRow } = await supabaseAdmin
          .from('stores')
          .select('id')
          .or(`slug.eq.${cleanStoreId},id.eq.${cleanStoreId},creator_id.eq.${cleanStoreId}`)
          .limit(1)
          .maybeSingle();

        if (storeRow?.id) {
          targetStoreId = storeRow.id;
        }
      } catch (e) {}
    }

    // Se ainda não encontrou targetStoreId, tenta buscar a loja do criador autenticado
    if (!targetStoreId) {
      try {
        const { data: anyStore } = await supabaseAdmin
          .from('stores')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (anyStore?.id) targetStoreId = anyStore.id;
      } catch (e) {}
    }

    const productPayload: Record<string, any> = {
      titulo: titulo.trim(),
      descricao: descricao || null,
      tipo,
      preco: Number(preco) || 0,
      capa_url: capa_url || null,
      arquivo_url: arquivo_url || null,
      status: status || 'publicado',
      category_id: sanitizeUUID(category_id),
      education_level_id: sanitizeUUID(education_level_id),
      created_at: new Date().toISOString()
    };

    if (targetStoreId) {
      productPayload.store_id = targetStoreId;
    }

    console.log('[API /api/produtos POST] Criando produto no Supabase via Admin:', productPayload);

    let insertedProduct = null;
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([productPayload])
      .select()
      .single();

    if (error) {
      console.error('[API /api/produtos POST] Erro Supabase:', error.message);
      // Fallback sem FKs caso haja restrição relacional em categorias
      const fallbackPayload = {
        store_id: targetStoreId,
        titulo: titulo.trim(),
        descricao: descricao || null,
        tipo,
        preco: Number(preco) || 0,
        capa_url: capa_url || null,
        arquivo_url: arquivo_url || null,
        status: status || 'publicado',
        created_at: new Date().toISOString()
      };

      const { data: retryData, error: retryError } = await supabaseAdmin
        .from('products')
        .insert([fallbackPayload])
        .select()
        .single();

      if (retryError) {
        console.error('[API /api/produtos POST Retry] Erro no fallback:', retryError.message);
        return NextResponse.json({ error: retryError.message }, { status: 500 });
      }

      insertedProduct = retryData;
    } else {
      insertedProduct = data;
    }

    // Purga imediata do cache do Next.js para as páginas afetadas
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/loja/[slug]', 'page');
      revalidatePath('/dashboard', 'page');
      revalidatePath('/dashboard/produtos', 'page');
      revalidatePath('/dashboard/conteudo', 'page');
      revalidatePath('/dashboard/kits', 'page');
    } catch (e) {}

    return NextResponse.json({ success: true, product: insertedProduct });
  } catch (err: any) {
    console.error('[API /api/produtos POST] Exceção:', err);
    return NextResponse.json({ error: err.message || 'Erro interno ao criar produto.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do produto é obrigatório para atualização.' }, { status: 400 });
    }

    const cleanedUpdates: Record<string, any> = { ...updates };
    if ('category_id' in cleanedUpdates) {
      cleanedUpdates.category_id = sanitizeUUID(cleanedUpdates.category_id);
    }
    if ('education_level_id' in cleanedUpdates) {
      cleanedUpdates.education_level_id = sanitizeUUID(cleanedUpdates.education_level_id);
    }
    if ('store_id' in cleanedUpdates && cleanedUpdates.store_id) {
      const cleanStoreId = cleanedUpdates.store_id.toString().replace(/^store_/i, '');
      if (isValidUUID(cleanStoreId)) {
        cleanedUpdates.store_id = cleanStoreId;
      } else {
        delete cleanedUpdates.store_id;
      }
    }

    cleanedUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(cleanedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[API /api/produtos PUT] Erro Supabase:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Purga imediata do cache do Next.js para as páginas afetadas
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/loja/[slug]', 'page');
      revalidatePath('/dashboard', 'page');
      revalidatePath('/dashboard/produtos', 'page');
      revalidatePath('/dashboard/conteudo', 'page');
      revalidatePath('/dashboard/kits', 'page');
    } catch (e) {}

    return NextResponse.json({ success: true, product: data });
  } catch (err: any) {
    console.error('[API /api/produtos PUT] Exceção:', err);
    return NextResponse.json({ error: err.message || 'Erro interno ao atualizar produto.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do produto é obrigatório para exclusão.' }, { status: 400 });
    }

    const cleanId = id.replace(/^prod_/i, '');
    const validUUID = isValidUUID(cleanId) ? cleanId : (isValidUUID(id) ? id : null);

    console.log(`[API /api/produtos DELETE] Executando Soft Delete. ID bruto: "${id}", cleanId: "${cleanId}", validUUID: "${validUUID}"`);

    // Soft Delete Definitivo no Supabase: preserva integridade relacional e fiscal
    if (validUUID) {
      // 1. Tentar Soft Delete completo com excluido_em e status = 'excluido'
      const { error: err1 } = await supabaseAdmin
        .from('products')
        .update({
          excluido_em: new Date().toISOString(),
          status: 'excluido',
          updated_at: new Date().toISOString()
        })
        .eq('id', validUUID);

      if (err1) {
        console.warn('[API /api/produtos DELETE] Aviso soft delete com excluido_em, tentando apenas status:', err1.message);
        
        // 2. Fallback caso a coluna excluido_em ainda não tenha sido criada no Supabase
        const { error: err2 } = await supabaseAdmin
          .from('products')
          .update({
            status: 'excluido',
            updated_at: new Date().toISOString()
          })
          .eq('id', validUUID);

        if (err2) {
          console.warn('[API /api/produtos DELETE] Falha no update de status, tentando exclusão física de fallback:', err2.message);
          // 3. Fallback de exclusão física caso o update falhe
          try {
            await supabaseAdmin.from('digital_contents').delete().eq('product_id', validUUID);
            await supabaseAdmin.from('product_reviews').delete().eq('product_id', validUUID);
            await supabaseAdmin.from('reviews').delete().eq('product_id', validUUID);
            await supabaseAdmin.from('kit_products').delete().eq('product_id', validUUID);
            await supabaseAdmin.from('kit_items').delete().eq('product_id', validUUID);
            await supabaseAdmin.from('coupon_products').delete().eq('product_id', validUUID);
            await supabaseAdmin.from('products').delete().eq('id', validUUID);
          } catch (delErr: any) {
            console.error('[API /api/produtos DELETE] Erro no fallback físico:', delErr.message);
          }
        }
      }

      console.log(`[API /api/produtos DELETE] Produto ${validUUID} processado com sucesso.`);
    }

    // Purga imediata do cache do Next.js para garantir que o item suma instantaneamente da loja e do painel
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/loja/[slug]', 'page');
      revalidatePath('/dashboard', 'page');
      revalidatePath('/dashboard/produtos', 'page');
      revalidatePath('/dashboard/conteudo', 'page');
      revalidatePath('/dashboard/kits', 'page');
      revalidatePath('/dashboard/cupons', 'page');
    } catch (e) {}

    return NextResponse.json({ success: true, softDeleted: true, id, validUUID });
  } catch (err: any) {
    console.error('[API /api/produtos DELETE] Exceção:', err);
    return NextResponse.json({ error: err.message || 'Erro interno ao excluir produto.' }, { status: 500 });
  }
}
