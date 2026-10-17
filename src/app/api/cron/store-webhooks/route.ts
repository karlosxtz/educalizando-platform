import { timingSafeEqual } from 'node:crypto';
import { dispatchStoreWebhooks } from '@/lib/store-webhook-delivery';
export const dynamic='force-dynamic';
export async function GET(request:Request) {
  const expected=process.env.CRON_SECRET,provided=request.headers.get('authorization')||'';
  if(!expected||Buffer.byteLength(provided)!==Buffer.byteLength('Bearer '+expected)||!timingSafeEqual(Buffer.from(provided),Buffer.from('Bearer '+expected)))return Response.json({error:'Não autorizado.'},{status:401});
  try{return Response.json(await dispatchStoreWebhooks(),{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Fila temporariamente indisponível.'},{status:503});}
}
