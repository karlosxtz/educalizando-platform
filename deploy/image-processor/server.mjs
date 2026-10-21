import http from 'node:http';
import https from 'node:https';
import { lookup } from 'node:dns/promises';
import { isIP, BlockList } from 'node:net';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

sharp.concurrency(1); sharp.cache({ memory: 32, files: 0, items: 20 });
const MAX_BYTES=15*1024*1024;
const privateNetworks=new BlockList();
for(const [ip,prefix] of [['0.0.0.0',8],['10.0.0.0',8],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.168.0.0',16],['100.64.0.0',10],['224.0.0.0',4],['240.0.0.0',4]])privateNetworks.addSubnet(ip,prefix,'ipv4');
for(const [ip,prefix] of [['::',96],['fc00::',7],['fe80::',10],['ff00::',8]])privateNetworks.addSubnet(ip,prefix,'ipv6');
export function publicAddress(address){
  if(address.toLowerCase().startsWith('::ffff:'))return false;
  const family=isIP(address);return Boolean(family)&&!privateNetworks.check(address,family===4?'ipv4':'ipv6');
}
export function imageJob(value){
  if(!value||!['platform','woocommerce'].includes(value.kind)||!/^[-a-zA-Z0-9]{1,80}$/.test(value.scope)||!/^[-a-zA-Z0-9]{1,80}$/.test(value.product)||!Number.isInteger(value.index)||value.index<0||value.index>1000)throw Error('invalid_job');
  const url=new URL(value.source);
  if(url.protocol!=='https:'||url.username||url.password||url.port&&url.port!=='443'||value.source.length>8000)throw Error('invalid_source');
  return {...value,source:url.href};
}
export function authorized(secret,body,timestamp,signature,now=Date.now()){
  if(!secret||secret.length<32||!/^\d{13}$/.test(timestamp||'')||Math.abs(now-Number(timestamp))>90000||!/^[a-f0-9]{64}$/.test(signature||''))return false;
  const expected=createHmac('sha256',secret).update(timestamp+'.').update(body).digest();
  return timingSafeEqual(expected,Buffer.from(signature,'hex'));
}
export async function compact(source,width,target,animated=false){
  let output;
  for(const quality of [78,70,62]){
    output=await sharp(source,{limitInputPixels:40000000,animated}).rotate().resize({width,height:width,fit:'inside',withoutEnlargement:true}).webp({quality,effort:4}).toBuffer();
    if(output.length<=target)break;
  }
  return output;
}
async function remoteImage(input,redirects=0){
  if(redirects>3)throw Error('redirect_limit');
  const url=new URL(input);
  if(url.protocol!=='https:'||url.username||url.password||url.port&&url.port!=='443')throw Error('invalid_source');
  const records=await lookup(url.hostname,{all:true});
  if(!records.length||records.some(row=>!publicAddress(row.address)))throw Error('private_source');
  // Pin the validated address for the actual HTTPS connection, preserving TLS hostname checks.
  const result=await new Promise((resolve,reject)=>{
    const address=records[0];
    const request=https.get(url,{headers:{Accept:'image/*'},lookup:(_host,options,callback)=>options.all?callback(null,[address]):callback(null,address.address,address.family)},response=>{
      const status=response.statusCode||502;
      if(status>=300&&status<400){const location=response.headers.location;response.destroy();return resolve({location,status});}
      if(status!==200){response.destroy();return resolve({status});}
      if(String(response.headers['content-type']).startsWith('video/')){response.destroy();return reject(Error('video_media'));}
      if(!String(response.headers['content-type']).startsWith('image/')||Number(response.headers['content-length'])>MAX_BYTES){response.destroy();return reject(Error('invalid_image'));}
      const parts=[];let size=0;
      response.on('data',part=>{size+=part.length;if(size>MAX_BYTES)response.destroy(Error('image_too_large'));else parts.push(part);});
      response.on('end',()=>resolve({status,body:Buffer.concat(parts)}));response.on('error',reject);
    });
    const timeout=setTimeout(()=>request.destroy(Error('source_timeout')),30000);timeout.unref();request.on('close',()=>clearTimeout(timeout));request.on('error',reject);
  });
  if(result.location)return remoteImage(new URL(result.location,url).href,redirects+1);
  if(result.status!==200){const error=Error('source_http_error');error.sourceStatus=result.status;throw error;}
  return result.body;
}
async function downloadImage(source){
  try{return await remoteImage(source);}catch(error){
    const url=new URL(source);
    if(error.sourceStatus===400&&url.pathname.startsWith('/storage/v1/render/image/public/')){url.pathname=url.pathname.replace('/render/image/public/','/object/public/');url.search='';return remoteImage(url.href);}
    if(error.sourceStatus===400&&url.pathname==='/_next/image'){
      const original=new URL(url.searchParams.get('url')||'',url);
      if(original.origin===url.origin&&original.pathname!==url.pathname)return remoteImage(original.href);
    }
    throw error;
  }
}
export function createProcessor(env=process.env,dependencies={}){
  if(!env.IMAGE_PROCESSOR_SECRET||env.IMAGE_PROCESSOR_SECRET.length<32)throw Error('Configure IMAGE_PROCESSOR_SECRET');
  if(!dependencies.storage&&(!env.MINIO_ENDPOINT||!env.MINIO_ACCESS_KEY||!env.MINIO_SECRET_KEY))throw Error('Configure the MinIO connection privately');
  const storage=dependencies.storage||new S3Client({endpoint:env.MINIO_ENDPOINT,region:env.MINIO_REGION||'us-east-1',forcePathStyle:true,requestChecksumCalculation:'WHEN_REQUIRED',credentials:{accessKeyId:env.MINIO_ACCESS_KEY,secretAccessKey:env.MINIO_SECRET_KEY}});
  const bucket='public-images';let active=0;const completed=new Map();
  async function put(key,body){try{await storage.send(new PutObjectCommand({Bucket:bucket,Key:key,Body:body,ContentType:'image/webp',CacheControl:'public, max-age=31536000, immutable',IfNoneMatch:'*'}),{abortSignal:AbortSignal.timeout(30000)});}catch(error){if(error.$metadata?.httpStatusCode!==412)throw error;}}
  return http.createServer(async(request,response)=>{
    const reply=(status,value)=>{response.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});response.end(JSON.stringify(value));};
    if(request.method==='GET'&&request.url==='/health')return reply(200,{ok:true});
    if(request.method!=='POST'||request.url!=='/v1/import-image')return reply(404,{error:'not_found'});
    if(active>=2)return reply(503,{error:'processor_busy'});
    active++;
    try{
      const parts=[];let size=0;
      for await(const part of request){size+=part.length;if(size>12000)return reply(413,{error:'request_too_large'});parts.push(part);}
      const body=Buffer.concat(parts);
      if(!authorized(env.IMAGE_PROCESSOR_SECRET,body,request.headers['x-image-timestamp'],request.headers['x-image-signature']))return reply(401,{error:'unauthorized'});
      const job=imageJob(JSON.parse(body.toString()));
      const cacheKey=createHash('sha256').update(JSON.stringify(job)).digest('hex');
      let result=completed.get(cacheKey);
      if(!result){
        const source=await (dependencies.downloadImage||downloadImage)(job.source);
        const hash=createHash('sha256').update(source).digest('hex').slice(0,24);
        const base=`uploads/optimized/v1/${job.kind}/${job.scope}/${job.product}/${job.index}-${hash}`;
        const full=base+'/full.webp',thumb=base+'/thumb.webp';
        const metadata=await sharp(source,{limitInputPixels:40000000}).metadata();
        if(metadata.pages>100)throw Error('animated_image_too_large');
        const fullBytes=await compact(source,1200,120*1024,metadata.pages>1),thumbBytes=await compact(source,480,45*1024);
        await put(full,fullBytes);await put(thumb,thumbBytes);
        result={url:'https://arquivos.educalizando.com.br/public-images/'+full,thumbnail:'https://arquivos.educalizando.com.br/public-images/'+thumb,size:fullBytes.length};
        if(completed.size>=5000)completed.delete(completed.keys().next().value);
        completed.set(cacheKey,result);
      }
      reply(200,result);
    }catch(error){reply(error.message==='video_media'?415:error.sourceStatus?422:503,{error:error.message==='video_media'?'video_media':'image_processing_failed',...(error.sourceStatus?{sourceStatus:error.sourceStatus}:{})});}
    finally{active--;}
  });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const server=createProcessor();server.requestTimeout=10000;server.headersTimeout=10000;server.listen(8080,'0.0.0.0');}
