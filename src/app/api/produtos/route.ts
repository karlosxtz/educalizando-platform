import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

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

// Middleware interno para validar o token nas rotas da API
async function getAuthUser(request?: Request) {
  let token = null;
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get('sb-access-token')?.value;
  }

  if (!token) return null;
  
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user;
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado. Token ausente ou inválido.' }, { status: 401 });
    }

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
      education_level_id,
      gallery_urls,
      is_free = false,
      is_plr = false,
      preco_plr = 0,
      allow_affiliates = false,
      affiliate_commission_rate = 0,
      order_bump_id = null
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
          .select('id, creator_id')
          .eq('slug', cleanStoreId)
          .limit(1)
          .maybeSingle();

        if (storeRow?.id) {
          if (storeRow.creator_id !== user.id) {
            return NextResponse.json({ error: 'Você não tem permissão para adicionar produtos nesta loja.' }, { status: 403 });
          }
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
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (anyStore?.id) targetStoreId = anyStore.id;
        else {
          return NextResponse.json({ error: 'Nenhuma loja encontrada para este usuário. Crie uma loja primeiro.' }, { status: 403 });
        }
      } catch (e) {
        return NextResponse.json({ error: 'Erro ao resolver a loja do criador.' }, { status: 500 });
      }
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
      is_free: Boolean(is_free),
      is_plr: Boolean(is_plr),
      preco_plr: Number(preco_plr) || 0,
      allow_affiliates: Boolean(allow_affiliates),
      affiliate_commission_rate: Number(affiliate_commission_rate) || 0,
      order_bump_id: isValidUUID(order_bump_id) ? order_bump_id : null,
      created_at: new Date().toISOString()
    };

    if (productPayload.is_free) {
      productPayload.preco = 0;
    }

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
        is_free: Boolean(is_free),
        is_plr: Boolean(is_plr),
        preco_plr: Number(preco_plr) || 0,
        allow_affiliates: Boolean(allow_affiliates),
        affiliate_commission_rate: Number(affiliate_commission_rate) || 0,
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

    // Inserir galeria de imagens
    if (insertedProduct && insertedProduct.id && Array.isArray(gallery_urls) && gallery_urls.length > 0) {
      try {
        const imagesToInsert = gallery_urls.slice(0, 10).map((url: string, index: number) => ({
          product_id: insertedProduct.id,
          url,
          ordem: index
        }));
        await supabaseAdmin.from('product_images').insert(imagesToInsert);
      } catch (e) {
        console.error('[API /api/produtos POST] Erro ao inserir product_images:', e);
      }
    }

    return NextResponse.json({ success: true, product: insertedProduct });
  } catch (err: any) {
    console.error('[API /api/produtos POST] Exceção:', err);
    return NextResponse.json({ error: err.message || 'Erro interno ao criar produto.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado. Token ausente ou inválido.' }, { status: 401 });
    }

    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do produto é obrigatório para atualização.' }, { status: 400 });
    }

    // Validar propriedade do produto
    const { data: product } = await supabaseAdmin.from('products').select('store_id').eq('id', id).maybeSingle();
    if (product) {
      const { data: store } = await supabaseAdmin.from('stores').select('creator_id').eq('id', product.store_id).maybeSingle();
      if (store?.creator_id !== user.id) {
         return NextResponse.json({ error: 'Você não tem permissão para editar este produto.' }, { status: 403 });
      }
    }

    const cleanedUpdates: Record<string, any> = { ...updates };
    if ('category_id' in cleanedUpdates) {
      cleanedUpdates.category_id = sanitizeUUID(cleanedUpdates.category_id);
    }
    if ('education_level_id' in cleanedUpdates) {
      cleanedUpdates.education_level_id = sanitizeUUID(cleanedUpdates.education_level_id);
    }
    if ('order_bump_id' in cleanedUpdates) {
      cleanedUpdates.order_bump_id = sanitizeUUID(cleanedUpdates.order_bump_id);
    }
    if ('is_free' in cleanedUpdates && cleanedUpdates.is_free) {
      cleanedUpdates.is_free = Boolean(cleanedUpdates.is_free);
      cleanedUpdates.preco = 0;
    }
    
    // Validar movimentação de loja (novo store_id)
    if ('store_id' in cleanedUpdates && cleanedUpdates.store_id) {
      const cleanStoreId = cleanedUpdates.store_id.toString().replace(/^store_/i, '');
      if (isValidUUID(cleanStoreId)) {
        // Garantir que a nova loja destino pertença ao usuário
        const { data: destStore } = await supabaseAdmin.from('stores').select('creator_id').eq('id', cleanStoreId).maybeSingle();
        if (!destStore || destStore.creator_id !== user.id) {
          return NextResponse.json({ error: 'A loja de destino não pertence a este usuário. Movimentação não autorizada.' }, { status: 403 });
        }
        cleanedUpdates.store_id = cleanStoreId;
      } else {
        delete cleanedUpdates.store_id;
      }
    }

    const { gallery_urls, ...otherUpdates } = cleanedUpdates;

    cleanedUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(otherUpdates)
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

    // Processar gallery_urls
    if (data && data.id && gallery_urls !== undefined) {
      try {
        // Excluir antigas
        await supabaseAdmin.from('product_images').delete().eq('product_id', data.id);
        
        // Inserir novas
        if (Array.isArray(gallery_urls) && gallery_urls.length > 0) {
          const imagesToInsert = gallery_urls.slice(0, 10).map((url: string, index: number) => ({
            product_id: data.id,
            url,
            ordem: index
          }));
          await supabaseAdmin.from('product_images').insert(imagesToInsert);
        }
      } catch (e) {
        console.error('[API /api/produtos PUT] Erro ao atualizar product_images:', e);
      }
    }

    return NextResponse.json({ success: true, product: data });
  } catch (err: any) {
    console.error('[API /api/produtos PUT] Exceção:', err);
    return NextResponse.json({ error: err.message || 'Erro interno ao atualizar produto.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado. Token ausente ou inválido.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const requestStoreId = searchParams.get('store_id');

    if (!id) {
      return NextResponse.json({ error: 'ID do produto é obrigatório para exclusão.' }, { status: 400 });
    }
    
    if (!requestStoreId) {
      return NextResponse.json({ error: 'O ID da loja atual (store_id) é obrigatório para exclusão.' }, { status: 400 });
    }

    const cleanId = id.replace(/^prod_/i, '');
    const validUUID = isValidUUID(cleanId) ? cleanId : (isValidUUID(id) ? id : null);
    const cleanRequestStoreId = requestStoreId.replace(/^store_/i, '');

    if (!validUUID) {
      return NextResponse.json({ error: `ID inválido para exclusão: "${id}"` }, { status: 400 });
    }

    // Validar propriedade da loja (se a loja solicitada pertence ao usuário)
    const { data: requestedStore } = await supabaseAdmin.from('stores').select('creator_id').eq('id', cleanRequestStoreId).maybeSingle();
    if (!requestedStore || requestedStore.creator_id !== user.id) {
       return NextResponse.json({ error: 'Você não tem permissão para administrar esta loja.' }, { status: 403 });
    }

    // Validar se o produto pertence de fato à loja sendo administrada
    const { data: product } = await supabaseAdmin.from('products').select('store_id').eq('id', validUUID).maybeSingle();
    if (product) {
      if (product.store_id !== cleanRequestStoreId) {
         return NextResponse.json({ error: 'Este produto pertence a outra loja e não pode ser excluído por aqui.' }, { status: 403 });
      }
    }

    console.log(`[API /api/produtos DELETE] Executando Soft Delete. ID bruto: "${id}", validUUID: "${validUUID}"`);

    // Soft Delete Definitivo via supabaseAdmin (service role key — ignora RLS)
    // Estratégia de fallback escalonado para máxima compatibilidade:
    //   1. excluido_em + status = 'excluido' (ideal, requer migration completa)
    //   2. apenas excluido_em (caso CHECK constraint de status ainda bloqueie)
    //   3. apenas status = 'excluido' (caso coluna excluido_em não exista)

    let softDeleteSuccess = false;

    // Tentativa 1: Soft Delete completo (excluido_em + status)
    const { data: d1, error: err1 } = await supabaseAdmin
      .from('products')
      .update({
        excluido_em: new Date().toISOString(),
        status: 'excluido',
        updated_at: new Date().toISOString()
      })
      .eq('id', validUUID)
      .select('id')
      .maybeSingle();

    if (!err1 && d1) {
      softDeleteSuccess = true;
      console.log(`[API /api/produtos DELETE] Soft delete completo (excluido_em + status) OK para ${validUUID}`);
    } else {
      console.warn('[API /api/produtos DELETE] Tentativa 1 falhou:', err1?.message || 'nenhuma linha afetada');

      // Tentativa 2: Apenas excluido_em (CHECK constraint pode bloquear status='excluido')
      const { data: d2, error: err2 } = await supabaseAdmin
        .from('products')
        .update({
          excluido_em: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', validUUID)
        .select('id')
        .maybeSingle();

      if (!err2 && d2) {
        softDeleteSuccess = true;
        console.log(`[API /api/produtos DELETE] Soft delete parcial (apenas excluido_em) OK para ${validUUID}`);
      } else {
        console.warn('[API /api/produtos DELETE] Tentativa 2 falhou:', err2?.message || 'nenhuma linha afetada');

        // Tentativa 3: Apenas status (coluna excluido_em pode não existir)
        const { data: d3, error: err3 } = await supabaseAdmin
          .from('products')
          .update({
            status: 'excluido',
            updated_at: new Date().toISOString()
          })
          .eq('id', validUUID)
          .select('id')
          .maybeSingle();

        if (!err3 && d3) {
          softDeleteSuccess = true;
          console.log(`[API /api/produtos DELETE] Soft delete (apenas status) OK para ${validUUID}`);
        } else {
          console.error('[API /api/produtos DELETE] TODAS as tentativas de soft delete falharam:', err3?.message || 'nenhuma linha afetada');
        }
      }
    }

    if (!softDeleteSuccess) {
      // Verificar se o produto sequer existe
      const { data: existing } = await supabaseAdmin
        .from('products')
        .select('id, store_id')
        .eq('id', validUUID)
        .is('excluido_em', null)
        .maybeSingle();

      if (!existing) {
        // Produto já foi excluído ou nunca existiu — considerar sucesso
        console.log(`[API /api/produtos DELETE] Produto ${validUUID} não encontrado no banco (já excluído ou inexistente).`);
        softDeleteSuccess = true;
      } else {
        return NextResponse.json({ 
          error: 'Falha ao excluir produto. A migration de soft delete pode não ter sido executada. Execute migrations_soft_delete.sql no Supabase.',
          details: 'CHECK constraint ou coluna ausente impedindo o UPDATE.'
        }, { status: 500 });
      }
    }

    // Purga imediata do cache do Next.js
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
