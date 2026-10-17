import { SCHOOL_CALENDAR_EVENTS } from './school-calendar';
import { catalogItemMatches, normalizeCatalogSearch } from './store-chatbot-catalog-search';

export type CatalogItem = Record<string, unknown>;
export class CatalogQueryError extends Error {}
const sections = ['all', 'products', 'plr', 'free_materials', 'clubs', 'kits', 'facets', 'summary'] as const;
export type CatalogQuery = {
  q: string; section: typeof sections[number]; id: string | null;
  category: string; educationLevel: string; theme: string; date: string;
  type: string; license: string; free: boolean | null; month: number | null;
  minPrice: number | null; maxPrice: number | null;
  page: number; pageSize: number; paginated: boolean; compact: boolean;
  includeFacets: boolean; suggestions: boolean; sort: string;
};

export function parseCatalogQuery(params: URLSearchParams): CatalogQuery {
  const allowed = ['q','section','id','category','educationLevel','theme','date','type','license','free','month','minPrice','maxPrice','page','pageSize','view','includeFacets','suggestions','sort'];
  for (const key of params.keys()) {
    if (!allowed.includes(key)) throw new CatalogQueryError(`Parâmetro desconhecido: ${key}.`);
    if (params.getAll(key).length !== 1) throw new CatalogQueryError(`Parâmetro repetido: ${key}.`);
  }
  const str = (key: string, max = 120) => {
    const value = (params.get(key) || '').trim();
    if (value.length > max) throw new CatalogQueryError(`${key} excede ${max} caracteres.`);
    return value;
  };
  const numeric = (key: string, integer = false): number | null => {
    if (!params.has(key)) return null;
    const value = str(key);
    if (!/^\d+(?:\.\d{1,2})?$/.test(value)) throw new CatalogQueryError(`${key} deve ser um número não negativo.`);
    const n = Number(value);
    if (!Number.isFinite(n) || n > 1_000_000 || integer && !Number.isInteger(n)) throw new CatalogQueryError(`${key} inválido.`);
    return n;
  };
  const bool = (key: string): boolean | null => {
    if (!params.has(key)) return null;
    const value = str(key);
    if (!['true','false'].includes(value)) throw new CatalogQueryError(`${key} aceita true ou false.`);
    return value === 'true';
  };
  const section = str('section') || 'all';
  if (!(sections as readonly string[]).includes(section)) throw new CatalogQueryError('section inválida.');
  const id = str('id') || null;
  if (id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new CatalogQueryError('id deve ser um UUID válido.');
  if (id && ['clubs','kits','facets','summary'].includes(section)) throw new CatalogQueryError('id é usado para consultar um produto.');
  const page = numeric('page',true) ?? 1;
  const pageSize = numeric('pageSize',true) ?? 20;
  if (page < 1 || page > 10000 || pageSize < 1 || pageSize > 100) throw new CatalogQueryError('page deve estar entre 1 e 10000; pageSize entre 1 e 100.');
  const month = numeric('month',true);
  if (month !== null && (month < 1 || month > 12)) throw new CatalogQueryError('month deve estar entre 1 e 12.');
  const type = str('type');
  if (type && !['pdf','ebook','video','curso','simulado'].includes(type)) throw new CatalogQueryError('type inválido.');
  const license = str('license');
  if (license && !['standard','plr'].includes(license)) throw new CatalogQueryError('license aceita standard ou plr.');
  const sort = str('sort') || 'relevance';
  if (!['relevance','newest','price_asc','price_desc'].includes(sort)) throw new CatalogQueryError('sort inválido.');
  const view = str('view') || 'full';
  if (!['full','compact'].includes(view)) throw new CatalogQueryError('view aceita full ou compact.');
  const minPrice = numeric('minPrice'), maxPrice = numeric('maxPrice');
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) throw new CatalogQueryError('minPrice não pode ser maior que maxPrice.');
  return { q:normalizeCatalogSearch(str('q')), section:section as CatalogQuery['section'], id,
    category:str('category'), educationLevel:str('educationLevel'), theme:str('theme'), date:str('date'), type, license,
    free:bool('free'), month, minPrice, maxPrice, page, pageSize,
    paginated:params.has('page') || params.has('pageSize') || view === 'compact', compact:view === 'compact',
    includeFacets:bool('includeFacets') === true, suggestions:bool('suggestions') === true, sort };
}

export function commemorativeDates(themes: unknown) {
  return (Array.isArray(themes) ? themes : []).flatMap(tag => {
    const event = SCHOOL_CALENDAR_EVENTS.find(e => normalizeCatalogSearch(e.searchTerm) === normalizeCatalogSearch(tag));
    return event ? [{ slug:event.slug, name:event.name, day:event.day, month:event.month, kind:event.kind,
      calendarUrl:`https://www.educalizando.com.br/calendario/${event.slug}`, source:'school-calendar', dateKind:'recurring-reference', editorialStatus:event.editorialStatus }] : [];
  });
}

