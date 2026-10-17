const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/product-relations-write.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:exportsObject,require,Set});
let actions=[], failRead=false, failWrite=false;
const db={from(table){const q={eq(){return this;},select(){this.op='read';return this;},insert(rows){this.op='write';this.rows=rows;return this;},upsert(rows){this.op='write';this.rows=rows;return this;},delete(){this.op='delete';return this;},in(_field,ids){this.ids=ids;return this;},then(resolve,reject){return Promise.resolve().then(()=>{
 actions.push(this.op);
 if(this.op==='read')return{data:[table==='product_images'?{id:'old-image'}:{bncc_skill_id:'old-skill'}],error:failRead?new Error('read unavailable'):null};
 if(this.op==='write')return{error:failWrite?new Error('write unavailable'):null};
 assert.deepEqual(Array.from(this.ids),[table==='product_images'?'old-image':'old-skill']);return{error:null};
 }).then(resolve,reject);}};return q;}};
(async()=>{
 for(const [name,input] of [['replaceProductImages',['https://example.com/image.png']],['replaceProductSkills',['new-skill']]]){
   actions=[];await exportsObject[name](db,'product',input);assert.deepEqual(actions,['read','write','delete']);
   actions=[];failWrite=true;await assert.rejects(exportsObject[name](db,'product',input));assert.deepEqual(actions,['read','write'],'Replacement failure must not remove previous data');failWrite=false;
   actions=[];failRead=true;await assert.rejects(exportsObject[name](db,'product',input));assert.deepEqual(actions,['read']);failRead=false;
   actions=[];await exportsObject[name](db,'product',[]);assert.deepEqual(actions,['read','delete'],'Explicit empty selection clears only previous rows');
 }
 console.log('PASS: gallery and BNCC replacement preserves previous data on read/write failure, cleans only previous IDs, supports explicit clearing.');
})().catch(e=>{console.error(e);process.exitCode=1;});
