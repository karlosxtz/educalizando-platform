const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),crypto=require('node:crypto');
function load(file,mocks={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:name=>Object.hasOwn(mocks,name)?mocks[name]:require(name),Response,Request,URL,Buffer,TextDecoder,Uint8Array,AbortSignal,Date,Set,Map,console,process,setTimeout,clearTimeout},{filename:file});return exports;}
const contract=load('src/lib/store-webhook-inbound-contract.ts');
const store='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',id='33333333-3333-4333-8333-333333333333';
const security=load('src/lib/store-webhook-security.ts',{'server-only':{},'./financial-configuration':{getConfiguredCryptoSecret:()=> 'a-strong-local-key-12345678901234567890'},'./remote-addresses':{resolveRemoteAddresses:async()=>[{address:'1.1.1.1'}]}});
let rows={},user={id:'creator'},calls=[],rpcResult={success:true,status:'processed',result:{}},rpcError=null,schemaError=false;
const db={from(table){let filters=[],inserted,changes,columns='*';const q={select(value){columns=value;return this;},eq(k,v){filters.push([k,v]);return this;},is(k,v){filters.push([k,v]);return this;},order(){return this;},limit(){return this;},insert(value){inserted=value;return this;},update(value){changes=value;return this;},result(single){
 if(schemaError&&table==='store_webhook_receivers')return{error:{code:'PGRST205'},data:null};
 if(inserted){rows[table].push({...inserted,id:crypto.randomUUID(),enabled:true,created_at:new Date().toISOString(),archived_at:null});}
 let values=(rows[table]||[]).filter(row=>filters.every(([k,v])=>k==='creator_id'?v==='creator':(row[k]??null)===v));
 if(changes)values.forEach(row=>Object.assign(row,changes));
 if(columns!=='*')values=values.map(row=>Object.fromEntries(columns.split(',').map(key=>[key,row[key]])));
 return{data:single?values[0]||null:values,error:null,count:values.length};},maybeSingle:async function(){return this.result(true);},single:async function(){return this.result(true);},then(resolve){return Promise.resolve(this.result(false)).then(resolve);}};return q;},rpc:async(name,args)=>{calls.push({name,args});return{data:rpcResult,error:rpcError};}};
