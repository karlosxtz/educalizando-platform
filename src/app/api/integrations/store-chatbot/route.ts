import { resolveCreatorWhatsAppAccess } from '@/lib/creator-whatsapp-access';
import { consumeRequestRateLimit, rateLimitResponse } from '@/lib/request-rate-limit';
import { hashStoreChatbotApiKey, isStoreChatbotApiKey, readStoreChatbotApiKey } from '@/lib/store-chatbot-api';
import { buildWhatsAppCatalogMessage, catalogItemMatches, normalizeCatalogSearch } from '@/lib/store-chatbot-catalog-search';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

type Row = Record<string, unknown>;
type ProductRow = Row & { id: string; titulo: string; slug?: string | null; is_free?: boolean; category_id?: string | null; category_ids?: string[] | null; education_level_id?: string | null; education_level_ids?: string[] | null };

const PRODUCT_FIELDS = 'id,titulo,slug,descricao,tipo,preco,preco_original,is_free,is_plr,plr_descricao,preco_plr,capa_url,preview_url,instagram_video_url,page_count,age_range,format_details,category_id,category_ids,education_level_id,education_level_ids,seasonal_tags,tags,created_at,updated_at';

function text(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function absoluteUrl(value: unknown, origin: string) {
  const candidate = text(value)?.trim();
  if (!candidate) return null;
  try { return new URL(candidate, origin).toString(); } catch { return null; }
}

function publicProduct(product: ProductRow, storeSlug: string, origin: string, categoryNames: Map<string, string>, levelNames: Map<string, string>) {
  const categoryIds = [...new Set([product.category_id, ...(product.category_ids || [])].filter((id): id is string => Boolean(id)))];
  const levelIds = [...new Set([product.education_level_id, ...(product.education_level_ids || [])].filter((id): id is string => Boolean(id)))];
  const path = `/loja/${encodeURIComponent(storeSlug)}/produto/${encodeURIComponent(product.slug || product.id)}`;
  const publicUrl = `${origin}${path}`;
  const coverUrl = absoluteUrl(product.capa_url, origin);
  const description = text(product.descricao);
  const price = Number(product.preco || 0);
  const plrPrice = Number(product.preco_plr || 0);
  const plrUrl = `${publicUrl}?licenca=plr`;
  const preparedWhatsAppMessage = buildWhatsAppCatalogMessage({
    title: product.titulo,
    description,
    finalPrice: price,
    finalUrl: publicUrl,
    free: product.is_free === true,
    plr: product.is_plr === true ? { price: plrPrice, url: plrUrl } : null,
  });
  return {
    id: product.id,
    title: product.titulo,
    slug: product.slug || product.id,
    description,
    type: text(product.tipo),
    price,
    originalPrice: product.preco_original == null ? null : Number(product.preco_original),
    isFree: product.is_free === true,
    isPlr: product.is_plr === true,
    plr: product.is_plr === true ? {
      description: text(product.plr_descricao),
      price: plrPrice,
      publicUrl: plrUrl,
      whatsapp: {
        imageUrl: coverUrl,
        message: preparedWhatsAppMessage,
        descriptionSource: 'catalog',
      },
    } : null,
    coverUrl,
    previewUrl: absoluteUrl(product.preview_url, origin),
    instagramVideoUrl: absoluteUrl(product.instagram_video_url, origin),
    pageCount: product.page_count == null ? null : Number(product.page_count),
    ageRange: text(product.age_range),
    formatDetails: text(product.format_details),
    categories: categoryIds.map((id) => ({ id, name: categoryNames.get(id) || null })),
    educationLevels: levelIds.map((id) => ({ id, name: levelNames.get(id) || null })),
    themes: Array.isArray(product.seasonal_tags) ? product.seasonal_tags : [],
    tags: Array.isArray(product.tags) ? product.tags : [],
    publicUrl,
    whatsapp: {
      imageUrl: coverUrl,
      message: preparedWhatsAppMessage,
      descriptionSource: 'catalog',
    },
    createdAt: product.created_at,
    updatedAt: product.updated_at || null,
  };
}

export async function GET(request: Request) {
  const limited = await consumeRequestRateLimit(request, { namespace: 'store-chatbot-api', limit: 120, windowMs: 60_000 });
  if (!limited.allowed) return rateLimitResponse(limited);

  try {
    const apiKey = readStoreChatbotApiKey(request);
    if (!isStoreChatbotApiKey(apiKey)) {
      return NextResponse.json({ error: 'Chave de API ausente ou inválida. Envie Authorization: Bearer SUA_CHAVE.' }, { status: 401 });
    }

    const keyHash = hashStoreChatbotApiKey(apiKey);
    const { data: keyRecord, error: keyError } = await supabaseAdmin.from('store_chatbot_api_keys')
      .select('id,store_id,revoked_at')
      .eq('key_hash', keyHash)
      .is('revoked_at', null)
      .maybeSingle();
    if (keyError) throw keyError;
    if (!keyRecord) return NextResponse.json({ error: 'Chave de API inválida ou revogada.' }, { status: 401 });

    const access = await resolveCreatorWhatsAppAccess(keyRecord.store_id);
    if (!access.active) {
      return NextResponse.json({ error: 'A integração desta loja está suspensa. O módulo precisa estar pago ou liberado pelo administrador.' }, { status: 403 });
    }

    const [storeResult, productsResult, clubsResult, kitsResult] = await Promise.all([
      supabaseAdmin.from('stores')
        .select('id,nome_loja,slug,descricao,logo_url,banner_url,cor_primaria,whatsapp,instagram,tiktok,facebook,youtube,website,author_image_url,author_bio,welcome_message')
        .eq('id', keyRecord.store_id)
        .maybeSingle(),
      supabaseAdmin.from('products').select(PRODUCT_FIELDS)
        .eq('store_id', keyRecord.store_id).eq('status', 'publicado').is('excluido_em', null)
        .order('created_at', { ascending: false }).limit(5000),
      supabaseAdmin.from('creator_clubs').select('id,name,slug,description,cover_url,monthly_price,created_at,updated_at')
        .eq('store_id', keyRecord.store_id).eq('status', 'published').order('created_at', { ascending: false }),
      supabaseAdmin.from('kits').select('id,titulo,descricao,capa_url,preco_kit,created_at,updated_at,kit_items(product_id)')
        .eq('store_id', keyRecord.store_id).eq('status', 'publicado').is('excluido_em', null).order('created_at', { ascending: false }),
    ]);
    const firstError = storeResult.error || productsResult.error || clubsResult.error || kitsResult.error;
    if (firstError) throw firstError;
    if (!storeResult.data) return NextResponse.json({ error: 'Loja não encontrada.' }, { status: 404 });

    const store = storeResult.data as Row & { id: string; slug: string; nome_loja: string };
    const rawProducts = (productsResult.data || []) as ProductRow[];
    const categoryIds = [...new Set(rawProducts.flatMap((product) => [product.category_id, ...(product.category_ids || [])]).filter((id): id is string => Boolean(id)))];
    const levelIds = [...new Set(rawProducts.flatMap((product) => [product.education_level_id, ...(product.education_level_ids || [])]).filter((id): id is string => Boolean(id)))];
    const clubIds = (clubsResult.data || []).map((club) => club.id);
    const [categoriesResult, levelsResult, clubMaterialsResult] = await Promise.all([
      categoryIds.length ? supabaseAdmin.from('categories').select('id,nome').in('id', categoryIds) : Promise.resolve({ data: [], error: null }),
      levelIds.length ? supabaseAdmin.from('education_levels').select('id,nome').in('id', levelIds) : Promise.resolve({ data: [], error: null }),
      clubIds.length ? supabaseAdmin.from('creator_club_materials').select('club_id,product_id').in('club_id', clubIds) : Promise.resolve({ data: [], error: null }),
    ]);
    const relationError = categoriesResult.error || levelsResult.error || clubMaterialsResult.error;
    if (relationError) throw relationError;

    const origin = new URL(request.url).origin;
    const categoryNames = new Map((categoriesResult.data || []).map((item) => [item.id, item.nome]));
    const levelNames = new Map((levelsResult.data || []).map((item) => [item.id, item.nome]));
    const products = rawProducts.map((product) => publicProduct(product, store.slug, origin, categoryNames, levelNames));
    const productById = new Map(products.map((product) => [product.id, product]));
    const clubMaterials = clubMaterialsResult.data || [];
    const clubs = (clubsResult.data || []).map((club) => ({
      id: club.id,
      name: club.name,
      slug: club.slug,
      description: club.description,
      coverUrl: club.cover_url,
      monthlyPrice: Number(club.monthly_price || 0),
      publicUrl: `${origin}/clube/${encodeURIComponent(club.slug)}`,
      materials: clubMaterials.filter((item) => item.club_id === club.id).map((item) => productById.get(item.product_id)).filter(Boolean),
      createdAt: club.created_at,
      updatedAt: club.updated_at || null,
    }));
    const kits = (kitsResult.data || []).map((kit) => ({
      id: kit.id,
      title: kit.titulo,
      description: kit.descricao,
      coverUrl: kit.capa_url,
      price: Number(kit.preco_kit || 0),
      publicUrl: `${origin}/loja/${encodeURIComponent(store.slug)}/kit/${encodeURIComponent(kit.id)}`,
      materials: (kit.kit_items || []).map((item: { product_id: string }) => productById.get(item.product_id)).filter(Boolean),
      createdAt: kit.created_at,
      updatedAt: kit.updated_at || null,
    }));

    const query = normalizeCatalogSearch(new URL(request.url).searchParams.get('q'));
    const section = new URL(request.url).searchParams.get('section') || 'all';
    const matches = (items: Array<Record<string, unknown>>) => query ? items.filter((item) => catalogItemMatches(item, query)) : items;
    const paidProducts = matches(products.filter((product) => !product.isFree));
    const freeMaterials = matches(products.filter((product) => product.isFree));
    const plrProducts = matches(products.filter((product) => product.isPlr));
    const visibleClubs = matches(clubs);
    const visibleKits = matches(kits);
    const payload = {
      apiVersion: '1.0',
      generatedAt: new Date().toISOString(),
      scope: { storeId: store.id, privateToStore: true, externalSearch: false, query: query || null },
      store: {
        id: store.id,
        name: store.nome_loja,
        slug: store.slug,
        description: text(store.descricao),
        logoUrl: text(store.logo_url),
        bannerUrl: text(store.banner_url),
        primaryColor: text(store.cor_primaria),
        author: { imageUrl: text(store.author_image_url), bio: text(store.author_bio) },
        welcomeMessage: text(store.welcome_message),
        publicUrl: `${origin}/loja/${encodeURIComponent(store.slug)}`,
        contact: { whatsapp: text(store.whatsapp), website: text(store.website) },
        socialNetworks: { instagram: text(store.instagram), tiktok: text(store.tiktok), facebook: text(store.facebook), youtube: text(store.youtube) },
      },
      counts: { products: paidProducts.length, plrProducts: plrProducts.length, freeMaterials: freeMaterials.length, clubs: visibleClubs.length, kits: visibleKits.length },
      ...(section === 'all' || section === 'products' ? { products: paidProducts } : {}),
      ...(section === 'all' || section === 'plr' ? { plrProducts } : {}),
      ...(section === 'all' || section === 'free_materials' ? { freeMaterials } : {}),
      ...(section === 'all' || section === 'clubs' ? { clubs: visibleClubs } : {}),
      ...(section === 'all' || section === 'kits' ? { kits: visibleKits } : {}),
    };

    await supabaseAdmin.from('store_chatbot_api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyRecord.id);
    return NextResponse.json(payload, { headers: { 'Cache-Control': 'private, no-store', 'X-RateLimit-Remaining': String(limited.remaining) } });
  } catch (error) {
    console.error('[Store Chatbot Integration] Falha:', error);
    return NextResponse.json({ error: 'Não foi possível consultar o catálogo desta loja agora.' }, { status: 503 });
  }
}
