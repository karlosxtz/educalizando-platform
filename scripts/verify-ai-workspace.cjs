const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}) { const exports = {}; vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, { exports, require: name => mocks[name] || require(name), console, Date, Set, Uint16Array }); return exports; }
const storageModule = load('src/lib/ai-workspace.ts');
const grounding = load('src/lib/ai-marketing-grounding.ts');
const review = load('src/lib/ai-editor-review.ts', { './ai-marketing-grounding': grounding });
const memory = new Map(); const storage = { getItem: key => memory.get(key) || null, setItem: (key, value) => memory.set(key, value) };
const now = Date.now();
const product = { titulo: 'Jogo das emoções', descricao: 'Material com 14 páginas. Inclui 11 tabuleiros.', plr_descricao: 'Licença para revenda.', page_count: 14, arquivo_url: 'SECRET_FILE', google_ai_key: 'SECRET_KEY', age_range: '6 a 10 anos', format_details: 'PDF para imprimir' };
const baseline = storageModule.editorialFromProduct(product, 'product');
const input = { productId: 'product-a', target: 'product', productTitle: product.titulo, sourceUpdatedAt: '2026-10-13T12:00:00Z', baseline, values: { ...baseline, description: '14 páginas com 11 tabuleiros para reconhecer emoções.' }, apiKey: 'SECRET_KEY', privateUrl: 'SECRET_FILE' };
storageModule.writeAiWork(storage, 'store-a', input, 'draft', now);
storageModule.writeAiWork(storage, 'store-a', { ...input, values: { ...input.values, description: 'Minha edição com 14 páginas.' } }, 'draft', now + 1);
let state = storageModule.readAiWorkspace(storage, 'store-a', now + 2);
assert.equal(state.drafts.length, 1); assert.equal(state.drafts[0].values.description, 'Minha edição com 14 páginas.');
assert.equal(storageModule.readAiWorkspace(storage, 'store-b', now + 2).drafts.length, 0);
storageModule.writeAiWork(storage, 'store-a', { ...input, target: 'plr' }, 'draft', now + 3);
assert.equal(storageModule.readAiWorkspace(storage, 'store-a', now + 4).drafts.length, 2, 'Final and PLR drafts are distinct');
storageModule.writeAiWork(storage, 'store-a', input, 'generated', now + 4);
storageModule.writeAiWork(storage, 'store-a', input, 'generated', now + 5);
assert.equal(storageModule.readAiWorkspace(storage, 'store-a', now + 6).history.length, 1, 'Identical adjacent checkpoints do not flood history');
for (let i = 0; i < 25; i++) storageModule.writeAiWork(storage, 'store-a', { ...input, values: { ...baseline, title: `Versão ${i}` } }, 'edited', now + 10 + i);
state = storageModule.readAiWorkspace(storage, 'store-a', now + 50); assert.equal(state.history.length, 20);
assert.ok(!JSON.stringify(state).includes('SECRET_'), 'Only whitelisted editorial fields persist');
assert.equal(storageModule.readAiWorkspace(storage, 'store-a', now + 31 * 86400000).history.length, 0);
storageModule.clearAiDraft(storage, 'store-a', 'product-a', 'product');
state = storageModule.readAiWorkspace(storage, 'store-a', now + 60); assert.equal(state.drafts.length, 1); assert.equal(state.drafts[0].target, 'plr');
const oldValue = storage.getItem(storageModule.aiWorkspaceKey('store-a'));
assert.throws(() => storageModule.writeAiWork({ getItem: storage.getItem, setItem() { throw Error('Quota exceeded'); } }, 'store-a', input, 'draft'), /Quota/);
assert.equal(storage.getItem(storageModule.aiWorkspaceKey('store-a')), oldValue, 'Quota failure does not erase previous data');
assert.equal(storageModule.readAiWorkspace({ getItem: () => 'invalid', setItem() {} }, 'store-a').history.length, 0);
for (const [a, b] of [['', 'novo'], ['texto', ''], ['14 páginas com emoções.', '14 páginas com figuras.'], ['A\nB\nC', 'A\nD\nC'], ['ação e educação', 'educação e ação'], ['x '.repeat(1500), 'x '.repeat(1499) + 'novo'], ['a\n'.repeat(800), 'b\n'.repeat(800)]]) {
  const diff = review.compareAiText(a, b);
  assert.equal(diff.filter(item => item.kind !== 'added').map(item => item.text).join(''), a);
  assert.equal(diff.filter(item => item.kind !== 'removed').map(item => item.text).join(''), b);
}
assert.equal(review.reviewAiEditorial(product, baseline, 'product').length, 0);
const bad = review.reviewAiEditorial(product, { ...baseline, description: '50 páginas editáveis no Canva com aprendizagem garantida. Esta frase longa apresenta o produto de forma repetitiva. Esta frase longa apresenta o produto de forma repetitiva.' }, 'product');
assert.ok(bad.some(item => item.title.includes('Quantidade'))); assert.ok(bad.some(item => item.title.includes('repetido'))); assert.ok(bad.some(item => item.title.includes('Afirmação')));
const React = require('react'), { renderToStaticMarkup } = require('react-dom/server');
const panel = load('src/app/dashboard/ia/AiWorkspacePanel.tsx');
const markup = renderToStaticMarkup(React.createElement(panel.AiWorkspacePanel, { drafts: state.drafts, history: state.history, productId: 'product-a', status: 'salvo', disabled: false, onRestore() {} }));
assert.ok(markup.includes('Restaurar para revisão')); assert.ok(markup.includes('Licença PLR'));
const comparison = load('src/app/dashboard/ia/AiEditorialReview.tsx', { '@/lib/ai-editor-review': review });
const comparisonHtml = renderToStaticMarkup(React.createElement(comparison.AiEditorialReview, { before: baseline, after: { ...baseline, description: 'Material com 20 páginas.' }, source: product, target: 'product', categoryNames: {}, levelNames: {} }));
assert.ok(comparisonHtml.includes('<del') && comparisonHtml.includes('<ins')); assert.ok(comparisonHtml.includes('Quantidade sem apoio'));
console.log('PASS: durable draft round-trip, store/product/license separation, version retention/deduplication/expiry, secret whitelist, quota/corruption recovery, complete diff reconstruction and bounded long text, quality flags, real React history and comparison rendering.');

