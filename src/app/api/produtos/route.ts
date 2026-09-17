import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

const PRODUCT_TYPES = new Set(['pdf', 'ebook', 'video', 'curso', 'simulado']);
const PRODUCT_STATUSES = new Set(['rascunho', 'publicado']);

function isValidProductPrice(value: unknown) {
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 && price <= 100000;
}

function isValidAffiliateRate(value: unknown) {
  const rate = Number(value);
  return Number.isFinite(rate) && rate >= 0 && rate <= 80;
}

function normalizePreviewUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;

  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}
import { supabaseAdmin } from '@/lib/supabase';
import { getRequestUser } from '@/lib/api-auth';

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

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID do produto é obrigatório.' }, { status: 400 });

  const { data: product } = await supabaseAdmin
    .from('products')
    .select('*, images:product_images(*), bncc_skills:product_bncc_skills(bncc_skill_id), store:stores!inner(creator_id)')
    .eq('id', id)
    .eq('store.creator_id', user.id)
    .maybeSingle();
  if (!product) return NextResponse.json({ error: 'Produto não encontrado ou sem permissão.' }, { status: 404 });

  const { data: delivery } = await supabaseAdmin
    .from('product_deliveries')
    .select('arquivo_url, plr_license_url')
    .eq('product_id', id)
    .maybeSingle();
  const { store: _store, ...safeProduct } = product;
  return NextResponse.json({
    success: true,
    product: { ...safeProduct, arquivo_url: delivery?.arquivo_url || null, plr_license_url: delivery?.plr_license_url || null }
  });
}

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
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
      plr_license_url = null,
      allow_affiliates = false,
      affiliate_commission_rate = 0,
      order_bump_id = null,
      page_count = null,
      age_range = null,
      format_details = null,
      preview_url = null,
      seasonal_tags = [],
      bncc_skill_ids
    } = body;

    if (!titulo || !titulo.trim()) {
      return NextResponse.json({ error: 'O título do produto é obrigatório.' }, { status: 400 });
    }
    if (titulo.trim().length > 160 || !PRODUCT_TYPES.has(tipo) || !PRODUCT_STATUSES.has(status) || !isValidProductPrice(preco) || !isValidAffiliateRate(affiliate_commission_rate)) {
      return NextResponse.json({ error: 'Dados do produto inválidos. Revise título, tipo, status e preço.' }, { status: 400 });
    }

    const normalizedPreviewUrl = normalizePreviewUrl(preview_url);
    if (typeof preview_url === 'string' && preview_url.trim() && !normalizedPreviewUrl) {
      return NextResponse.json({ error: 'A prévia deve usar um link público iniciado por http:// ou https://.' }, { status: 400 });
    }

    const normalizedPageCount = page_count === null || page_count === '' ? null : Number(page_count);
    if (normalizedPageCount !== null && (!Number.isInteger(normalizedPageCount) || normalizedPageCount < 1)) {
      return NextResponse.json({ error: 'O número de páginas deve ser um número inteiro maior que zero.' }, { status: 400 });
    }

    if (Boolean(is_plr) && (!(Number(preco_plr) > 0) || !plr_license_url)) {
      return NextResponse.json(
        { error: 'Produtos PLR precisam ter um preço de licença maior que zero e um arquivo ou link de entrega.' },
        { status: 400 }
      );
    }
    if (status === 'publicado' && !arquivo_url) {
      return NextResponse.json(
        { error: 'Envie o arquivo final ou informe um link de entrega antes de publicar o material.' },
        { status: 400 }
      );
    }

    const cleanStoreId = (store_id || '').toString().replace(/^store_/i, '');

    // Tentar resolver o ID real da loja no Supabase se um slug ou alias foi informado
    let targetStoreId: string | null = isValidUUID(cleanStoreId) ? cleanStoreId : null;
    if (targetStoreId) {
      const { data: storeRow } = await supabaseAdmin
        .from('stores')
        .select('id')
        .eq('id', targetStoreId)
        .eq('creator_id', user.id)
        .maybeSingle();
      if (!storeRow) {
        return NextResponse.json({ error: 'Você não tem permissão para adicionar produtos nesta loja.' }, { status: 403 });
      }
    }
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
      has_original_delivery: Boolean(arquivo_url),
      status: status || 'publicado',
      category_id: sanitizeUUID(category_id),
      education_level_id: sanitizeUUID(education_level_id),
      is_free: Boolean(is_free),
      is_plr: Boolean(is_plr),
      preco_plr: Number(preco_plr) || 0,
      has_plr_delivery: Boolean(plr_license_url),
      allow_affiliates: Boolean(allow_affiliates),
      affiliate_commission_rate: Number(affiliate_commission_rate) || 0,
      order_bump_id: isValidUUID(order_bump_id) ? order_bump_id : null,
      page_count: normalizedPageCount,
      age_range: typeof age_range === 'string' && age_range.trim() ? age_range.trim().slice(0, 120) : null,
      format_details: typeof format_details === 'string' && format_details.trim() ? format_details.trim().slice(0, 180) : null,
      preview_url: normalizedPreviewUrl,
      seasonal_tags: Array.isArray(seasonal_tags) ? seasonal_tags.filter((tag) => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean).slice(0, 48) : [],
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
        has_original_delivery: Boolean(arquivo_url),
        status: status || 'publicado',
        is_free: Boolean(is_free),
        is_plr: Boolean(is_plr),
        preco_plr: Number(preco_plr) || 0,
        has_plr_delivery: Boolean(plr_license_url),
        allow_affiliates: Boolean(allow_affiliates),
        affiliate_commission_rate: Number(affiliate_commission_rate) || 0,
        page_count: normalizedPageCount,
        age_range: typeof age_range === 'string' && age_range.trim() ? age_range.trim().slice(0, 120) : null,
        format_details: typeof format_details === 'string' && format_details.trim() ? format_details.trim().slice(0, 180) : null,
        preview_url: normalizedPreviewUrl,
        seasonal_tags: Array.isArray(seasonal_tags) ? seasonal_tags.filter((tag) => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean).slice(0, 48) : [],
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

    const { error: deliveryError } = await supabaseAdmin.from('product_deliveries').upsert({
      product_id: insertedProduct.id,
      arquivo_url: arquivo_url || null,
      plr_license_url: plr_license_url || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'product_id' });
    if (deliveryError) throw deliveryError;

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

    // Inserir habilidades da BNCC
    if (insertedProduct && insertedProduct.id && Array.isArray(bncc_skill_ids) && bncc_skill_ids.length > 0) {
      try {
        const bnccToInsert = bncc_skill_ids.map((skill_id: string) => ({
          product_id: insertedProduct.id,
          bncc_skill_id: sanitizeUUID(skill_id)
        })).filter(item => item.bncc_skill_id !== null);
        
        if (bnccToInsert.length > 0) {
          await supabaseAdmin.from('product_bncc_skills').insert(bnccToInsert);
        }
      } catch (e) {
        console.error('[API /api/produtos POST] Erro ao inserir product_bncc_skills:', e);
      }
    }

    return NextResponse.json({ success: true, product: { ...insertedProduct, arquivo_url: arquivo_url || null, plr_license_url: plr_license_url || null } });
  } catch (err: any) {
    console.error('[API /api/produtos POST] Exceção:', err);
    return NextResponse.json({ error: err.message || 'Erro interno ao criar produto.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado. Token ausente ou inválido.' }, { status: 401 });
    }

    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do produto é obrigatório para atualização.' }, { status: 400 });
    }

    // Validar propriedade do produto
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('store_id, status, is_plr, preco_plr, has_plr_delivery')
      .eq('id', id)
      .maybeSingle();
    if (product) {
      const { data: store } = await supabaseAdmin.from('stores').select('creator_id').eq('id', product.store_id).maybeSingle();
      if (store?.creator_id !== user.id) {
         return NextResponse.json({ error: 'Você não tem permissão para editar este produto.' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });
    }

    const { data: currentDelivery } = await supabaseAdmin
      .from('product_deliveries')
      .select('arquivo_url, plr_license_url')
      .eq('product_id', id)
      .maybeSingle();

    const cleanedUpdates: Record<string, any> = { ...updates };
    if ('titulo' in cleanedUpdates && (typeof cleanedUpdates.titulo !== 'string' || cleanedUpdates.titulo.trim().length < 4 || cleanedUpdates.titulo.trim().length > 160)) {
      return NextResponse.json({ error: 'O título deve ter entre 4 e 160 caracteres.' }, { status: 400 });
    }
    if ('tipo' in cleanedUpdates && !PRODUCT_TYPES.has(cleanedUpdates.tipo)) {
      return NextResponse.json({ error: 'Tipo de material inválido.' }, { status: 400 });
    }
    if ('status' in cleanedUpdates && !PRODUCT_STATUSES.has(cleanedUpdates.status)) {
      return NextResponse.json({ error: 'Status do produto inválido.' }, { status: 400 });
    }
    if ('preco' in cleanedUpdates && !isValidProductPrice(cleanedUpdates.preco)) {
      return NextResponse.json({ error: 'Informe um preço válido entre R$ 0,00 e R$ 100.000,00.' }, { status: 400 });
    }
    if ('affiliate_commission_rate' in cleanedUpdates && !isValidAffiliateRate(cleanedUpdates.affiliate_commission_rate)) {
      return NextResponse.json({ error: 'A comissão por produto deve ficar entre 0% e 80%.' }, { status: 400 });
    }
    const nextIsPlr = 'is_plr' in cleanedUpdates ? Boolean(cleanedUpdates.is_plr) : Boolean(product?.is_plr);
    const nextPlrPrice = 'preco_plr' in cleanedUpdates ? Number(cleanedUpdates.preco_plr) : Number(product?.preco_plr || 0);
    const nextPlrDelivery = 'plr_license_url' in cleanedUpdates ? cleanedUpdates.plr_license_url : currentDelivery?.plr_license_url;
    const nextStatus = 'status' in cleanedUpdates ? cleanedUpdates.status : product.status;
    const nextOriginalDelivery = 'arquivo_url' in cleanedUpdates ? cleanedUpdates.arquivo_url : currentDelivery?.arquivo_url;
    if (nextIsPlr && (!(nextPlrPrice > 0) || !nextPlrDelivery)) {
      return NextResponse.json(
        { error: 'Produtos PLR precisam ter um preço de licença maior que zero e um arquivo ou link de entrega.' },
        { status: 400 }
      );
    }
    if (nextStatus === 'publicado' && !nextOriginalDelivery) {
      return NextResponse.json(
        { error: 'Envie o arquivo final ou informe um link de entrega antes de publicar o material.' },
        { status: 400 }
      );
    }
    if ('category_id' in cleanedUpdates) {
      cleanedUpdates.category_id = sanitizeUUID(cleanedUpdates.category_id);
    }
    if ('education_level_id' in cleanedUpdates) {
      cleanedUpdates.education_level_id = sanitizeUUID(cleanedUpdates.education_level_id);
    }
    if ('order_bump_id' in cleanedUpdates) {
      cleanedUpdates.order_bump_id = sanitizeUUID(cleanedUpdates.order_bump_id);
    }
    if ('page_count' in cleanedUpdates) {
      const pageCount = cleanedUpdates.page_count === null || cleanedUpdates.page_count === '' ? null : Number(cleanedUpdates.page_count);
      if (pageCount !== null && (!Number.isInteger(pageCount) || pageCount < 1)) {
        return NextResponse.json({ error: 'O número de páginas deve ser um número inteiro maior que zero.' }, { status: 400 });
      }
      cleanedUpdates.page_count = pageCount;
    }
    for (const field of ['age_range', 'format_details']) {
      if (field in cleanedUpdates) {
        const value = cleanedUpdates[field];
        cleanedUpdates[field] = typeof value === 'string' && value.trim() ? value.trim().slice(0, 180) : null;
      }
    }
    if ('preview_url' in cleanedUpdates) {
      const previewUrl = normalizePreviewUrl(cleanedUpdates.preview_url);
      if (typeof cleanedUpdates.preview_url === 'string' && cleanedUpdates.preview_url.trim() && !previewUrl) {
        return NextResponse.json({ error: 'A prévia deve usar um link público iniciado por http:// ou https://.' }, { status: 400 });
      }
      cleanedUpdates.preview_url = previewUrl;
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

    const { gallery_urls, bncc_skill_ids, arquivo_url, plr_license_url, ...otherUpdates } = cleanedUpdates;
    if ('arquivo_url' in cleanedUpdates) otherUpdates.has_original_delivery = Boolean(arquivo_url);
    if ('plr_license_url' in cleanedUpdates) otherUpdates.has_plr_delivery = Boolean(plr_license_url);
    otherUpdates.updated_at = new Date().toISOString();

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

    if (arquivo_url !== undefined || plr_license_url !== undefined) {
      const { error: deliveryError } = await supabaseAdmin.from('product_deliveries').upsert({
        product_id: id,
        arquivo_url: arquivo_url !== undefined ? arquivo_url || null : currentDelivery?.arquivo_url || null,
        plr_license_url: plr_license_url !== undefined ? plr_license_url || null : currentDelivery?.plr_license_url || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'product_id' });
      if (deliveryError) throw deliveryError;
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

    // Processar bncc_skill_ids
    if (data && data.id && bncc_skill_ids !== undefined) {
      try {
        // Excluir antigas
        await supabaseAdmin.from('product_bncc_skills').delete().eq('product_id', data.id);
        
        // Inserir novas
        if (Array.isArray(bncc_skill_ids) && bncc_skill_ids.length > 0) {
          const bnccToInsert = bncc_skill_ids.map((skill_id: string) => ({
            product_id: data.id,
            bncc_skill_id: sanitizeUUID(skill_id)
          })).filter(item => item.bncc_skill_id !== null);
          
          if (bnccToInsert.length > 0) {
            await supabaseAdmin.from('product_bncc_skills').insert(bnccToInsert);
          }
        }
      } catch (e) {
        console.error('[API /api/produtos PUT] Erro ao atualizar product_bncc_skills:', e);
      }
    }

    return NextResponse.json({
      success: true,
      product: {
        ...data,
        arquivo_url: arquivo_url !== undefined ? arquivo_url || null : currentDelivery?.arquivo_url || null,
        plr_license_url: plr_license_url !== undefined ? plr_license_url || null : currentDelivery?.plr_license_url || null
      }
    });
  } catch (err: any) {
    console.error('[API /api/produtos PUT] Exceção:', err);
    return NextResponse.json({ error: err.message || 'Erro interno ao atualizar produto.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getRequestUser(request);
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
