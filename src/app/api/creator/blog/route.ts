import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin as db } from '@/lib/supabase';
import { invalidatePublicCatalog } from '@/lib/public-cache-invalidation';
import { BLOG_UUID, creatorBlogInput, creatorBlogSlug } from '@/lib/creator-blog-input';
import { consumeRequestRateLimit, rateLimitResponse } from '@/lib/request-rate-limit';

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control':'private, no-store' } });
async function context(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return { response: json({error:'Entre na sua conta para continuar.'},401) };
  const {data:store,error} = await db.from('stores').select('id,nome_loja,slug').eq('creator_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle();
  if (error) return { response:json({error:'Não foi possível consultar sua loja.'},503) };
  if (!store) return { response:json({error:'Você precisa de uma loja para escrever no blog.'},403) };
  return {store};
}
function failure(code?: string) {
  const migration = ['42703','42P01','PGRST204','PGRST205'].includes(code || '');
  return json({error:migration ? 'O blog dos criadores está sendo preparado. A migration de autoria precisa estar aplicada.' : 'Não foi possível concluir. Seus textos foram mantidos no editor; tente novamente.'},503);
}
export async function GET(request: Request) {
  try {
    const ctx = await context(request); if (ctx.response) return ctx.response;
    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Math.min(10000, Number.parseInt(params.get('pagina') || '1',10) || 1));
    const id = params.get('id');
    let query = db.from('blog_posts').select('*',{count:'exact'}).eq('store_id',ctx.store.id);
    if(id) { if(!BLOG_UUID.test(id)) return json({error:'Artigo inválido.'},400); query=query.eq('id',id); }
    const {data,error,count} = await query.order('updated_at',{ascending:false}).range(id?0:(page-1)*20,id?0:page*20-1);
    if(error) return failure(error.code);
    return json({posts:data || [],total:count || 0,store:ctx.store,page});
  } catch { return failure(); }
}
async function save(request: Request, editing: boolean) {
  try {
    const ctx = await context(request); if(ctx.response) return ctx.response;
    const limit = await consumeRequestRateLimit(request,{namespace:'creator-blog:'+ctx.store.id,limit:30,windowMs:60000});
    if(!limit.allowed) return rateLimitResponse(limit);
    if(Number(request.headers.get('content-length'))>150000) return json({error:'Texto muito grande.'},413);
    const raw = await request.text(); if(raw.length>150000) return json({error:'Texto muito grande.'},413);
    let body: Record<string,unknown>;
    try { const parsed=JSON.parse(raw);if(!parsed || typeof parsed!=='object' || Array.isArray(parsed)) throw new Error();body=parsed; } catch { return json({error:'Envie um artigo válido.'},400); }
    let input;
    try { input=creatorBlogInput(body); } catch(error) { return json({error:error instanceof Error?error.message:'Confira o texto.'},400); }
    const now=new Date().toISOString();
    let previous: {published_at:string|null;slug:string} | null=null;
    const id = editing ? String(body.id || '') : crypto.randomUUID();
    if(!BLOG_UUID.test(id)) return json({error:'Artigo inválido.'},400);
    if(editing) {
      const {data,error}=await db.from('blog_posts').select('slug,published_at').eq('id',id).eq('store_id',ctx.store.id).maybeSingle();
      if(error) return failure(error.code);
      if(!data) return json({error:'Artigo não encontrado nesta loja.'},404);
      previous=data;
    }
    const post={...input,updated_at:now,published_at:input.status==='published'?(previous?.published_at || now):null};
    const query = editing ? db.from('blog_posts').update(post).eq('id',id).eq('store_id',ctx.store.id) : db.from('blog_posts').insert({...post,id,store_id:ctx.store.id,slug:creatorBlogSlug(input.title,id),created_at:now});
    const {data,error}=await query.select('*').maybeSingle();
    if(error) return failure(error.code);
    if(!data) return json({error:'Artigo não encontrado nesta loja.'},404);
    const cacheUpdated=await invalidatePublicCatalog();
    return json({post:data,cacheUpdated},editing?200:201);
  } catch { return failure(); }
}
export const POST=(request:Request)=>save(request,false);
export const PUT=(request:Request)=>save(request,true);
