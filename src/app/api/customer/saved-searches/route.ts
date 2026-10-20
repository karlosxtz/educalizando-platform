import { db,teachingContext,teachingJson as json,teachingFailure,teachingBody,assertDb } from '@/lib/teaching-api';
import { TOOL_UUID,textField,savedFilters } from '@/lib/teaching-tools';
import { searchProducts } from '@/lib/search-service';
export async function GET(request:Request){try{
  const ctx=await teachingContext(request);if(ctx.response)return ctx.response;
  const id=new URL(request.url).searchParams.get('check');
  if(id){
    if(!TOOL_UUID.test(id))return json({error:'Busca inválida.'},400);
    const row=await db.from('material_saved_searches').select('id,filters,created_at,notifications_enabled').eq('id',id).eq('user_id',ctx.user.id).maybeSingle();assertDb(row.error);if(!row.data)return json({error:'Busca não encontrada.'},404);if(!row.data.notifications_enabled)return json({error:'Ative os avisos desta busca para consultar novidades.'},400);
    // Bounded live check; only public display fields are returned, never delivery URLs.
    const saved=row.data;
    const result=await searchProducts({...savedFilters(saved.filters),sort:'recentes',page:1});
    const products=result.data.filter(p=>new Date(p.created_at)>new Date(saved.created_at)).map(p=>({id:p.id,titulo:p.titulo,slug:p.slug}));
    return json({products,checkedAt:new Date().toISOString(),partial:result.count>24});
  }
  const {data,error}=await db.from('material_saved_searches').select('id,name,filters,notifications_enabled,created_at').eq('user_id',ctx.user.id).order('created_at',{ascending:false}).limit(20);assertDb(error);return json({searches:data||[]});
}catch(e){return teachingFailure(e);}}
export async function POST(request:Request){try{const ctx=await teachingContext(request);if(ctx.response)return ctx.response;const body=await teachingBody(request),filters=savedFilters(body.filters),name=textField(body.name,3,100,'o nome da busca');
  if(typeof body.notifications_enabled!=='boolean')return json({error:'Confirme sua preferência de avisos.'},400);
  const count=await db.from('material_saved_searches').select('id',{count:'exact',head:true}).eq('user_id',ctx.user.id);assertDb(count.error);if((count.count||0)>=20)return json({error:'Limite de 20 buscas salvas.'},400);
  const result=await db.from('material_saved_searches').insert({user_id:ctx.user.id,name,filters,notifications_enabled:body.notifications_enabled});assertDb(result.error);return json({ok:true},201);
}catch(e){return teachingFailure(e);}}
export async function PUT(request:Request){try{const ctx=await teachingContext(request);if(ctx.response)return ctx.response;const body=await teachingBody(request);if(typeof body.id!=='string'||!TOOL_UUID.test(body.id)||typeof body.notifications_enabled!=='boolean')return json({error:'Preferência inválida.'},400);const result=await db.from('material_saved_searches').update({notifications_enabled:body.notifications_enabled}).eq('id',body.id).eq('user_id',ctx.user.id);assertDb(result.error);return json({ok:true});}catch(e){return teachingFailure(e);}}
export async function DELETE(request:Request){try{const ctx=await teachingContext(request);if(ctx.response)return ctx.response;const id=new URL(request.url).searchParams.get('id')||'';if(!TOOL_UUID.test(id))return json({error:'Busca inválida.'},400);const result=await db.from('material_saved_searches').delete().eq('id',id).eq('user_id',ctx.user.id);assertDb(result.error);return json({ok:true});}catch(e){return teachingFailure(e);}}
