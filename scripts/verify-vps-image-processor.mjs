import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import sharp from 'sharp';
import { authorized,publicAddress,imageJob,compact,createProcessor } from '../deploy/image-processor/server.mjs';
const secret='local-test-secret-'.repeat(3),timestamp=String(Date.now()),body=Buffer.from('{"test":true}');
const signature=createHmac('sha256',secret).update(timestamp+'.').update(body).digest('hex');
assert(authorized(secret,body,timestamp,signature));
assert(!authorized(secret,Buffer.from('changed'),timestamp,signature));
assert(!authorized(secret,body,timestamp,signature,Date.now()+100000));
for(const ip of ['127.0.0.1','10.0.0.2','169.254.169.254','172.20.0.1','192.168.1.1','100.64.0.1','::1','::ffff:127.0.0.1','fc00::1','fe80::1'])assert(!publicAddress(ip),ip);
assert(publicAddress('8.8.8.8'));assert(publicAddress('2606:4700:4700::1111'));
const job={kind:'platform',scope:'store-1',product:'product-1',index:0,source:'https://example.com/public.png'};
assert.equal(imageJob(job).scope,'store-1');
for(const value of [{...job,scope:'../other-store'},{...job,index:-1},{...job,kind:'private-materials'},{...job,source:'http://example.com/a.png'},{...job,source:'https://user:secret@example.com/a.png'}])assert.throws(()=>imageJob(value));
const source=await sharp({create:{width:2400,height:3200,channels:3,background:'#2070b0'}}).png().toBuffer();
const full=await compact(source,1200,120*1024),thumb=await compact(source,480,45*1024);
assert((await sharp(full).metadata()).width<=1200);assert((await sharp(thumb).metadata()).height<=480);
assert(full.length<source.length);assert.equal((await sharp(full).metadata()).format,'webp');
const pixels=Buffer.alloc(20*40*3);pixels.fill(255,20*20*3);
const animation=await sharp(pixels,{raw:{width:20,height:40,pageHeight:20,channels:3}}).gif({delay:[100,100],loop:0}).toBuffer();
assert.equal((await sharp(await compact(animation,1200,120*1024,true)).metadata()).pages,2,'Animated images retain their frames');
const stored=new Map();let downloads=0,puts=0;
const server=createProcessor({IMAGE_PROCESSOR_SECRET:secret},{storage:{send:async command=>{
  const asset=command.input;puts++;assert.equal(asset.Bucket,'public-images');assert.equal(asset.IfNoneMatch,'*');assert.equal(asset.ContentType,'image/webp');
  if(stored.has(asset.Key)){const error=Error('already exists');error.$metadata={httpStatusCode:412};throw error;}
  stored.set(asset.Key,asset.Body);
}},downloadImage:async()=>{downloads++;return source;}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try{
  const origin='http://127.0.0.1:'+server.address().port;
  assert.equal((await fetch(origin+'/health')).status,200);
  const response=await fetch(origin+'/v1/import-image',{method:'POST',body:JSON.stringify(job)});
  assert.equal(response.status,401);assert(!(await response.text()).includes(secret));
  assert.equal(downloads,0);assert.equal(stored.size,0);
  async function processJob(value){const body=JSON.stringify(value),time=String(Date.now()),signature=createHmac('sha256',secret).update(time+'.'+body).digest('hex');const response=await fetch(origin+'/v1/import-image',{method:'POST',body,headers:{'x-image-timestamp':time,'x-image-signature':signature}});assert.equal(response.status,200);return response.json();}
  const result=await processJob(job);
  assert.equal(stored.size,2);assert(result.url.includes('/platform/store-1/product-1/'));assert(result.thumbnail.endsWith('/thumb.webp'));
  assert.equal(result.size,[...stored.values()][0].length);
  assert.equal((await sharp([...stored.values()][1]).metadata()).height,480);
  await processJob(job);assert.equal(downloads,1);assert.equal(puts,2,'Retry reuses already processed images');
  const refreshed=await processJob({...job,source:job.source+'?refreshed=1'});assert.equal(refreshed.url,result.url);assert.equal(stored.size,2,'New source signature cannot duplicate identical image contents');
}finally{await new Promise(resolve=>server.close(resolve));}
console.log('PASS VPS processor: real WebP compression, sizing, HMAC integrity/expiry, private-network rejection, scoped paths and protected HTTP endpoint.');
