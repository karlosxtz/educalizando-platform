const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const React = require('react');
let height=149.2, observed, disconnected=false, effect, resize, top;
const header={getBoundingClientRect:()=>({height})};
const element={style:{setProperty:(key,value)=>{assert.equal(key,'--discovery-top');top=value;}}};
const exportsObject={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/DiscoverySidebar.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,{
  exports:exportsObject,
  require:name=>name==='react'?{...React,useRef:()=>({current:element}),useEffect:fn=>{effect=fn;}}:require(name),
  document:{querySelector:selector=>{assert.equal(selector,'.marketplace-header');return header;}},
  window:{addEventListener:(name,fn)=>{assert.equal(name,'resize');resize=fn;},removeEventListener:(name,fn)=>assert.equal(fn,resize)},
  ResizeObserver:class{constructor(fn){observed=fn;}observe(target){assert.equal(target,header);}disconnect(){disconnected=true;}}
});
const tree=exportsObject.default({children:'actual cards'});
assert.equal(tree.type,'aside');assert.equal(tree.props.tabIndex,0);assert.equal(tree.props.children,'actual cards');
assert(tree.props.className.includes('xl:overflow-y-auto'));assert(tree.props.className.includes('100dvh'));assert(tree.props.className.includes('xl:top-[var(--discovery-top'));
const cleanup=effect();assert.equal(top,'166px');height=210;observed();assert.equal(top,'226px');height=120;resize();assert.equal(top,'136px');cleanup();assert(disconnected);
const source=fs.readFileSync('src/components/PublicDiscoveryPage.tsx','utf8');assert(source.includes('<DiscoverySidebar>'));assert(source.includes('materiais publicados'));assert(!source.includes('xl:top-40'));
const query=fs.readFileSync('src/lib/discovery-catalog.ts','utf8');assert(query.includes("{ count: 'exact' }"));assert(query.includes(".eq('status', 'publicado').is('excluido_em', null)"));
console.log('PASS discovery sidebar: header measurement, viewport-bound scrolling, keyboard access, responsive CSS and cleanup; catalogue still counts exact published/nondeleted records.');
