const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
function load(file,mocks={},globals={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>mocks[n]||require(n),Map,Date,Math,...globals});return exports;}
const score=load('src/lib/product-seo-score.ts');
const snapshot=load('src/lib/seo-snapshot.ts',{'./product-seo-score':score});
const saved={id:'a',titulo:'Jogo das emoções com tabuleiros e carinhas',descricao:'Descrição real do cadastro. '.repeat(10),tags:['emoções'],capa_url:'cover',slug:'jogo',category_ids:['cat'],education_level_ids:['level']};
const updated=snapshot.reconcileSeoScores([{id:'a',title:'Antigo',score:43,suggestions:['Antiga pendência'],coverUrl:null,sales:7},{id:'deleted',title:'Removido',score:100,suggestions:[],coverUrl:null}],[saved]);
assert.equal(updated.length,1);assert.equal(updated[0].score,100);assert.equal(updated[0].title,saved.titulo);assert.equal(updated[0].sales,7);assert.equal(updated[0].suggestions.length,0);
assert.equal(snapshot.reconcileSeoScores(updated,[{...saved,descricao:'Curta'}])[0].score,86,'A subsequent real edit updates both score and pending issues; 100 is never pinned artificially');
const handlers=new Map(),memory=new Map();
const window={addEventListener:(name,fn)=>handlers.set(name,fn),removeEventListener:(name)=>handlers.delete(name),dispatchEvent:event=>handlers.get(event.type)?.(event)};
const sync=load('src/lib/seo-sync.ts',{}, {window,CustomEvent:class{constructor(type,init){this.type=type;this.detail=init.detail;}},localStorage:{setItem:(key,value)=>memory.set(key,value)}});
let refreshes=0;const stop=sync.onSeoSaved('store-a',()=>refreshes++);
sync.notifySeoSaved('store-a');assert.equal(refreshes,1);const notice=JSON.parse(memory.get('educalizando:seo-sync'));assert.deepEqual(Object.keys(notice).sort(),['revision','storeId']);
handlers.get('storage')({key:'educalizando:seo-sync',newValue:JSON.stringify({storeId:'store-a'})});assert.equal(refreshes,2,'Another tab refreshes the same store');
sync.notifySeoSaved('store-b');assert.equal(refreshes,2,'No cross-store refresh');stop();sync.notifySeoSaved('store-a');assert.equal(refreshes,2,'Unmount removes listeners');
console.log('PASS: stale analytics reconciled with saved product, multi-level scoring, original sales metrics retained, real later edits reflected, same-tab and cross-tab save refresh, store isolation and clean unsubscribe.');
