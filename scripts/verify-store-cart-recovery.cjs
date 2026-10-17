const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
function load(file,mocks={},globals={}){
 const exports={};const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const req=name=>Object.hasOwn(mocks,name)?mocks[name]:name==='server-only'?{}:name.startsWith('.')?load(path.resolve(path.dirname(file),name+'.ts'),mocks,globals):require(name);
 vm.runInNewContext(output,{exports,require:req,Request,Response,URL,URLSearchParams,TextDecoder,AbortController,setTimeout,clearTimeout,Date,console,...globals});return exports;
}
const store='00000000-0000-0000-0000-000000000001',product='20000000-0000-0000-0000-000000000001',browser='10000000-0000-0000-0000-000000000001';
async function checks(){
 let calls=[],logged=true,ownerCart=null,rpcError=null,paymentState='pending';
 const record={id:product,titulo:'Material verdadeiro',preco:12,preco_plr:50,is_plr:true,tipo:'pdf'};
 const db={from(table){const chain={select(s){calls.push([table,'select',s]);return this;},eq(...args){calls.push([table,'eq',...args]);return this;},is(){return this;},not(){return this;},gte(){return this;},lte(){return this;},order(){return this;},limit(){return this;},in(){return this;},update(data){calls.push([table,'update',data]);return this;},async maybeSingle(){return {data:table==='stores'?{id:store,slug:'minha-loja',nome_loja:'Minha Loja'}:table==='orders'?{status:paymentState}:ownerCart,error:null};},then(resolve,reject){return Promise.resolve({data:table==='products'?[record]:table==='kits'?[{id:product,titulo:'Combo',preco_kit:30}]:[{id:'ok'}],error:null}).then(resolve,reject);}};return chain;},async rpc(name,args){calls.push([name,args]);return {data:{carts:[],total:0},error:rpcError};}};
 const server=load('src/lib/store-cart-server.ts',{'./supabase':{supabaseAdmin:db},'./api-auth':{getRequestUser:async()=>logged?{id:'creator'}:null}});
 let items=await server.resolveStoreCart(store,[{productId:product,quantity:2,price:0.01,title:'Mentira'}]);assert.equal(items[0].price,12);assert.equal(items[0].title,'Material verdadeiro');assert.equal(items[0].origin,'store');
 assert.equal((await server.resolveStoreCart(store,[{productId:product,quantity:1,isPlr:true}]))[0].price,50);
 assert.equal((await server.resolveStoreCart(store,[{productId:product,quantity:1,kind:'kit'}]))[0].price,30);
 await assert.rejects(server.resolveStoreCart(store,[{productId:product,quantity:1.5}]));
 await assert.rejects(server.resolveStoreCart(store,[{productId:product,quantity:1},{productId:product,quantity:1}]));
 calls=[];await server.linkStoreCartOrder(store,browser,'order',new Request('https://site.test/api/checkout',{headers:{referer:'https://site.test/loja/minha-loja/checkout?origem=marketplace'}}),'minha-loja');assert.equal(calls.length,0);
 await server.linkStoreCartOrder(store,browser,'order',new Request('https://site.test/api/checkout',{headers:{referer:'https://site.test/loja/minha-loja/checkout'}}),'minha-loja');assert.equal(calls[0][0],'link_store_cart_order');
 const mocks={'@/lib/store-cart-server':server,'@/lib/supabase':{supabaseAdmin:db},'@/lib/whatsapp-notification-service':{normalizeWhatsAppNumber:value=>value==='11999999999'?'5511999999999':null},'@/lib/request-rate-limit':{consumeRequestRateLimit:async()=>({allowed:true}),rateLimitResponse:()=>new Response('',{status:429})},'@/lib/public-links':{publicSiteOrigin:()=> 'https://www.educalizando.com.br'}};
 const {POST}=load('src/app/api/store-carts/route.ts',mocks);
 const body={source:'store',storeId:store,browserToken:browser,items:[{productId:product,quantity:1}],stage:'checkout'};
 const request=(payload=body,path='/loja/minha-loja/checkout')=>new Request('https://site.test/api/store-carts',{method:'POST',headers:{origin:'https://site.test',referer:'https://site.test'+path,'content-type':'application/json'},body:JSON.stringify(payload)});
 calls=[];assert.equal((await POST(request())).status,200);let saved=calls.find(c=>c[0]==='save_store_cart')[1];assert.equal(saved.p_total,12);assert.equal(saved.p_contact,null);
 assert.equal((await POST(request(body,'/produto/material'))).status,403);assert.equal((await POST(request(body,'/loja/minha-loja/checkout?origem=marketplace'))).status,403);
 assert.equal((await POST(request({...body,source:'marketplace'}))).status,400);
 calls=[];await POST(request({...body,consent:false,phone:'11999999999',name:'Cliente'}));assert.equal(calls.find(c=>c[0]==='save_store_cart')[1].p_contact.phone,null);
 calls=[];await POST(request({...body,consent:true,phone:'11999999999',name:'Cliente'}));assert.equal(calls.find(c=>c[0]==='save_store_cart')[1].p_contact.phone,'5511999999999');
 const owner=load('src/app/api/creator/cart-recovery/route.ts',mocks);
 logged=false;assert.equal((await owner.GET(new Request('https://site.test/api/creator/cart-recovery'))).status,401);logged=true;
 rpcError={code:'PGRST202'};assert.equal((await(await owner.GET(new Request('https://site.test/api/creator/cart-recovery'))).json()).available,false);rpcError=null;
 ownerCart={id:browser,items:[{title:'Material'}],consent_at:null,phone:null};assert.equal((await owner.POST(request({id:browser,action:'prepare'}))).status,409);
 ownerCart={...ownerCart,consent_at:new Date().toISOString(),phone:'5511999999999',recovery_token:browser};const prepared=await(await owner.POST(request({id:browser,action:'prepare'}))).json();assert.match(prepared.whatsappUrl,/^https:\/\/wa.me\/5511999999999/);assert.match(prepared.message,/Minha Loja/);assert.ok(!prepared.sent);
 assert.equal((await owner.POST(request({id:browser,action:'sent'}))).status,409,'Cannot report sent before preparing');
 ownerCart.order_id='paid-order';paymentState='paid';assert.equal((await owner.POST(request({id:browser,action:'prepare'}))).status,409);paymentState='pending';
 const recover=load('src/app/api/store-carts/recover/route.ts',mocks);
 ownerCart={id:browser,store_id:store,status:'open',phone:'5511999999999',customer_name:'Privado',items:[{productId:product,quantity:1}]};
 const publicData=await(await recover.GET(new Request('https://site.test/api/store-carts/recover?token='+browser))).json();
 assert.equal(publicData.total,12);assert.ok(!JSON.stringify(publicData).includes('5511999999999'));assert.ok(!JSON.stringify(publicData).includes('Privado'));
 calls=[];assert.equal((await recover.POST(request({token:browser,action:'unsubscribe'}))).status,200);const cancelled=calls.find(c=>c[0]==='store_cart_recovery'&&c[1]==='update')[2];assert.equal(cancelled.phone,null);assert.equal(cancelled.consent_at,null);
}
async function clientChecks(){
 const storage=new Map();let payload;
 const client=load('src/lib/store-recovery-client.ts',{}, {localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},crypto:require('node:crypto').webcrypto,fetch:async(url,init)=>{payload=JSON.parse(init.body);return new Response('{}');}});
 const token=client.recoveryBrowserToken(store);assert.equal(client.recoveryBrowserToken(store),token);
 await client.saveStoreRecovery({storeId:store,storeSlug:'loja',items:[],stage:'cart',consent:false,phone:'11999999999',name:'Privado'});assert.ok(!payload.phone&&!payload.name);
 client.finishStoreRecovery(store);assert.notEqual(client.recoveryBrowserToken(store),token);
 let added;const cartMock={addToCart:item=>{added=item;},getCart:()=>[],getCartByStore:()=>[],getCartTotal:()=>0};
 const fakeReact={...React,useState:v=>[v,()=>{}],useEffect:()=>{}};
 const globals={window:{location:{search:''},dispatchEvent(){}},CustomEvent:class{}};
 const {CartProvider}=load('src/components/store/CartContext.tsx',{'@/lib/cart-service':cartMock,react:fakeReact},globals);
 CartProvider({children:null,storeId:store}).props.value.addToCart({productId:product,storeId:store});assert.equal(added.origin,'store');
 CartProvider({children:null}).props.value.addToCart({productId:product,storeId:store});assert.equal(added.origin,'marketplace');
 globals.window.location.search='?origem=marketplace';CartProvider({children:null,storeId:store}).props.value.addToCart({productId:product,storeId:store});assert.equal(added.origin,'marketplace');
 let effect,timer,flush,recordings=0;
 const tracker=load('src/components/store/StoreCartTracker.tsx',{react:{useRef:v=>({current:v}),useEffect:fn=>{effect=fn();}},'next/navigation':{usePathname:()=>'/loja/minha-loja',useSearchParams:()=>new URLSearchParams()},'./CartContext':{useCart:()=>({items:[{storeId:store,productId:product,quantity:1,origin:'store',isPlr:false}]})},'@/lib/store-recovery-client':{saveStoreRecovery:async()=>{recordings++;return new Response('{}');},finishStoreRecovery(){}}},{window:{addEventListener:(name,fn)=>{flush=fn;},removeEventListener(){}},setTimeout:fn=>{timer=fn;return 1;},clearTimeout(){}}).default;
 tracker({storeId:store,storeSlug:'minha-loja'});assert.equal(recordings,0);flush();assert.equal(recordings,1,'Leaving before debounce flushes the cart');timer();assert.equal(recordings,1,'Unload and timer do not double-record');effect();
 const states=[{available:true,store:{nome_loja:'Minha Loja'},active:1,abandoned:0,converted:0,recoverable_value:0,carts:[]},30,'all',0,false,false,'','',null];
 const react={...React,useState:v=>React.useState(states.length?states.shift():v)};
 const Page=load('src/app/dashboard/carrinhos/page.tsx',{react,'@/lib/client-api':{},'@/lib/api-response':{}}).default;
 assert.match(renderToStaticMarkup(React.createElement(Page)),/Compras originadas no marketplace público ficam fora/);
}
checks().then(clientChecks).then(()=>console.log('PASS: canonical store-owned products/PLR/kits, source exclusion, no contact without consent, private owner API, no automatic sends, browser isolation, explicit origin tracking and real React dashboard.')).catch(e=>{console.error(e);process.exitCode=1;});