const choices=load('src/app/dashboard/ia/AiDescriptionChoices.tsx');
const choicesHtml=renderToStaticMarkup(React.createElement(choices.AiDescriptionChoices,{options:['primeira','segunda','terceira'],current:'original',selected:'original',onSelect(){}}));
assert.equal((choicesHtml.match(/Ler versão completa/g)||[]).length,3);assert.ok(choicesHtml.includes('Manter a descrição atual'));assert.ok(choicesHtml.includes('original'));
const guidance=load('src/app/dashboard/ia/AiSeoGuidance.tsx',{'sonner':{toast:{success(){},error(){}}}});
const guidanceHtml=renderToStaticMarkup(React.createElement(guidance.AiSeoGuidance,{summary:'Resumo real',keywords:['tema','material']}));
assert.ok(guidanceHtml.includes('WhatsApp')&&guidanceHtml.includes('Tags e classificação')&&guidanceHtml.includes('não o publica automaticamente'));

const presets=load('src/lib/ai-editor-options.ts');
const writing=load('src/app/dashboard/ia/AiWritingOptions.tsx',{'@/lib/ai-editor-options':presets});
let chosenStyle='',chosenBrief='';
const tree=writing.AiWritingOptions({style:'natural',brief:'',disabled:false,onStyle:value=>chosenStyle=value,onBrief:value=>chosenBrief=value});
const buttons=[];
function walk(node){if(!node)return;if(Array.isArray(node)){node.forEach(walk);return;}if(typeof node==='object'&&node.props){if(node.type==='button')buttons.push(node);walk(node.props.children);}}
walk(tree);
assert.equal(presets.AI_WRITING_PRESETS.length,6);
for(let i=0;i<6;i++){buttons[i].props.onClick();assert.equal(chosenBrief,presets.AI_WRITING_PRESETS[i].brief);assert.equal(chosenStyle,presets.AI_WRITING_PRESETS[i].style);assert.ok(chosenBrief.length<=600);}
buttons[6].props.onClick();assert.equal(chosenBrief,'');
const writingHtml=renderToStaticMarkup(React.createElement(writing.AiWritingOptions,{style:presets.AI_WRITING_PRESETS[0].style,brief:presets.AI_WRITING_PRESETS[0].brief,disabled:true,onStyle(){},onBrief(){}}));
assert.ok(writingHtml.includes('Revisão completa')&&writingHtml.includes('Selecionada')&&writingHtml.includes('disabled'));