const server=load('src/lib/store-webhook-inbound-server.ts',{'server-only':{},'./api-auth':{getRequestUser:async()=>user},'./supabase':{supabaseAdmin:db},'./store-webhook-security':security,'./store-webhook-inbound-contract':contract,'./public-links':{publicSiteOrigin:()=> 'https://www.educalizando.com.br'}});
const token=server.inboundToken();
const receiver={id,store_id:store,name:'Origin',enabled:true,permissions:['events.receive'],token_hash:server.inboundHash(token),token_encrypted:security.encryptWebhookSecret(token,store),archived_at:null,created_at:new Date().toISOString()};
const rate={consumeRequestRateLimit:async(_request,options)=>{assert.ok(options.limit<=120);return{allowed:true};},rateLimitResponse:()=>Response.json({}, {status:429})};
const route=load('src/app/api/webhooks/receive/[receiverId]/[token]/route.ts',{'@/lib/supabase':{supabaseAdmin:db},'@/lib/request-rate-limit':rate,'@/lib/store-webhook-inbound-contract':contract,'@/lib/store-webhook-inbound-server':server,'@/lib/store-webhook-security':{validateWebhookUrl:async value=>{if(value.includes('localhost'))throw new Error('private');return value;}},'next/cache':{revalidatePath(){}}});
const owner=load('src/app/api/creator/webhook-receivers/route.ts',{'@/lib/supabase':{supabaseAdmin:db},'@/lib/request-rate-limit':rate,'@/lib/store-webhook-security':security,'@/lib/store-webhook-inbound-contract':contract,'@/lib/store-webhook-inbound-server':server});
function reset(){rows={stores:[{id:store,nome_loja:'Store',creator_id:'creator'}],store_webhook_receivers:[{...receiver},{...receiver,id:other,store_id:other,token_encrypted:security.encryptWebhookSecret('private-other-store',other)}],store_webhook_received_events:[],store_external_contacts:[],store_external_orders:[]};calls=[];rpcError=null;rpcResult={success:true,status:'processed',result:{}};user={id:'creator'};schemaError=false;}
const ctx=(value=token)=>({params:Promise.resolve({receiverId:id,token:value})});
const incoming=(body,type='application/json')=>new Request(server.receiverUrl(receiver),{method:'POST',headers:{'Content-Type':type},body:typeof body==='string'?body:JSON.stringify(body)});
const management=(method,body,origin)=>new Request('https://www.educalizando.com.br/api/creator/webhook-receivers',{method,headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{})},...(body?{body:JSON.stringify(body)}:{})});
(async()=>{
 reset();assert.equal((await route.GET(new Request(server.receiverUrl(receiver)),ctx())).status,200);
 assert.equal((await route.GET(new Request(server.receiverUrl(receiver)),ctx('whin_'+'x'.repeat(43)))).status,401);assert.equal(calls.length,0);
 let response=await route.POST(incoming({hello:'world',store_id:other,password:'must-not-save',nested:{api_token:'secret'}}),ctx());assert.equal(response.status,200);
 assert.equal(calls[0].args.p_receiver,id);assert.equal(calls[0].args.p_data.password,'[protegido]');assert.equal(calls[0].args.p_data.nested.api_token,'[protegido]');assert.equal(calls[0].args.p_type,'custom.received');
 reset();response=await route.POST(incoming({id:'evt',type:'payment_intent.succeeded',api_version:'native',data:{object:{id:'payment'}}}),ctx());assert.equal(response.status,200);assert.equal(calls[0].args.p_type,'custom.received','Native platform envelopes are recorded, not rejected or guessed as actions');
 reset();response=await route.POST(incoming({type:'native.list',data:[{value:1}]}),ctx());assert.equal(response.status,200);assert.equal(calls[0].args.p_type,'custom.received');
 reset();assert.equal((await route.POST(incoming({id:'p',type:'product.upsert',data:{external_id:'p',title:'Test',store_id:other,status:'publicado'}}),ctx())).status,400);assert.equal(calls.length,0,'Protected product fields cannot be smuggled into automation');
 assert.equal((await route.POST(incoming('{}','text/plain'),ctx())).status,415);
 assert.equal((await route.POST(incoming('x'.repeat(65537)),ctx())).status,413);
 assert.equal((await route.POST(incoming('{bad'),ctx())).status,400);
 let deep={};for(let i=0;i<20;i++)deep={child:deep};assert.equal((await route.POST(incoming(deep),ctx())).status,400);
 assert.equal((await route.POST(incoming({id:'p',type:'product.upsert',data:{external_id:'p',title:'Test',cover_url:'https://localhost/image.png'}}),ctx())).status,400);
 reset();const event={id:'same-event',type:'customer.upsert',data:{external_id:'c',name:'Name',email:'USER@example.com'}};
 await route.POST(incoming(event),ctx());const hash=calls[0].args.p_hash;await route.POST(incoming({data:{email:'USER@example.com',name:'Name',external_id:'c'},type:'customer.upsert',id:'same-event'}),ctx());assert.equal(calls[1].args.p_hash,hash);assert.equal(calls[0].args.p_data.email,'user@example.com');assert.equal(calls[0].args.p_data.marketing_consent,false);
 rpcResult={success:false,error_code:'42501'};assert.equal((await route.POST(incoming(event),ctx())).status,403);
 rpcError={message:'must-not-leak '+token};response=await route.POST(incoming(event),ctx());assert.equal(response.status,503);assert.ok(!(await response.text()).includes(token));
 reset();response=await owner.GET(management('GET'));assert.equal(response.status,200);let body=await response.json();assert.equal(body.receivers.length,1);assert.ok(body.receivers[0].url.includes(token));assert.equal(body.receivers[0].token_hash,undefined);assert.equal(body.receivers[0].token_encrypted,undefined);
 user=null;assert.equal((await owner.GET(management('GET'))).status,401);user={id:'creator'};
 assert.equal((await owner.PATCH(management('PATCH',{id,enabled:false},'https://other.example'))).status,401);
 assert.equal((await owner.PATCH(management('PATCH',{id:other,enabled:false}))).status,404);assert.equal(rows.store_webhook_receivers[1].enabled,true);
 schemaError=true;response=await owner.GET(management('GET'));assert.equal(response.status,200);assert.equal((await response.json()).available,false);schemaError=false;
 response=await owner.POST(management('POST',{name:'New source',store_id:other,permissions:['events.receive']}));assert.equal(response.status,201);assert.equal(rows.store_webhook_receivers.at(-1).store_id,store);
 assert.equal((await owner.POST(management('POST',{name:'Bad permission',permissions:['events.receive','access.manage']}))).status,400);
 const amount=contract.normalizeInboundEvent({id:'money',type:'product.upsert',data:{external_id:'p',title:'Title',price:12.999}});assert.equal(amount.data.price,13);
 const sanitized=contract.redactInboundData({payment:{credit_card:{number:'4111111111111111',cvv:'123'},pan:'4111111111111111',access_key:'sensitive'},title:'Cards para leitura'});
 assert.equal(sanitized.payment.credit_card,'[protegido]');assert.equal(sanitized.payment.pan,'[protegido]');assert.equal(sanitized.payment.access_key,'[protegido]');assert.equal(sanitized.title,'Cards para leitura');
 console.log('PASS: inbound public/creator routes, token authentication, tenant scope, private fields, raw/native envelopes, redaction, bounded JSON, normalized actions, dedup hash and pre-migration compatibility.');
})().catch(error=>{console.error(error);process.exitCode=1;});
