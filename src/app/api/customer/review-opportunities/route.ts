import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store',Vary:'Authorization, Cookie'}});
export async function GET(request:Request){
  const user=await getRequestUser(request);if(!user)return json({error:'Entre na sua conta.'},401);
  const orders=await supabaseAdmin.from('orders').select('id,store_id,items:order_items(product_id)').eq('student_id',user.id).eq('status','paid').order('created_at',{ascending:false}).limit(100);
  if(orders.error)return json({error:'Não foi possível conferir suas compras.'},503);
  const ids=[...new Set((orders.data||[]).flatMap(order=>(order.items||[]).map(item=>item.product_id).filter((id):id is string=>Boolean(id))))].slice(0,100);
  if(!ids.length)return json({productIds:[]});
  const [reviews,products]=await Promise.all([
    supabaseAdmin.from('reviews').select('product_id').eq('student_id',user.id).in('product_id',ids),
    supabaseAdmin.from('products').select('id,store_id,stores!products_store_id_fkey!inner(creator_id)').in('id',ids).is('excluido_em',null),
  ]);
  if(reviews.error||products.error)return json({error:'Não foi possível conferir as avaliações.'},503);
  const reviewed=new Set((reviews.data||[]).map(row=>row.product_id));
  const productIds=(products.data||[]).filter(p=>{const store=Array.isArray(p.stores)?p.stores[0]:p.stores;return Boolean(store?.creator_id)&&store?.creator_id!==user.id&&!reviewed.has(p.id)&&(orders.data||[]).some(order=>order.store_id===p.store_id&&(order.items||[]).some(item=>item.product_id===p.id));}).map(p=>p.id);
  return json({productIds});
}
