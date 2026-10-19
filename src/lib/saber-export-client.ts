import 'server-only';
import { createHash } from 'node:crypto';
import { parseSaberExport, SABER_EXPORT_URL, saberNextUrl } from './saber-export-contract';
export function saberToken(input:unknown) {
  if(typeof input!=='string' || !/^sbr_live_[a-f0-9]{32,128}$/i.test(input.trim()))throw new Error('Cole uma chave de exportação válida da Saber Didático.');
  return input.trim();
}
export const saberFingerprint=(token:string)=>createHash('sha256').update(token).digest('hex');
export function saberImportId(storeId:string,owner:string,id:string) {
  const hash=createHash('sha256').update(JSON.stringify(['educalizando:saber:v1',storeId,owner,id])).digest('hex');
  return `${hash.slice(0,8)}-${hash.slice(8,12)}-5${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`;
}
export async function readSaberExport(token:string,url=SABER_EXPORT_URL) {
  const endpoint=saberNextUrl(url);
  const response=await fetch(endpoint,{redirect:'manual',signal:AbortSignal.timeout(25000),headers:{Accept:'application/json',Authorization:'Bearer '+saberToken(token)},cache:'no-store'});
  if([401,403].includes(response.status))throw new Error('A exportação não autorizou a consulta. Confira se a chave está ativa; o formato de autenticação da API também precisa ser validado.');
  if(response.status===429)throw new Error('A Saber limitou as consultas. Aguarde antes de retomar.');
  if(response.status>=300 && response.status<400)throw new Error('A exportação redirecionou para outro endereço. A chave não foi encaminhada.');
  if(!response.ok || !response.body)throw new Error('A exportação não respondeu com sucesso. Tente novamente mais tarde.');
  if(!(response.headers.get('content-type') || '').includes('application/json'))throw new Error('O endereço de exportação não retornou JSON. A integração precisa ser validada.');
  const max=20*1024*1024;
  if(Number(response.headers.get('content-length'))>max)throw new Error('A página exportada é muito grande. A API precisa fornecer paginação.');
  const reader=response.body.getReader();let size=0;const chunks:Uint8Array[]=[];
  try {while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>max)throw new Error('A página exportada é muito grande. A API precisa fornecer paginação.');chunks.push(value);}}finally{await reader.cancel();}
  const result=new Uint8Array(size);let position=0;for(const chunk of chunks){result.set(chunk,position);position+=chunk.length;}
  const decoded=new TextDecoder().decode(result);
  if(decoded.includes(token))throw new Error('A API devolveu a chave na resposta. A importação foi bloqueada para proteger sua credencial.');
  let payload:unknown;try{payload=JSON.parse(decoded);}catch{throw new Error('A API retornou JSON inválido. Nenhum dado desta página foi importado.');}
  return parseSaberExport(payload,endpoint);
}
