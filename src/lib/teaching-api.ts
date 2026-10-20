import 'server-only';
import { getRequestUser } from './api-auth';
import { supabaseAdmin as db } from './supabase';
import { consumeRequestRateLimit } from './request-rate-limit';
export { db };
export const teachingJson=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store',Vary:'Authorization, Cookie'}});
export function teachingFailure(error:unknown){return teachingJson({error:error instanceof Error?error.message:'Não foi possível carregar. Tente novamente.'},503);}
export function assertDb(error:{code?:string}|null){if(error)throw new Error(['42P01','42703','PGRST205','PGRST204','PGRST202'].includes(error.code||'')?'Esta função aguarda a ativação da atualização de dados.':'Não foi possível salvar ou consultar agora. Tente novamente.');}
export async function teachingContext(request:Request,creator=false){
  const user=await getRequestUser(request);if(!user)return {response:teachingJson({error:'Entre na sua conta para continuar.'},401)};
  const limit=await consumeRequestRateLimit(request,{namespace:'teaching-tools:'+user.id,limit:60,windowMs:60000});
  if(!limit.allowed)return {response:teachingJson({error:'Aguarde um minuto antes de tentar novamente.'},429)};
  if(!creator)return {user};
  const {data:store,error}=await db.from('stores').select('id,nome_loja,slug').eq('creator_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle();assertDb(error);
  if(!store)return {response:teachingJson({error:'Entre com a conta responsável pela loja.'},403)};
  return {user,store};
}
export async function teachingBody(request:Request){
  if(Number(request.headers.get('content-length'))>30000)throw new Error('Conteúdo muito grande.');
  const text=await request.text();if(text.length>30000)throw new Error('Conteúdo muito grande.');
  const body=JSON.parse(text);if(!body||typeof body!=='object'||Array.isArray(body))throw new Error('Conteúdo inválido.');
  return body as Record<string,unknown>;
}
