import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { deliveryRows,normalizeDeliveryFiles,validateDeliveryFiles } from '@/lib/product-delivery-files';
import { syncSavedProductToWoo } from '@/lib/woocommerce-service';
import { isValidAffiliateRate,isValidProductPrice,isValidUUID,normalizeInstagramVideoUrl,normalizePreviewUrl,PRODUCT_STATUSES,PRODUCT_TYPES,sanitizeUUID,sanitizeUUIDList,uniqueProductSlug } from './helpers';

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
      .select('store_id,status,is_plr,preco,preco_original,is_free,preco_plr,has_plr_delivery,titulo,descricao,capa_url,category_id,education_level_id,color_mode,import_source,import_incomplete,import_price_confirmed')
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
      .select('arquivo_url, arquivo_nome, plr_license_url')
      .eq('product_id', id)
      .maybeSingle();

    const cleanedUpdates: Record<string, any> = { ...updates };
    const confirmsImportedPrice = cleanedUpdates.confirm_import_price === true;
    delete cleanedUpdates.confirm_import_price;
    delete cleanedUpdates.import_source;
    delete cleanedUpdates.import_incomplete;
    delete cleanedUpdates.import_price_confirmed;
    const hasOriginalFilesUpdate = 'delivery_files' in cleanedUpdates;
    const hasPlrFilesUpdate = 'plr_delivery_files' in cleanedUpdates;
    const normalizedDeliveryFiles = normalizeDeliveryFiles(cleanedUpdates.delivery_files);
    const normalizedPlrDeliveryFiles = normalizeDeliveryFiles(cleanedUpdates.plr_delivery_files);
    validateDeliveryFiles(normalizedDeliveryFiles);
    validateDeliveryFiles(normalizedPlrDeliveryFiles);
    if (hasOriginalFilesUpdate && normalizedDeliveryFiles.length) {
      cleanedUpdates.arquivo_url = normalizedDeliveryFiles[0].url;
      cleanedUpdates.arquivo_nome = normalizedDeliveryFiles[0].name;
    }
    if (hasPlrFilesUpdate && normalizedPlrDeliveryFiles.length) cleanedUpdates.plr_license_url = normalizedPlrDeliveryFiles[0].url;
    if ('titulo' in cleanedUpdates && (typeof cleanedUpdates.titulo !== 'string' || cleanedUpdates.titulo.trim().length < 4 || cleanedUpdates.titulo.trim().length > 160)) {
      return NextResponse.json({ error: 'O título deve ter entre 4 e 160 caracteres.' }, { status: 400 });
    }
    if (typeof cleanedUpdates.titulo === 'string') cleanedUpdates.slug = await uniqueProductSlug(cleanedUpdates.titulo.trim(), id);
    if ('tipo' in cleanedUpdates && !PRODUCT_TYPES.has(cleanedUpdates.tipo)) {
      return NextResponse.json({ error: 'Tipo de material inválido.' }, { status: 400 });
    }
    if ('status' in cleanedUpdates && !PRODUCT_STATUSES.has(cleanedUpdates.status)) {
      return NextResponse.json({ error: 'Status do produto inválido.' }, { status: 400 });
    }
    if ('preco' in cleanedUpdates && !isValidProductPrice(cleanedUpdates.preco)) {
      return NextResponse.json({ error: 'Informe um preço válido entre R$ 0,00 e R$ 100.000,00.' }, { status: 400 });
    }
    if ('preco_original' in cleanedUpdates && cleanedUpdates.preco_original !== null && cleanedUpdates.preco_original !== '' && !isValidProductPrice(cleanedUpdates.preco_original)) {
      return NextResponse.json({ error: 'Informe um preço original válido entre R$ 0,00 e R$ 100.000,00.' }, { status: 400 });
    }
    if ('affiliate_commission_rate' in cleanedUpdates && !isValidAffiliateRate(cleanedUpdates.affiliate_commission_rate)) {
      return NextResponse.json({ error: 'A comissão por produto deve ficar entre 0% e 80%.' }, { status: 400 });
    }
    const nextIsPlr = 'is_plr' in cleanedUpdates ? Boolean(cleanedUpdates.is_plr) : Boolean(product?.is_plr);
    const nextPlrPrice = 'preco_plr' in cleanedUpdates ? Number(cleanedUpdates.preco_plr) : Number(product?.preco_plr || 0);
    const nextPlrDelivery = hasPlrFilesUpdate ? normalizedPlrDeliveryFiles[0]?.url || cleanedUpdates.plr_license_url : ('plr_license_url' in cleanedUpdates ? cleanedUpdates.plr_license_url : currentDelivery?.plr_license_url);
    const nextStatus = 'status' in cleanedUpdates ? cleanedUpdates.status : product.status;
    const nextOriginalDelivery = hasOriginalFilesUpdate ? normalizedDeliveryFiles[0]?.url || cleanedUpdates.arquivo_url : ('arquivo_url' in cleanedUpdates ? cleanedUpdates.arquivo_url : currentDelivery?.arquivo_url);
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
    if ('category_ids' in cleanedUpdates) {
      if (!Array.isArray(cleanedUpdates.category_ids) || cleanedUpdates.category_ids.length > 5) {
        return NextResponse.json({ error: 'Selecione no máximo 5 categorias/temas.' }, { status: 400 });
      }
      cleanedUpdates.category_ids = sanitizeUUIDList(cleanedUpdates.category_ids, cleanedUpdates.category_id);
      cleanedUpdates.category_id = cleanedUpdates.category_ids[0] || null;
    }
    if ('education_level_id' in cleanedUpdates) {
      cleanedUpdates.education_level_id = sanitizeUUID(cleanedUpdates.education_level_id);
    }
    if ('education_level_ids' in cleanedUpdates) {
      if (!Array.isArray(cleanedUpdates.education_level_ids) || cleanedUpdates.education_level_ids.length > 5) {
        return NextResponse.json({ error: 'Selecione no máximo 5 níveis de escolaridade.' }, { status: 400 });
      }
      cleanedUpdates.education_level_ids = sanitizeUUIDList(cleanedUpdates.education_level_ids, cleanedUpdates.education_level_id);
      cleanedUpdates.education_level_id = cleanedUpdates.education_level_ids[0] || null;
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
    if ('color_mode' in cleanedUpdates && !['colorido', 'preto_e_branco'].includes(cleanedUpdates.color_mode)) {
      return NextResponse.json({ error: 'Escolha se o material é colorido ou em preto e branco.' }, { status: 400 });
    }
    if ('preview_url' in cleanedUpdates) {
      const previewUrl = normalizePreviewUrl(cleanedUpdates.preview_url);
      if (typeof cleanedUpdates.preview_url === 'string' && cleanedUpdates.preview_url.trim() && !previewUrl) {
        return NextResponse.json({ error: 'A prévia deve usar um link público iniciado por http:// ou https://.' }, { status: 400 });
      }
      cleanedUpdates.preview_url = previewUrl;
    }
    if ('instagram_video_url' in cleanedUpdates) {
      const instagramVideoUrl = normalizeInstagramVideoUrl(cleanedUpdates.instagram_video_url);
      if (typeof cleanedUpdates.instagram_video_url === 'string' && cleanedUpdates.instagram_video_url.trim() && !instagramVideoUrl) {
        return NextResponse.json({ error: 'Use o link público de um post ou Reel do Instagram.' }, { status: 400 });
      }
      cleanedUpdates.instagram_video_url = instagramVideoUrl;
    }
    if ('is_free' in cleanedUpdates && cleanedUpdates.is_free) {
      cleanedUpdates.is_free = Boolean(cleanedUpdates.is_free);
      cleanedUpdates.preco = 0;
    }
    if ('preco' in cleanedUpdates || 'preco_original' in cleanedUpdates || 'is_free' in cleanedUpdates) {
      const nextIsFree = 'is_free' in cleanedUpdates ? Boolean(cleanedUpdates.is_free) : Boolean(product.is_free);
      const nextPrice = 'preco' in cleanedUpdates ? Number(cleanedUpdates.preco) : Number(product.preco);
      const rawOriginal = 'preco_original' in cleanedUpdates ? cleanedUpdates.preco_original : product.preco_original;
      const nextOriginalPrice = rawOriginal === null || rawOriginal === '' || nextIsFree ? null : Number(rawOriginal);
      if (nextOriginalPrice !== null && (!(nextOriginalPrice > nextPrice) || !Number.isFinite(nextOriginalPrice))) {
        return NextResponse.json({ error: 'O preço original deve ser maior que o preço de venda.' }, { status: 400 });
      }
      cleanedUpdates.preco_original = nextOriginalPrice;
      cleanedUpdates.is_featured_offer = Boolean(nextOriginalPrice !== null && nextOriginalPrice > nextPrice && !nextIsFree);
    }

    if (product.import_incomplete) {
      const missing: string[] = [];
      const priceConfirmed = Boolean(product.import_price_confirmed || confirmsImportedPrice);
      if (!priceConfirmed) missing.push('confirmação do preço');
      if (!nextOriginalDelivery) missing.push('arquivo ou link de entrega');
      if (nextStatus === 'publicado' && missing.length) {
        return NextResponse.json({ error: `Complete o produto antes de publicar: ${missing.join(', ')}.` }, { status: 400 });
      }
      if (priceConfirmed) cleanedUpdates.import_price_confirmed = true;
      if (!missing.length) cleanedUpdates.import_incomplete = false;
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

    const { gallery_urls, bncc_skill_ids, arquivo_url, arquivo_nome, plr_license_url, delivery_files: _deliveryFiles, plr_delivery_files: _plrDeliveryFiles, ...otherUpdates } = cleanedUpdates;
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

    if (arquivo_url !== undefined || arquivo_nome !== undefined || plr_license_url !== undefined) {
      const { error: deliveryError } = await supabaseAdmin.from('product_deliveries').upsert({
        product_id: id,
        arquivo_url: arquivo_url !== undefined ? arquivo_url || null : currentDelivery?.arquivo_url || null,
        arquivo_nome: arquivo_nome !== undefined ? (typeof arquivo_nome === 'string' && arquivo_nome.trim() ? arquivo_nome.trim().slice(0, 160) : null) : currentDelivery?.arquivo_nome || null,
        plr_license_url: plr_license_url !== undefined ? plr_license_url || null : currentDelivery?.plr_license_url || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'product_id' });
      if (deliveryError) throw deliveryError;
    }

    if (hasOriginalFilesUpdate) {
      const { error: deleteError } = await supabaseAdmin.from('product_delivery_files').delete().eq('product_id', id).eq('delivery_type', 'original');
      if (deleteError) throw deleteError;
      if (normalizedDeliveryFiles.length) {
        const { error: filesError } = await supabaseAdmin.from('product_delivery_files').insert(deliveryRows(id, 'original', normalizedDeliveryFiles));
        if (filesError) throw filesError;
      }
    }
    if (hasPlrFilesUpdate) {
      const { error: deleteError } = await supabaseAdmin.from('product_delivery_files').delete().eq('product_id', id).eq('delivery_type', 'plr');
      if (deleteError) throw deleteError;
      if (normalizedPlrDeliveryFiles.length) {
        const { error: filesError } = await supabaseAdmin.from('product_delivery_files').insert(deliveryRows(id, 'plr', normalizedPlrDeliveryFiles));
        if (filesError) throw filesError;
      }
    }

    // Purga imediata do cache do Next.js para as páginas afetadas
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/loja/[slug]', 'page');
      revalidatePath('/dashboard', 'page');
      revalidatePath('/dashboard/produtos', 'page');
      revalidatePath('/dashboard/conteudo', 'page');
      revalidatePath('/dashboard/kits', 'page');
    } catch (_e) {}

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

    try { await syncSavedProductToWoo(product.store_id, data.id, new URL(request.url).origin); }
    catch (syncError) { console.error('[API /api/produtos PUT] Sincronização WooCommerce:', syncError); }

    return NextResponse.json({
      success: true,
      product: {
        ...data,
        arquivo_url: arquivo_url !== undefined ? arquivo_url || null : currentDelivery?.arquivo_url || null,
        arquivo_nome: arquivo_nome !== undefined ? (typeof arquivo_nome === 'string' && arquivo_nome.trim() ? arquivo_nome.trim().slice(0, 160) : null) : currentDelivery?.arquivo_nome || null,
        plr_license_url: plr_license_url !== undefined ? plr_license_url || null : currentDelivery?.plr_license_url || null,
        delivery_files: hasOriginalFilesUpdate ? normalizedDeliveryFiles : undefined,
        plr_delivery_files: hasPlrFilesUpdate ? normalizedPlrDeliveryFiles : undefined
      }
    });
  } catch (err: any) {
    console.error('[API /api/produtos PUT] Exceção:', err);
    return NextResponse.json({ error: err.message || 'Erro interno ao atualizar produto.' }, { status: 500 });
  }
}