const fill=load('src/lib/ai-seo-fill.ts');
const filled=fill.fillAiSeoProposal(baseline,{titles:['curto','Material pedagógico sobre emoções para imprimir'],description:'Descrição proposta',tags:['emoções'],categoryId:'cat',educationLevelId:'level'},'product');
assert.equal(filled.title,'Material pedagógico sobre emoções para imprimir');assert.equal(filled.categoryId,'cat');
assert.equal(fill.fillAiSeoProposal(baseline,{titles:['Novo'],description:'Licença revisada',tags:['novas']},'plr').title,baseline.title);
assert.equal(fill.fillAiSeoProposal(baseline,{},'product').description,baseline.description);
const scoreModule=load('src/lib/product-seo-score.ts');
assert.equal(scoreModule.calculateProductSeoScore({titulo:'Material pedagógico para trabalhar emoções',descricao:'Detalhes reais. '.repeat(12),capa_url:'cover',category_ids:['cat'],education_level_ids:['level'],tags:['emoções'],slug:'material'}).score,100);
const fillPanel=load('src/app/dashboard/ia/AiSeoFillPanel.tsx',{'@/lib/product-seo-score':scoreModule});
let clicked=false;const panelTree=fillPanel.AiSeoFillPanel({product:{capa_url:'cover',slug:'slug'},values:filled,target:'product',disabled:false,onFill(){clicked=true;}});
const findButton=node=>{if(!node)return null;if(Array.isArray(node)){for(const item of node){const result=findButton(item);if(result)return result;}}else if(node.props){if(node.type==='button')return node;return findButton(node.props.children);}return null;};
findButton(panelTree).props.onClick();assert.ok(clicked);
let feedback='',actualFields={};
const editor=load('src/app/dashboard/ia/AiProductEditor.tsx',{'react':{...React,useState:()=>['',value=>feedback=value]},'@/lib/school-calendar':{SCHOOL_CALENDAR_TAGS:[]},'@/components/ui/CatalogImage':{default:()=>null},'@/lib/ai-seo-fill':fill,'./AiSeoFillPanel':fillPanel,'./AiEditorialReview':comparison,'./AiSeoGuidance':guidance,'./AiDescriptionChoices':choices});
const editorTree=editor.AiProductEditor({proposal:{titles:['Material pedagógico sobre emoções para imprimir'],description:'Descrição proposta',tags:['emoções'],categoryId:'cat',educationLevelId:'level'},activeProduct:product,categories:[],educationLevels:[],editingTarget:'product',values:baseline,baseline,editedTitle:baseline.title,editedDescription:baseline.description,editedTags:[],editedThemes:[],editedCategoryId:'',editedEducationLevelId:'',editedAgeRange:'',editedFormatDetails:'',tagDraft:'',applying:false,onClose(){},applyProposal:async()=>{},...Object.fromEntries(['Title','Description','Tags','CategoryId','EducationLevelId','AgeRange','FormatDetails','Themes'].map(field=>['setEdited'+field,value=>actualFields[field]=value])),setTagDraft(){}});
function findFill(node){if(!node)return null;if(Array.isArray(node)){for(const child of node){const found=findFill(child);if(found)return found;}}else if(node.props){if(node.type===fillPanel.AiSeoFillPanel)return node;return findFill(node.props.children);}return null;}
findFill(editorTree).props.onFill();assert.equal(actualFields.Description,'Descrição proposta');assert.equal(actualFields.CategoryId,'cat');assert.equal(actualFields.EducationLevelId,'level');assert.match(feedback,/Ajustes preenchidos/);
const imageStates=[false,false];let imageHook=0;
const imageComponent=load('src/components/ui/CatalogImage.tsx',{'react':{...React,useState:()=>{const index=imageHook++;return [imageStates[index],value=>imageStates[index]=value];}},'@/lib/catalog-image-url':{catalogImageUrl:()=>'/media/catalogo/uploads/test.webp'}});
const imageElement=imageComponent.default({src:'https://arquivos.educalizando.com.br/public-images/uploads/test.webp',alt:'Capa'});
let imageAttempt=imageElement.type(imageElement.props);assert.equal(imageAttempt.props.src,'/media/catalogo/uploads/test.webp');imageAttempt.props.onError();imageHook=0;
imageAttempt=imageElement.type(imageElement.props);assert.equal(imageAttempt.props.src,'/media/catalogo/uploads/test.webp?image_retry=1');imageAttempt.props.onError();imageHook=0;
imageAttempt=imageElement.type(imageElement.props);assert.equal(imageAttempt.type,'div','Only one automatic retry, then a readable fallback rather than broken img');
