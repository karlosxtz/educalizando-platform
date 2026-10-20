import { db,teachingContext,teachingJson as json,teachingFailure,teachingBody,assertDb } from '@/lib/teaching-api';
import { TOOL_UUID,textField } from '@/lib/teaching-tools';
export async function GET(request:Request){try{
  const ctx=await teachingContext(request,true);if(ctx.response)return ctx.response;
  const page=Math.max(1,Math.min(10000,Number.parseInt(new URL(request.url).searchParams.get('page')||'1',10)||1));
  const {data,error,count}=await db.from('material_questions').select('id,question,answer,hidden,created_at,product:products!inner(id,titulo,store_id)',{count:'exact'}).eq('product.store_id',ctx.store!.id).order('created_at',{ascending:false}).range((page-1)*30,page*30-1);assertDb(error);return json({questions:data||[],total:count||0,page});
}catch(e){return teachingFailure(e);}}
export async function PUT(request:Request){try{
  const ctx=await teachingContext(request,true);if(ctx.response)return ctx.response;const body=await teachingBody(request),id=String(body.id||'');if(!TOOL_UUID.test(id))return json({error:'Pergunta inválida.'},400);
  const own=await db.from('material_questions').select('id,product:products!inner(store_id)').eq('id',id).eq('product.store_id',ctx.store!.id).maybeSingle();assertDb(own.error);if(!own.data)return json({error:'Pergunta não encontrada na sua loja.'},404);
  if(typeof body.hidden!=='boolean')return json({error:'Escolha a visibilidade.'},400);
  const answer=body.answer===null?null:textField(body.answer,3,2000,'a resposta');
  const result=await db.from('material_questions').update({answer,hidden:body.hidden,answered_at:answer?new Date().toISOString():null}).eq('id',id);assertDb(result.error);return json({ok:true});
}catch(e){return teachingFailure(e);}}
