const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
function load(file,mocks={},globals={}) {
  const exports={}; vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{exports,require:name=>mocks[name]||require(name),URL,URLSearchParams,console,setTimeout,clearTimeout,...globals}); return exports;
}
const media=load('src/lib/presentation-video.ts');
for(const url of ['https://youtu.be/M7lc1UVf-VE','https://www.youtube.com/watch?v=M7lc1UVf-VE&list=tracking','https://www.youtube.com/shorts/M7lc1UVf-VE']) {
  const parsed=media.presentationVideo(url);assert.equal(parsed.id,'M7lc1UVf-VE');assert.equal(parsed.url,'https://www.youtube.com/watch?v=M7lc1UVf-VE');
  const embed=new URL(media.presentationEmbedUrl(parsed,true));assert.equal(embed.origin,'https://www.youtube-nocookie.com');assert.equal(embed.searchParams.get('mute'),'1');assert.equal(embed.searchParams.get('autoplay'),'1');
}
assert.equal(media.presentationVideo('https://www.instagram.com/reel/REAL_code/?igsh=tracking').embedUrl,'https://www.instagram.com/reel/REAL_code/embed/');
for(const url of ['javascript:alert(1)','http://www.youtube.com/watch?v=M7lc1UVf-VE','https://youtube.com.evil.test/watch?v=M7lc1UVf-VE','https://youtube.com@evil.test/watch?v=M7lc1UVf-VE','https://user:secret@www.youtube.com/watch?v=M7lc1UVf-VE','https://www.youtube.com:444/watch?v=M7lc1UVf-VE','https://www.instagram.com/accounts/login/','https://www.youtube.com/channel/CHANNEL','https://youtu.be/not-valid','https://drive.google.com/file/private','https://www.instagram.com/reel/ab/']) assert.equal(media.presentationVideo(url),null,url);
assert.equal(media.productPresentationVideo({instagram_video_url:'https://www.instagram.com/p/REAL_code/'}).provider,'instagram');
assert.equal(media.productPresentationVideo({presentation_video_url:'invalid',instagram_video_url:'invalid'}),null);
// Mount the player with controlled state: no provider requests before intent;
// click opens controls, offscreen/other player hides it, cleanup removes listeners.
let state=[false,false],cursor=0,events={},intersect,cleaned=0,hover,reduceMotion=false;
const effects=[];
const Player=load('src/components/PresentationVideoPlayer.tsx',{
 react:{...React,useId:()=> 'local-player',useState: initial=>{const index=cursor++;return[state[index]??initial,value=>{state[index]=value;}];},useRef:()=>({current:{}}),useEffect:effect=>effects.push(effect)},
 '@/lib/presentation-video':media,
},{setTimeout:(fn,ms)=>{assert.equal(ms,450);hover=fn;return 1;},clearTimeout:()=>{hover=null;},window:{matchMedia:query=>({matches:query.includes('reduced-motion')?reduceMotion:true}),addEventListener:(key,fn)=>events[key]=fn,removeEventListener:()=>cleaned++,dispatchEvent:event=>events[event.type]?.(event)},document:{addEventListener(){},removeEventListener(){},hidden:false},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init.detail;}},IntersectionObserver:class{constructor(fn){intersect=fn;}observe(){}disconnect(){cleaned++;}}}).default;
function walk(node,predicate){if(!node||typeof node!=='object')return null;if(predicate(node))return node;for(const child of React.Children.toArray(node.props?.children)){const result=walk(child,predicate);if(result)return result;}return null;}
function render(){cursor=0;return Player({url:'https://youtu.be/M7lc1UVf-VE',title:'Local fixture',hoverPreview:true});}
let tree=render();assert.equal(walk(tree,node=>node.type==='iframe'),null);const cleanup=effects[0]();
walk(tree,node=>node.type==='button').props.onClick();tree=render();
let iframe=walk(tree,node=>node.type==='iframe');assert(iframe);assert.equal(new URL(iframe.props.src).searchParams.get('controls'),'1');assert(!iframe.props.className.includes('pointer-events-none'));
intersect([{isIntersecting:false}]);assert.equal(walk(render(),node=>node.type==='iframe'),null);
walk(render(),node=>node.type==='button').props.onClick();events['educalizando:video-play']({detail:'other-player'});assert.equal(walk(render(),node=>node.type==='iframe'),null);
state=[false,false];tree=render();tree.props.onPointerEnter();assert.equal(walk(render(),node=>node.type==='iframe'),null);assert.equal(typeof hover,'function');hover();tree=render();iframe=walk(tree,node=>node.type==='iframe');assert.equal(new URL(iframe.props.src).searchParams.get('controls'),'0');assert(iframe.props.className.includes('pointer-events-none'));tree.props.onPointerLeave();assert.equal(walk(render(),node=>node.type==='iframe'),null);
reduceMotion=true;render().props.onPointerEnter();assert.equal(hover,null);cleanup();assert(cleaned>=2);
console.log('PASS presentation video: strict public origins, canonical URLs, legacy compatibility, no iframe before intent, manual controls, single player/offscreen stop and cleanup.');
