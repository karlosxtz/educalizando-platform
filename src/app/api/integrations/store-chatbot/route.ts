import { resolveCreatorWhatsAppAccess } from '@/lib/creator-whatsapp-access';
import { consumeRequestRateLimit } from '@/lib/request-rate-limit';
import { hashStoreChatbotApiKey, isStoreChatbotApiKey, readStoreChatbotApiKey } from '@/lib/store-chatbot-api';
import { buildWhatsAppCatalogMessage } from '@/lib/store-chatbot-catalog-search';
import { catalogFacets, CatalogQueryError, catalogSuggestions, commemorativeDates, paginateCatalog, parseCatalogQuery, selectCatalogItems } from '@/lib/store-chatbot-query';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

type Row = Record<string, unknown>;
type ProductRow = Row & { id: string; titulo: string; slug?: string | null; is_free?: boolean; category_id?: string | null; category_ids?: string[] | null; education_level_id?: string | null; education_level_ids?: string[] | null };

const PRODUCT_FIELDS = 'id,titulo,slug,descricao,tipo,preco,preco_original,is_free,is_plr,plr_descricao,preco_plr,capa_url,preview_url,instagram_video_url,page_count,age_range,format_details,color_mode,category_id,category_ids,education_level_id,education_level_ids,seasonal_tags,tags,created_at,updated_at';

