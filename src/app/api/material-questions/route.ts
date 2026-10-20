import { db,teachingContext,teachingJson as json,teachingFailure,teachingBody,assertDb } from '@/lib/teaching-api';
import { TOOL_UUID,textField } from '@/lib/teaching-tools';
export async function GET(request:Request){try{
  const id=new URL(request.url).searchParams.get('product')||'';if(!TOOL_UUID.test(id))return json({error:'Material inválido.'},400);
  const product=await db.from('products').select('id').eq('id',id).eq('status','publicado').is('excluido_em',null).maybeSingle();assertDb(product.error);if(!product.data)return json({questions:[]});
  const {data,error}=await db.from('material_questions').select('id,question,answer,answered_at').eq('product_id',id).eq('hidden',false).not('answer','is',null).order('answered_at',{ascending:false}).limit(30);assertDb(error);return json({questions:data||[]});
}catch(e){return teachingFailure(e);}}
export async function POST(request:Request){try{
  const ctx=await teachingContext(request);if(ctx.response)return ctx.response;
  const body=await teachingBody(request),id=String(body.product_id||''),question=textField(body.question,10,1000,'a pergunta');if(!TOOL_UUID.test(id))return json({error:'Material inválido.'},400);
  const p=await db.from('products').select('id,store:stores!products_store_id_fkey(creator_id)').eq('id',id).eq('status','publicado').is('excluido_em',null).maybeSingle();assertDb(p.error);if(!p.data)return json({error:'Material indisponível.'},404);
  const store=Array.isArray(p.data.store)?p.data.store[0]:p.data.store;if(store?.creator_id===ctx.user.id)return json({error:'Responda às dúvidas dos compradores pelo painel da sua loja.'},400);
  const count=await db.from('material_questions').select('id',{count:'exact',head:true}).eq('user_id',ctx.user.id).gte('created_at',new Date(Date.now()-86400000).toISOString());assertDb(count.error);if((count.count||0)>=10)return json({error:'Você já enviou 10 perguntas hoje. Aguarde novas respostas.'},429);
  const result=await db.from('material_questions').insert({product_id:id,user_id:ctx.user.id,question});assertDb(result.error);return json({ok:true},201);
}catch(e){return teachingFailure(e);}}
