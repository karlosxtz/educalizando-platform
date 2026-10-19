import 'server-only';
import { createHash } from 'node:crypto';
import { parseSaberExport, SABER_EXPORT_URL, saberNextUrl } from './saber-export-contract';
export function saberToken(input:unknown) {
  if(typeof input!=='string' || !/^sbr_live_[a-f0-9]{32,128}$/i.test(input.trim()))throw new Error('Cole uma chave de exportação válida de um marketplace compatível.');
  return input.trim();
}
export const saberFingerprint=(token:string)=>createHash('sha256').update(token).digest('hex');
export function saberImportId(storeId:string,owner:string,id:string) {
  const hash=createHash('sha256').update(JSON.stringify(['educalizando:saber:v1',storeId,owner,id])).digest('hex');
  return `${hash.slice(0,8)}-${hash.slice(8,12)}-5${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`;
}
async function exportResponse(token:string,endpoint:string) {
  const key=saberToken(token),url=new URL(endpoint);
  const stage=url.search?'a continuação do catálogo':'a primeira página';
  for(let attempt=0;attempt<3;attempt++){
    let response:Response;
    try {response=await fetch(endpoint,{redirect:'manual',signal:AbortSignal.timeout(15000),headers:{Accept:'application/json',Authorization:'Bearer '+key},cache:'no-store'});}
    catch {
      if(attempt<2){await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));continue;}
      throw new Error(`A exportação não respondeu ao consultar ${stage}, mesmo após três tentativas. O progresso foi preservado.`);
    }
    if(response.ok && response.body)return response;
    if(response.ok)throw new Error(`A exportação respondeu sem conteúdo ao consultar ${stage}. O progresso foi preservado.`);
    // Never consume or persist error bodies: an upstream error can echo credentials.
    await response.body?.cancel().catch(()=>{});
    if([401,403].includes(response.status))throw new Error(`A exportação recusou a autorização (HTTP ${response.status}) ao consultar ${stage}. Confira se a chave continua ativa.`);
    if(response.status>=300 && response.status<400)throw new Error('A exportação redirecionou para outro endereço. A chave não foi encaminhada.');
    const rawRetry=response.headers.get('retry-after') || '';
    const retryAfter=/^\d+$/.test(rawRetry)?Number(rawRetry):rawRetry && Number.isFinite(Date.parse(rawRetry))?Math.max(0,(Date.parse(rawRetry)-Date.now())/1000):0;
    if([408,425,429,500,502,503,504].includes(response.status) && attempt<2 && retryAfter<=2){
      await new Promise(resolve=>setTimeout(resolve,Math.max(500*(attempt+1),Math.max(0,retryAfter || 0)*1000)));continue;
    }
    const parameters=[...url.searchParams.keys()].join(', ');
    const reason=response.status===429?'A origem limitou as consultas; aguarde antes de continuar.':[400,404,405,422].includes(response.status)?'A origem recusou a consulta; a paginação precisa ser conferida.':'A origem apresentou uma falha ao responder.';
    throw new Error(`A exportação retornou HTTP ${response.status} ao consultar ${stage}${parameters?' (parâmetros: '+parameters+')':''}. ${reason}`);
  }
  throw new Error('A exportação não respondeu. O progresso foi preservado.');
}
export async function readSaberExport(token:string,url=SABER_EXPORT_URL) {
  const endpoint=saberNextUrl(url);
  const response=await exportResponse(token,endpoint);
  if(!(response.headers.get('content-type') || '').includes('application/json'))throw new Error('O endereço de exportação não retornou JSON. A integração precisa ser validada.');
  const max=20*1024*1024;
  if(Number(response.headers.get('content-length'))>max)throw new Error('A página exportada é muito grande. A API precisa fornecer paginação.');
  const reader=response.body!.getReader();let size=0;const chunks:Uint8Array[]=[];
  try {while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>max)throw new Error('A página exportada é muito grande. A API precisa fornecer paginação.');chunks.push(value);}}finally{await reader.cancel();}
  const result=new Uint8Array(size);let position=0;for(const chunk of chunks){result.set(chunk,position);position+=chunk.length;}
  const decoded=new TextDecoder().decode(result);
  if(decoded.includes(token))throw new Error('A API devolveu a chave na resposta. A importação foi bloqueada para proteger sua credencial.');
  let payload:unknown;try{payload=JSON.parse(decoded);}catch{throw new Error('A API retornou JSON inválido. Nenhum dado desta página foi importado.');}
  return parseSaberExport(payload,endpoint);
}