function values(item: CatalogItem, key: string): CatalogItem[] {
  return Array.isArray(item[key]) ? item[key] as CatalogItem[] : [];
}
export function catalogFiltersMatch(item: CatalogItem, query: CatalogQuery): boolean {
  const equal = (a: unknown, b: string) => normalizeCatalogSearch(a) === normalizeCatalogSearch(b);
  if (query.id && item.id !== query.id) return false;
  if (query.category && !values(item,'categories').some(c => equal(c.id,query.category) || equal(c.name,query.category))) return false;
  if (query.educationLevel && !values(item,'educationLevels').some(c => equal(c.id,query.educationLevel) || equal(c.name,query.educationLevel))) return false;
  if (query.theme && !(Array.isArray(item.themes) && item.themes.some(t => equal(t,query.theme)))) return false;
  const dates = values(item,'commemorativeDates');
  if (query.date && !dates.some(d => equal(d.slug,query.date) || equal(d.name,query.date))) return false;
  if (query.month !== null && !dates.some(d => d.month === query.month)) return false;
  if (query.type && item.type !== query.type) return false;
  if (query.license === 'plr' && item.isPlr !== true) return false;
  if (query.free !== null && Boolean(item.isFree) !== query.free) return false;
  const plr = item.plr as CatalogItem | null;
  const rawPrice = query.license === 'plr' ? plr?.price : item.price ?? item.monthlyPrice;
  const price = rawPrice == null ? NaN : Number(rawPrice);
  if ((query.minPrice !== null || query.maxPrice !== null) && (!Number.isFinite(price) || query.minPrice !== null && price < query.minPrice || query.maxPrice !== null && price > query.maxPrice)) return false;
  return true;
}

export function selectCatalogItems(items: CatalogItem[], query: CatalogQuery) {
  const filtered = items.filter(item => catalogFiltersMatch(item,query) && catalogItemMatches(item,query.q));
  const score = (item: CatalogItem) => {
    const title = normalizeCatalogSearch(item.title || item.name);
    return query.q && title === query.q ? 3 : query.q && title.includes(query.q) ? 2 : 1;
  };
  const price = (item: CatalogItem) => Number(query.license === 'plr' ? (item.plr as CatalogItem)?.price : item.price ?? item.monthlyPrice ?? 0);
  return filtered.sort((a,b) => query.sort === 'price_asc' ? price(a)-price(b) : query.sort === 'price_desc' ? price(b)-price(a) : query.sort === 'newest' ? String(b.createdAt).localeCompare(String(a.createdAt)) : score(b)-score(a));
}

export function catalogFacets(products: CatalogItem[]) {
  const grouped = (key: string) => {
    const groups = new Map<string,{id?:unknown;name:unknown;count:number}>();
    for(const product of products) {
      const seen = new Set<string>();
      const list: CatalogItem[] = key === 'themes' || key === 'tags' ? (Array.isArray(product[key]) ? (product[key] as unknown[]).map(name=>({name})) : []) : values(product,key);
      for(const value of list) {
        const id = String(value.id || normalizeCatalogSearch(value.name));
        if(!id || seen.has(id)) continue;
        seen.add(id); const previous = groups.get(id);
        groups.set(id,{...(value.id ? {id:value.id}:{}),name:value.name,count:(previous?.count || 0)+1});
      }
    }
    return [...groups.values()].sort((a,b)=>String(a.name).localeCompare(String(b.name),'pt-BR'));
  };
  return { categories:grouped('categories'), educationLevels:grouped('educationLevels'), themes:grouped('themes'), tags:grouped('tags'),
    commemorativeDates:grouped('commemorativeDates').map(group=>({ ...commemorativeDates([group.name])[0],count:group.count })),
    types:[...new Set(products.map(p=>p.type))].filter(Boolean).map(type=>({type,count:products.filter(p=>p.type===type).length})) };
}

export function catalogSuggestions(products: CatalogItem[], query: CatalogQuery) {
  if (!query.q || !query.suggestions) return [];
  const terms = query.q.split(/\s+/).filter(t => t.length > 2);
  const candidates = selectCatalogItems(products, { ...query, q: '', id: null });
  return candidates.map(item => ({ item, score: terms.filter(term => catalogItemMatches(item, term)).length }))
    .filter(entry => entry.score > 0).sort((a,b) => b.score-a.score).slice(0,3)
    .map(({item}) => ({ id:item.id, title:item.title, publicUrl:item.publicUrl, reason:'partial-text-match' }));
}

export function paginateCatalog(items: CatalogItem[], query: CatalogQuery) {
  const start = (query.page-1)*query.pageSize;
  const data = query.paginated ? items.slice(start,start+query.pageSize) : items;
  return { data: query.compact ? data.map(item=>{
    const {id,title,name,slug,type,price,originalPrice,isFree,isPlr,plr,coverUrl,publicUrl,categories,educationLevels,themes,tags,commemorativeDates,pageCount,ageRange,formatDetails,colorMode,monthlyPrice,licenseType,materials} = item;
    return {id,title,name,slug,type,price,originalPrice,isFree,isPlr,plr:plr ? {price:(plr as CatalogItem).price,publicUrl:(plr as CatalogItem).publicUrl}:null,coverUrl,publicUrl,categories,educationLevels,themes,tags,commemorativeDates,pageCount,ageRange,formatDetails,colorMode,monthlyPrice,licenseType,...(Array.isArray(materials)?{materialCount:materials.length}:{})};
  }) : data,
    pagination:{page:query.page,pageSize:query.paginated?query.pageSize:items.length,total:items.length,totalPages:query.paginated?Math.ceil(items.length/query.pageSize):(items.length?1:0),hasMore:query.paginated&&start+query.pageSize<items.length} };
}