function text(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function catalogPrice(value: unknown) {
  if(value == null || value === '') return null;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

function absoluteUrl(value: unknown, origin: string) {
  const candidate = text(value)?.trim();
  if (!candidate) return null;
  try { const url = new URL(candidate, origin); return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : null; } catch { return null; }
}

function publicProduct(product: ProductRow, storeSlug: string, origin: string, categoryNames: Map<string, string>, levelNames: Map<string, string>) {
  const categoryIds = [...new Set([product.category_id, ...(product.category_ids || [])].filter((id): id is string => Boolean(id)))];
  const levelIds = [...new Set([product.education_level_id, ...(product.education_level_ids || [])].filter((id): id is string => Boolean(id)))];
  const path = `/loja/${encodeURIComponent(storeSlug)}/produto/${encodeURIComponent(product.slug || product.id)}`;
  const publicUrl = `${origin}${path}`;
  const coverUrl = absoluteUrl(product.capa_url, origin);
  const description = text(product.descricao);
  const price = product.is_free === true ? 0 : catalogPrice(product.preco);
  const plrPrice = catalogPrice(product.preco_plr);
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
    originalPrice: catalogPrice(product.preco_original),
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
    colorMode: text(product.color_mode),
    categories: categoryIds.map((id) => ({ id, name: categoryNames.get(id) || null })),
    educationLevels: levelIds.map((id) => ({ id, name: levelNames.get(id) || null })),
    themes: Array.isArray(product.seasonal_tags) ? product.seasonal_tags : [],
    commemorativeDates: commemorativeDates(product.seasonal_tags),
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

// PostgREST can cap each response at 1,000 rows. Report bounded coverage explicitly.
async function readCatalog(load: (start: number, end: number) => PromiseLike<{data: unknown[] | null; error: unknown; count: number | null}>) {
  const rows: Row[] = [];
  let total = 0;
  for (let start = 0; start < 5000; start += 1000) {
    const result = await load(start,start+999);
    if(result.error) throw result.error;
    total = result.count ?? total;
    const batch = (result.data || []) as Row[];
    rows.push(...batch);
    if(batch.length < 1000 || result.count !== null && rows.length >= total) break;
  }
  return {data:rows,error:null,coverage:{loaded:rows.length,total:Math.max(total,rows.length),truncated:total > rows.length}};
}

async function readRelations(ids: string[], load: (ids: string[], start: number, end: number) => Parameters<typeof readCatalog>[0] extends (start: number,end: number) => infer R ? R : never) {
  const data: Row[] = [];
  for(let i=0;i<ids.length;i+=100) {
    const result = await readCatalog((start,end) => load(ids.slice(i,i+100),start,end));
    if(result.coverage.truncated) throw new Error('Relation coverage exceeded');
    data.push(...result.data);
  }
  return {data,error:null};
}

async function withDeadline<T>(task: Promise<T>, signal: AbortSignal): Promise<T> {
  if(signal.aborted) throw new Error('Deadline exceeded');
  let listener: () => void = () => {};
  const timeout = new Promise<never>((_,reject) => {
    listener = () => reject(new Error('Deadline exceeded'));
    signal.addEventListener('abort',listener,{once:true});
  });
  try { return await Promise.race([task,timeout]); }
  finally { signal.removeEventListener('abort',listener); }
}

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), 20_000);
  const headers = { 'Cache-Control':'private, no-store', 'X-Request-ID':requestId };
  const fail = (status: number, code: string, error: string, extra: Record<string,string> = {}) => NextResponse.json({error,code,requestId},{status,headers:{...headers,...extra}});
  try {
    const limited = await withDeadline(consumeRequestRateLimit(request, { namespace: 'store-chatbot-api', limit: 120, windowMs: 60_000 }),controller.signal);
    if (!limited.allowed) return fail(429,'RATE_LIMITED','Muitas consultas. Aguarde antes de tentar novamente.',{'Retry-After':String(limited.retryAfterSeconds)});
    const apiKey = readStoreChatbotApiKey(request);
    if (!isStoreChatbotApiKey(apiKey)) {
      return fail(401,'INVALID_API_KEY','Chave de API ausente ou inválida. Envie Authorization: Bearer SUA_CHAVE.');
    }

    const keyHash = hashStoreChatbotApiKey(apiKey);
    const { data: keyRecord, error: keyError } = await supabaseAdmin.from('store_chatbot_api_keys')
      .select('id,store_id,revoked_at')
      .eq('key_hash', keyHash)
      .is('revoked_at', null)
      .abortSignal(controller.signal)
      .maybeSingle();
    if (keyError) throw keyError;
    if (!keyRecord) return fail(401,'INVALID_API_KEY','Chave de API inválida ou revogada.');

    const access = await withDeadline(resolveCreatorWhatsAppAccess(keyRecord.store_id),controller.signal);
    if (!access.active) {
      return fail(403,'INTEGRATION_SUSPENDED','A integração desta loja está suspensa. O módulo precisa estar pago ou liberado pelo administrador.');
    }

    const query = parseCatalogQuery(new URL(request.url).searchParams);

    const [storeResult, productsResult, clubsResult, kitsResult] = await Promise.all([
      supabaseAdmin.from('stores')
        .select('id,nome_loja,slug,descricao,logo_url,banner_url,cor_primaria,whatsapp,instagram,tiktok,facebook,youtube,website,author_image_url,author_bio,welcome_message')
        .eq('id', keyRecord.store_id)
        .abortSignal(controller.signal)
        .maybeSingle(),
      readCatalog((start,end) => {
        let builder = supabaseAdmin.from('products').select(PRODUCT_FIELDS,{count:'exact'})
          .eq('store_id', keyRecord.store_id).eq('status', 'publicado').is('excluido_em', null);
        if(query.id) builder = builder.eq('id',query.id);
        return builder.order('created_at',{ascending:false}).order('id').range(start,end).abortSignal(controller.signal);
      }),
      !query.id && ['all','clubs'].includes(query.section) ? readCatalog((start,end) => supabaseAdmin.from('creator_clubs').select('id,name,slug,description,cover_url,monthly_price,club_type,created_at,updated_at',{count:'exact'})
        .eq('store_id', keyRecord.store_id).eq('status','published').order('created_at',{ascending:false}).order('id').range(start,end).abortSignal(controller.signal)) : Promise.resolve({data:[],error:null,coverage:{loaded:0,total:0,truncated:false}}),
      !query.id && ['all','kits'].includes(query.section) ? readCatalog((start,end) => supabaseAdmin.from('kits').select('id,titulo,descricao,capa_url,preco_kit,created_at,updated_at,kit_items(product_id)',{count:'exact'})
        .eq('store_id', keyRecord.store_id).eq('status','publicado').is('excluido_em',null).order('created_at',{ascending:false}).order('id').range(start,end).abortSignal(controller.signal)) : Promise.resolve({data:[],error:null,coverage:{loaded:0,total:0,truncated:false}}),
    ]);
    const firstError = storeResult.error || productsResult.error || clubsResult.error || kitsResult.error;
    if (firstError) throw firstError;
    if (!storeResult.data) return fail(404,'STORE_NOT_FOUND','Loja não encontrada.');
    if(query.id && !productsResult.data.length) return fail(404,'PRODUCT_NOT_FOUND','Material não encontrado no catálogo publicado desta loja.');

    const store = storeResult.data as Row & { id: string; slug: string; nome_loja: string };
    const rawProducts = (productsResult.data || []) as ProductRow[];
    const categoryIds = [...new Set(rawProducts.flatMap((product) => [product.category_id, ...(product.category_ids || [])]).filter((id): id is string => Boolean(id)))];
    const levelIds = [...new Set(rawProducts.flatMap((product) => [product.education_level_id, ...(product.education_level_ids || [])]).filter((id): id is string => Boolean(id)))];
    const clubIds = (clubsResult.data || []).map((club) => String(club.id));
    const [categoriesResult, levelsResult, clubMaterialsResult] = await Promise.all([
      readRelations(categoryIds,(ids,start,end) => supabaseAdmin.from('categories').select('id,nome',{count:'exact'}).in('id',ids).or(`store_id.is.null,store_id.eq.${keyRecord.store_id}`).order('id').range(start,end).abortSignal(controller.signal)),
      readRelations(levelIds,(ids,start,end) => supabaseAdmin.from('education_levels').select('id,nome',{count:'exact'}).in('id',ids).order('id').range(start,end).abortSignal(controller.signal)),
      readRelations(clubIds,(ids,start,end) => supabaseAdmin.from('creator_club_materials').select('club_id,product_id',{count:'exact'}).in('club_id',ids).order('club_id').order('product_id').range(start,end).abortSignal(controller.signal)),
    ]);
    const relationError = categoriesResult.error || levelsResult.error || clubMaterialsResult.error;
    if (relationError) throw relationError;

    const origin = 'https://www.educalizando.com.br';
    const categoryNames = new Map((categoriesResult.data || []).map((item) => [String(item.id),String(item.nome)]));
    const levelNames = new Map((levelsResult.data || []).map((item) => [String(item.id),String(item.nome)]));
    const products = rawProducts.map((product) => publicProduct(product, store.slug, origin, categoryNames, levelNames));
    const productById = new Map(products.map((product) => [product.id, product]));
    const clubMaterials = clubMaterialsResult.data || [];
    const clubs = (clubsResult.data || []).map((club) => ({
      id: club.id,
      name: club.name,
      slug: club.slug,
      description: club.description,
      coverUrl: absoluteUrl(club.cover_url,origin),
      monthlyPrice: catalogPrice(club.monthly_price),
      licenseType: club.club_type,
      publicUrl: `${origin}/clube/${encodeURIComponent(String(club.slug))}`,
      materials: clubMaterials.filter((item) => item.club_id === club.id).map((item) => productById.get(String(item.product_id))).filter((product) => Boolean(product) && (club.club_type !== 'plr' || product?.isPlr === true)),
      createdAt: club.created_at,
      updatedAt: club.updated_at || null,
    }));
    const kits = (kitsResult.data || []).map((kit) => ({
      id: kit.id,
      title: kit.titulo,
      description: kit.descricao,
      coverUrl: absoluteUrl(kit.capa_url,origin),
      price: catalogPrice(kit.preco_kit),
      publicUrl: `${origin}/loja/${encodeURIComponent(store.slug)}/kit/${encodeURIComponent(String(kit.id))}`,
      materials: (Array.isArray(kit.kit_items) ? kit.kit_items : []).map((item: { product_id: string }) => productById.get(item.product_id)).filter(Boolean),
      createdAt: kit.created_at,
      updatedAt: kit.updated_at || null,
    }));

    const enrich = <T extends {materials: unknown[]}>(item: T) => {
      const materials = item.materials.filter(Boolean) as Row[];
      return {...item,categories:materials.flatMap(p => p.categories as Row[]),educationLevels:materials.flatMap(p => p.educationLevels as Row[]),
        themes:[...new Set(materials.flatMap(p => p.themes as string[]))],commemorativeDates:materials.flatMap(p => p.commemorativeDates as Row[])};
    };
    const paidProducts = selectCatalogItems(products.filter(p => !p.isFree),query);
    const freeMaterials = selectCatalogItems(products.filter(p => p.isFree),query);
    const plrProducts = selectCatalogItems(products.filter(p => p.isPlr),query);
    const visibleClubs = selectCatalogItems(clubs.map(enrich),query);
    const visibleKits = selectCatalogItems(kits.map(enrich),query);
    const selected = {products:paidProducts,plrProducts,freeMaterials,clubs:visibleClubs,kits:visibleKits};
    const sectionLists: Record<string,string[]> = {all:Object.keys(selected),products:['products'],plr:['plrProducts'],free_materials:['freeMaterials'],clubs:['clubs'],kits:['kits'],facets:[],summary:[]};
    const lists: Record<string,unknown> = {}, pagination: Record<string,unknown> = {};
    for(const key of sectionLists[query.section]) {
      const result = paginateCatalog(selected[key as keyof typeof selected],query);
      lists[key] = result.data;
      if(query.paginated) pagination[key] = result.pagination;
    }
    const payload = {
      apiVersion: '1.1',
      requestId,
      catalogCoverage:{products:productsResult.coverage,clubs:clubsResult.coverage,kits:kitsResult.coverage},
      generatedAt: new Date().toISOString(),
      scope: { storeId: store.id, privateToStore: true, externalSearch: false, query: query.q || null },
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
      ...lists,
      ...(query.paginated ? {pagination} : {}),
      ...(query.includeFacets || ['facets','summary'].includes(query.section) ? {facets:catalogFacets(products),facetsScope:'published-products-loaded-before-filters'} : {}),
      ...(query.suggestions ? {suggestions:paidProducts.length+freeMaterials.length+plrProducts.length === 0 ? catalogSuggestions(products,query) : []} : {}),
    };

    const audit = await supabaseAdmin.from('store_chatbot_api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyRecord.id).abortSignal(controller.signal);
    if(audit.error) console.warn('[Store Chatbot Integration] Auditoria indisponível',requestId);
    return NextResponse.json(payload, { headers: { ...headers, 'X-RateLimit-Remaining': String(limited.remaining) } });
  } catch (error) {
    if(error instanceof CatalogQueryError) return fail(400,'INVALID_QUERY',error.message);
    console.error('[Store Chatbot Integration] Falha',requestId,controller.signal.aborted ? 'timeout' : 'upstream');
    return fail(503,controller.signal.aborted ? 'CATALOG_TIMEOUT' : 'CATALOG_UNAVAILABLE','Não foi possível consultar o catálogo desta loja agora.',{'Retry-After':'10'});
  } finally {
    clearTimeout(deadline);
  }
}
