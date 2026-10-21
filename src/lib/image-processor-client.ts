import 'server-only';
import { createHmac } from 'node:crypto';
import { RemoteImageHttpError } from './platform-image-recovery';
export class RemoteVideoMedia extends Error {}

export function imageProcessorConfigured() {
  return Boolean(process.env.IMAGE_PROCESSOR_URL && process.env.IMAGE_PROCESSOR_SECRET);
}

/** Send metadata only. The VPS downloads, compresses and uploads directly to MinIO. */
export async function processRemoteImage(source:string,kind:'platform'|'woocommerce',scope:string,product:string,index:number):Promise<{url:string;size:number}> {
  const endpoint=process.env.IMAGE_PROCESSOR_URL;
  const secret=process.env.IMAGE_PROCESSOR_SECRET;
  if(!endpoint||!secret||secret.length<32)throw Error('Ative o compactador de imagens na VPS antes de importar.');
  const url=new URL(endpoint);
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw Error('Não foi possível configurar o compactador de imagens.');
  const body=JSON.stringify({source,kind,scope,product,index}),timestamp=String(Date.now());
  const signature=createHmac('sha256',secret).update(timestamp+'.'+body).digest('hex');
  const response=await fetch(new URL('/v1/import-image',url),{method:'POST',body,headers:{'Content-Type':'application/json','X-Image-Timestamp':timestamp,'X-Image-Signature':signature},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(80000)});
  if(Number(response.headers.get('content-length'))>8192)throw Error('Não foi possível validar o retorno do compactador de imagens.');
  const text=await response.text();if(text.length>8192)throw Error('Não foi possível validar o retorno do compactador de imagens.');
  const result=JSON.parse(text);
  if(!response.ok){if(response.status===415&&result.error==='video_media')throw new RemoteVideoMedia();if(response.status===422&&[400,404,410].includes(result.sourceStatus))throw new RemoteImageHttpError(result.sourceStatus);throw Error('Não foi possível compactar a imagem na VPS. Retome para tentar novamente.');}
  const expected=`https://arquivos.educalizando.com.br/public-images/uploads/optimized/v1/${kind}/${scope}/${product}/${index}-`;
  if(typeof result.url!=='string'||!result.url.startsWith(expected)||!/^[a-f0-9]{24}\/full\.webp$/.test(result.url.slice(expected.length))||result.thumbnail!==result.url.replace('/full.webp','/thumb.webp')||!Number.isSafeInteger(result.size)||result.size<=0||result.size>15*1024*1024)throw Error('Não foi possível validar a imagem compactada desta loja.');
  return {url:result.url,size:result.size};
}
