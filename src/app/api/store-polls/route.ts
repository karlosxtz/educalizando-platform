import { db,teachingContext,teachingJson as json,teachingFailure,teachingBody,assertDb } from '@/lib/teaching-api';
import { TOOL_UUID } from '@/lib/teaching-tools';
export async function GET(request:Request){try{
  const id=new URL(request.url).searchParams.get('store')||'';if(!TOOL_UUID.test(id))return json({error:'Loja inválida.'},400);
  const result=await db.from('creator_polls').select('id,question,options,closes_at,closed').eq('store_id',id).order('created_at',{ascending:false}).limit(5);assertDb(result.error);
  const counts=await db.rpc('teaching_poll_results',{p_ids:(result.data||[]).map(p=>p.id)});assertDb(counts.error);return json({polls:result.data||[],counts:counts.data||[]});
}catch(e){return teachingFailure(e);}}
export async function POST(request:Request){try{
  const ctx=await teachingContext(request);if(ctx.response)return ctx.response;const body=await teachingBody(request);if(typeof body.id!=='string'||!TOOL_UUID.test(body.id)||!Number.isInteger(body.option))return json({error:'Voto inválido.'},400);
  const result=await db.rpc('teaching_poll_vote',{p_id:body.id,p_user:ctx.user.id,p_option:body.option});
  if(result.error)return json({error:result.error.code==='23505'?'Você já votou nesta enquete.':'Não foi possível votar. A enquete pode ter encerrado, ou esta conta é a autora.'},409);
  return json({ok:true});
}catch(e){return teachingFailure(e);}}
