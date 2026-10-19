import { articleProductReferences } from '@/lib/teaching-article';
import { isUuid } from '@/lib/conversion-events';
import { supabase } from '@/lib/supabase';
import type { BlogPost } from '@/lib/blog-service';
import type { Product,Store } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
export default async function BlogRelatedMaterials({post}:{post:BlogPost}) {
  const refs=articleProductReferences(post.content);if(!refs.length)return null;
  const ids=refs.filter(isUuid),slugs=refs.filter(ref=>!isUuid(ref));
  const filters=[...(ids.length?[`id.in.(${ids.join(',')})`]:[]),...(slugs.length?[`slug.in.(${slugs.join(',')})`]:[])];
  let query=supabase.from('products').select('id,store_id,titulo,slug,tipo,preco,is_free,is_plr,preco_plr,has_plr_delivery,capa_url,status,created_at,store:stores!products_store_id_fkey(id,nome_loja,slug,logo_url)').eq('status','publicado').is('excluido_em',null).or(filters.join(',')).limit(6);
  if(post.store_id)query=query.eq('store_id',post.store_id);
  const {data,error}=await query;if(error||!data?.length)return null;
  return <section className="mt-10 space-y-4 border-t border-slate-100 pt-7"><h2 className="text-2xl font-bold text-slate-950">Materiais citados neste artigo</h2><p className="text-sm leading-6 text-slate-600">Produtos públicos vinculados no texto. Confira conteúdo, licença e adequação à sua turma na página de cada material.</p><div className="grid items-start gap-4 sm:grid-cols-2">{data.map(raw=>{const product=raw as unknown as Product&{store?:Store};return <ProductCard key={product.id} product={product}/>;})}</div></section>;
}
