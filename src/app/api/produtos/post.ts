import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { deliveryRows,normalizeDeliveryFiles,validateDeliveryFiles } from '@/lib/product-delivery-files';
import { isValidAffiliateRate,isValidProductPrice,isValidUUID,normalizeInstagramVideoUrl,normalizePreviewUrl,PRODUCT_STATUSES,PRODUCT_TYPES,sanitizeUUID,sanitizeUUIDList,uniqueProductSlug } from './helpers';

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
      preco_original = null,
      capa_url,
      arquivo_url,
      arquivo_nome = null,
      delivery_files = [],
      status = 'publicado',
      category_id,
      category_ids = [],
      education_level_id,
      education_level_ids = [],
      gallery_urls,
      is_free = false,
      is_plr = false,
      plr_descricao = null,
      preco_plr = 0,
      plr_license_url = null,
      plr_delivery_files = [],
      allow_affiliates = false,
      affiliate_commission_rate = 0,
      order_bump_id = null,
      page_count = null,
      age_range = null,
      format_details = null,
      preview_url = null,
      instagram_video_url = null,
      seasonal_tags = [],
      tags = [],
      bncc_skill_ids
    } = body;
    const normalizedDeliveryFiles = normalizeDeliveryFiles(delivery_files);
    const normalizedPlrDeliveryFiles = normalizeDeliveryFiles(plr_delivery_files);
    validateDeliveryFiles(normalizedDeliveryFiles);
    validateDeliveryFiles(normalizedPlrDeliveryFiles);
    const primaryOriginalUrl = normalizedDeliveryFiles[0]?.url || arquivo_url || null;
    const primaryOriginalName = normalizedDeliveryFiles[0]?.name || arquivo_nome || null;
    const primaryPlrUrl = normalizedPlrDeliveryFiles[0]?.url || plr_license_url || null;

    if (!titulo || !titulo.trim()) {
      return NextResponse.json({ error: 'O título do produto é obrigatório.' }, { status: 400 });
    }
    if (titulo.trim().length > 160 || !PRODUCT_TYPES.has(tipo) || !PRODUCT_STATUSES.has(status) || !isValidProductPrice(preco) || !isValidAffiliateRate(affiliate_commission_rate)) {
      return NextResponse.json({ error: 'Dados do produto inválidos. Revise título, tipo, status e preço.' }, { status: 400 });
    }
    if ((Array.isArray(category_ids) && category_ids.length > 5) || (Array.isArray(education_level_ids) && education_level_ids.length > 5)) {
      return NextResponse.json({ error: 'Selecione no máximo 5 categorias e 5 níveis de escolaridade.' }, { status: 400 });
    }
    const normalizedCategoryIds = sanitizeUUIDList(category_ids, category_id);
    const normalizedEducationLevelIds = sanitizeUUIDList(education_level_ids, education_level_id);
    const normalizedOriginalPrice = preco_original === null || preco_original === '' ? null : Number(preco_original);
    if (normalizedOriginalPrice !== null && (!isValidProductPrice(normalizedOriginalPrice) || normalizedOriginalPrice <= Number(preco) || Boolean(is_free))) {
      return NextResponse.json({ error: 'O preço original deve ser maior que o preço de venda e não pode ser usado em materiais gratuitos.' }, { status: 400 });
    }

    const normalizedPreviewUrl = normalizePreviewUrl(preview_url);
    if (typeof preview_url === 'string' && preview_url.trim() && !normalizedPreviewUrl) {
      return NextResponse.json({ error: 'A prévia deve usar um link público iniciado por http:// ou https://.' }, { status: 400 });
    }
    const normalizedInstagramVideoUrl = normalizeInstagramVideoUrl(instagram_video_url);
    if (typeof instagram_video_url === 'string' && instagram_video_url.trim() && !normalizedInstagramVideoUrl) {
      return NextResponse.json({ error: 'Use o link público de um post ou Reel do Instagram.' }, { status: 400 });
    }

    const normalizedPageCount = page_count === null || page_count === '' ? null : Number(page_count);
    if (normalizedPageCount !== null && (!Number.isInteger(normalizedPageCount) || normalizedPageCount < 1)) {
      return NextResponse.json({ error: 'O número de páginas deve ser um número inteiro maior que zero.' }, { status: 400 });
    }

    if (Boolean(is_plr) && (!(Number(preco_plr) > 0) || !primaryPlrUrl)) {
      return NextResponse.json(
        { error: 'Produtos PLR precisam ter um preço de licença maior que zero e um arquivo ou link de entrega.' },
        { status: 400 }
      );
    }
    if (Boolean(is_plr) && (typeof plr_descricao !== 'string' || plr_descricao.trim().length < 20)) {
      return NextResponse.json({ error: 'A descrição exclusiva da Licença PLR é obrigatória e deve ter pelo menos 20 caracteres.' }, { status: 400 });
    }
    if (status === 'publicado' && !primaryOriginalUrl) {
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
      } catch (_e) {}
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
      } catch (_e) {
        return NextResponse.json({ error: 'Erro ao resolver a loja do criador.' }, { status: 500 });
      }
    }

    const productPayload: Record<string, any> = {
      titulo: titulo.trim(),
      slug: await uniqueProductSlug(titulo.trim()),
      descricao: descricao || null,
      tipo,
      preco: Number(preco) || 0,
      preco_original: normalizedOriginalPrice,
      is_featured_offer: normalizedOriginalPrice !== null && normalizedOriginalPrice > Number(preco) && !Boolean(is_free),
      capa_url: capa_url || null,
      has_original_delivery: Boolean(primaryOriginalUrl),
      status: status || 'publicado',
      category_id: normalizedCategoryIds[0] || null,
      category_ids: normalizedCategoryIds,
      education_level_id: normalizedEducationLevelIds[0] || null,
      education_level_ids: normalizedEducationLevelIds,
      is_free: Boolean(is_free),
      is_plr: Boolean(is_plr),
      plr_descricao: Boolean(is_plr) ? plr_descricao.trim().slice(0, 8000) : null,
      preco_plr: Number(preco_plr) || 0,
      has_plr_delivery: Boolean(primaryPlrUrl),
      allow_affiliates: Boolean(allow_affiliates),
      affiliate_commission_rate: Number(affiliate_commission_rate) || 0,
      order_bump_id: isValidUUID(order_bump_id) ? order_bump_id : null,
      page_count: normalizedPageCount,
      age_range: typeof age_range === 'string' && age_range.trim() ? age_range.trim().slice(0, 120) : null,
      format_details: typeof format_details === 'string' && format_details.trim() ? format_details.trim().slice(0, 180) : null,
      preview_url: normalizedPreviewUrl,
      instagram_video_url: normalizedInstagramVideoUrl,
      seasonal_tags: Array.isArray(seasonal_tags) ? seasonal_tags.filter((tag) => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean).slice(0, 48) : [],
      tags: Array.isArray(tags) ? tags.filter((tag) => typeof tag === 'string').map((tag) => tag.trim().toLowerCase()).filter(Boolean).slice(0, 20) : [],
      created_at: new Date().toISOString()
    };

    if (productPayload.is_free) {
      productPayload.preco = 0;
      productPayload.preco_original = null;
      productPayload.is_featured_offer = false;
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
        slug: productPayload.slug,
        descricao: descricao || null,
        tipo,
        preco: Number(preco) || 0,
        preco_original: normalizedOriginalPrice,
        is_featured_offer: normalizedOriginalPrice !== null && normalizedOriginalPrice > Number(preco) && !Boolean(is_free),
        capa_url: capa_url || null,
        has_original_delivery: Boolean(primaryOriginalUrl),
        status: status || 'publicado',
        category_id: normalizedCategoryIds[0] || null,
        category_ids: normalizedCategoryIds,
        education_level_id: normalizedEducationLevelIds[0] || null,
        education_level_ids: normalizedEducationLevelIds,
        is_free: Boolean(is_free),
        is_plr: Boolean(is_plr),
        plr_descricao: Boolean(is_plr) ? plr_descricao.trim().slice(0, 8000) : null,
        preco_plr: Number(preco_plr) || 0,
        has_plr_delivery: Boolean(primaryPlrUrl),
        allow_affiliates: Boolean(allow_affiliates),
        affiliate_commission_rate: Number(affiliate_commission_rate) || 0,
        page_count: normalizedPageCount,
        age_range: typeof age_range === 'string' && age_range.trim() ? age_range.trim().slice(0, 120) : null,
        format_details: typeof format_details === 'string' && format_details.trim() ? format_details.trim().slice(0, 180) : null,
        preview_url: normalizedPreviewUrl,
        instagram_video_url: normalizedInstagramVideoUrl,
        seasonal_tags: Array.isArray(seasonal_tags) ? seasonal_tags.filter((tag) => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean).slice(0, 48) : [],
        tags: Array.isArray(tags) ? tags.filter((tag) => typeof tag === 'string').map((tag) => tag.trim().toLowerCase()).filter(Boolean).slice(0, 20) : [],
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
      arquivo_url: primaryOriginalUrl,
      arquivo_nome: typeof primaryOriginalName === 'string' && primaryOriginalName.trim() ? primaryOriginalName.trim().slice(0, 160) : null,
      plr_license_url: primaryPlrUrl,
      updated_at: new Date().toISOString()
    }, { onConflict: 'product_id' });
    if (deliveryError) throw deliveryError;

    const allDeliveryRows = [
      ...deliveryRows(insertedProduct.id, 'original', normalizedDeliveryFiles.length ? normalizedDeliveryFiles : primaryOriginalUrl ? [{ url: primaryOriginalUrl, name: primaryOriginalName || 'Arquivo principal' }] : []),
      ...deliveryRows(insertedProduct.id, 'plr', normalizedPlrDeliveryFiles.length ? normalizedPlrDeliveryFiles : primaryPlrUrl ? [{ url: primaryPlrUrl, name: 'Arquivo da licença PLR' }] : []),
    ];
    if (allDeliveryRows.length) {
      const { error: filesError } = await supabaseAdmin.from('product_delivery_files').insert(allDeliveryRows);
      if (filesError) throw filesError;
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

    return NextResponse.json({ success: true, product: { ...insertedProduct, arquivo_url: primaryOriginalUrl, arquivo_nome: primaryOriginalName, plr_license_url: primaryPlrUrl, delivery_files: normalizedDeliveryFiles, plr_delivery_files: normalizedPlrDeliveryFiles } });
  } catch (err: any) {
    console.error('[API /api/produtos POST] Exceção:', err);
    return NextResponse.json({ error: err.message || 'Erro interno ao criar produto.' }, { status: 500 });
  }
}
