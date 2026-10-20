import { db,teachingContext,teachingJson as json,teachingFailure,teachingBody,assertDb } from '@/lib/teaching-api';
import { planInput,TOOL_UUID } from '@/lib/teaching-tools';
const fields='id,title,class_name,subject,lesson_date,notes,materials,updated_at';
export async function GET(request:Request){try{const ctx=await teachingContext(request);if(ctx.response)return ctx.response;const {data,error}=await db.from('teaching_plans').select(fields).eq('user_id',ctx.user.id).order('updated_at',{ascending:false}).limit(100);assertDb(error);return json({plans:data||[]});}catch(e){return teachingFailure(e);}}
async function save(request:Request,editing:boolean){try{
  const ctx=await teachingContext(request);if(ctx.response)return ctx.response;
  const body=await teachingBody(request),input=planInput(body),id=editing?String(body.id):crypto.randomUUID();
  if(!TOOL_UUID.test(id))return json({error:'Planejamento inválido.'},400);
  if(!editing){const count=await db.from('teaching_plans').select('id',{count:'exact',head:true}).eq('user_id',ctx.user.id);assertDb(count.error);if((count.count||0)>=100)return json({error:'Limite de 100 planejamentos. Exclua um planejamento antigo para criar outro.'},400);}
  // User-authored notes and public identifiers only. Never resolves private delivery files.
  const result=editing?await db.from('teaching_plans').update({...input,updated_at:new Date().toISOString()}).eq('id',id).eq('user_id',ctx.user.id).select(fields).maybeSingle():await db.from('teaching_plans').insert({...input,id,user_id:ctx.user.id}).select(fields).single();
  assertDb(result.error);if(!result.data)return json({error:'Planejamento não encontrado.'},404);return json({plan:result.data},editing?200:201);
}catch(e){return teachingFailure(e);}}
export const POST=(r:Request)=>save(r,false);
export const PUT=(r:Request)=>save(r,true);
export async function DELETE(request:Request){try{const ctx=await teachingContext(request);if(ctx.response)return ctx.response;const id=new URL(request.url).searchParams.get('id')||'';if(!TOOL_UUID.test(id))return json({error:'Planejamento inválido.'},400);const result=await db.from('teaching_plans').delete().eq('id',id).eq('user_id',ctx.user.id);assertDb(result.error);return json({ok:true});}catch(e){return teachingFailure(e);}}
