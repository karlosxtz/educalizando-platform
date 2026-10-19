import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isUuid } from '@/lib/conversion-events';
import { consumeRequestRateLimit,rateLimitResponse } from '@/lib/request-rate-limit';
import { materialHealthIssues,probePublicCover } from '@/lib/material-health';
import type { Product } from '@/lib/types';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store',Vary:'Authorization, Cookie'}});
export async function GET(request:Request) {
  const user=await getRequestUser(request);if(!user)return json({error:'Entre na conta do criador.'},401);
  const params=new URL(request.url).searchParams,storeId=params.get('storeId');if(!isUuid(storeId))return json({error:'Loja inválida.'},400);
  const {data:store}=await supabaseAdmin.from('stores').select('id').eq('id',storeId).eq('creator_id',user.id).maybeSingle();if(!store)return json({error:'Loja não encontrada.'},403);
  const rate=await consumeRequestRateLimit(request,{namespace:`material-health:${user.id}`,limit:30,windowMs:60000});if(!rate.allowed)return rateLimitResponse(rate);
  const offset=Math.min(100000,Math.max(0,Math.floor(Number(params.get('offset'))||0)));
  const {data,error,count}=await supabaseAdmin.from('products').select('id,store_id,titulo,status,capa_url,descricao,preview_url,category_id,category_ids,education_level_id,education_level_ids,age_range,format_details,images:product_images(id,url)',{count:'exact'}).eq('store_id',store.id).is('excluido_em',null).order('id').range(offset,offset+9);
  if(error)return json({error:'Não foi possível consultar seus materiais.'},503);
  const products=(data||[]) as unknown as Product[];const results=new Array(products.length);let cursor=0;
  await Promise.all(Array.from({length:Math.min(3,products.length)},async()=>{while(cursor<products.length){const index=cursor++,p=products[index],cover=await probePublicCover(p.capa_url);results[index]={id:p.id,title:p.titulo,status:p.status,cover,issues:materialHealthIssues(p,cover)};}}));
  return json({results,total:count||0,next:offset+products.length,hasMore:offset+products.length<(count||0),checkedAt:new Date().toISOString()});
}
