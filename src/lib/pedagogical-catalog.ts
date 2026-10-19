import 'server-only';
import { supabase } from './supabase';
import type { Product,Store,Category,EducationLevel } from './types';
// Explicit public fields only: no delivery URLs, tokens or buyer information.
export const PEDAGOGICAL_FIELDS='id,store_id,titulo,slug,descricao,tipo,preco,preco_original,is_free,is_plr,preco_plr,has_plr_delivery,capa_url,status,created_at,page_count,age_range,format_details,color_mode,preview_url,category_id,category_ids,education_level_id,education_level_ids,tags,presentation_video_url,instagram_video_url,video_as_cover,store:stores!products_store_id_fkey(id,nome_loja,slug,logo_url)';
export async function readPedagogicalCatalog() {
  const [categoryResult,levelResult]=await Promise.all([supabase.from('categories').select('id,nome,slug'),supabase.from('education_levels').select('id,nome,slug')]);
  if(categoryResult.error||levelResult.error)throw new Error('Não foi possível consultar os critérios pedagógicos.');
  const categories=categoryResult.data||[],levels=levelResult.data||[];
  const products:(Product&{store?:Store;pedagogicalLabels?:string[]})[]=[];
  for(let offset=0;;offset+=500){const {data,error}=await supabase.from('products').select(PEDAGOGICAL_FIELDS).eq('status','publicado').is('excluido_em',null).order('id').range(offset,offset+499);if(error)throw new Error('Catálogo indisponível. Tente novamente em instantes.');for(const raw of data||[]){const p=raw as unknown as Product&{store?:Store};products.push({...p,arquivo_url:null,category:categories.find(c=>c.id===p.category_id) as Category||null,education_level:levels.find(l=>l.id===p.education_level_id) as EducationLevel||null,pedagogicalLabels:[...categories.filter(c=>p.category_ids?.includes(c.id)).map(c=>c.nome),...levels.filter(l=>p.education_level_ids?.includes(l.id)).map(l=>l.nome)]});}if((data?.length||0)<500)break;}
  return products;
}
