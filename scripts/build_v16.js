const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const input = path.join(root, 'ATENDENTE EDUCALIZANDO CONSULTA GUIADA V15.json');
const output = path.join(root, 'ATENDENTE EDUCALIZANDO CONVERSACIONAL V16.json');
const abandonmentOutput = path.join(root, 'RECUPERADOR DE ATENDIMENTOS V16.json');
const messageRecoveryOutput = path.join(root, 'RECUPERADOR DE MENSAGENS V16.json');

const workflow = JSON.parse(fs.readFileSync(input, 'utf8'));
workflow.name = 'ATENDENTE EDUCALIZANDO CONVERSACIONAL V16';

// Isola todo o estado da V16 sem alterar o webhook nem as credenciais existentes.
let serialized = JSON.stringify(workflow);
serialized = serialized.replaceAll('educalizando:filtros:v15:', 'educalizando:filtros:v16:');
serialized = serialized.replaceAll('educalizando:latest:v15:', 'educalizando:latest:v16:');
serialized = serialized.replaceAll('educalizando:dedup:v15:', 'educalizando:dedup:v16:');
serialized = serialized.replaceAll('educalizando:processing:v15:', 'educalizando:processing:v16:');
serialized = serialized.replaceAll('educalizando:events:v15', 'educalizando:events:v16');
serialized = serialized.replaceAll('educalizando:outbox:v15', 'educalizando:outbox:v16');
serialized = serialized.replaceAll('educalizando:mensagem:v15:', 'educalizando:mensagem:v16:');
serialized = serialized.replaceAll('"value":"V15"', '"value":"V16"');
const w = JSON.parse(serialized);

const node = (name) => {
  const found = w.nodes.find((n) => n.name === name);
  if (!found) throw new Error(`Nó não encontrado: ${name}`);
  return found;
};
const redisCred = JSON.parse(JSON.stringify(node('Buscar filtros do cliente').credentials));
const evolutionCred = JSON.parse(JSON.stringify(node('Enviar texto').credentials));
const uid = (name) => { const h=crypto.createHash('sha1').update(name).digest('hex').slice(0,32); return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`; };
const connect = (from, to, fromIndex = 0, toIndex = 0) => {
  if (!w.connections[from]) w.connections[from] = { main: [] };
  if (!w.connections[from].main) w.connections[from].main = [];
  while (w.connections[from].main.length <= fromIndex) w.connections[from].main.push([]);
  w.connections[from].main[fromIndex].push({ node: to, type: 'main', index: toIndex });
};
const setConnections = (from, outputs) => {
  w.connections[from] = { main: outputs.map((items) => items.map((to) => ({ node: to, type: 'main', index: 0 }))) };
};
const redisSet = (name, key, value, position, ttl = 90000) => ({
  id: uid(name), name, type: 'n8n-nodes-base.redis', typeVersion: 1, position,
  parameters: { operation: 'set', key, value, keyType: 'string', expire: true, ttl },
  credentials: redisCred, retryOnFail: true, maxTries: 3, waitBetweenTries: 500, onError: 'continueRegularOutput',
});
const redisDelete = (name, suffix, position) => ({
  id: uid(name), name, type: 'n8n-nodes-base.redis', typeVersion: 1, position,
  parameters: { operation: 'delete', key: `={{ 'consulta_' + $('dados').item.json.instance + ':' + $('dados').item.json.remotejid + '_${suffix}' }}` },
  credentials: redisCred, retryOnFail: true, maxTries: 3, waitBetweenTries: 300, onError: 'continueRegularOutput',
});
const codeNode = (name, jsCode, position, mode = 'runOnceForEachItem') => ({
  id: uid(name), name, type: 'n8n-nodes-base.code', typeVersion: 2, position,
  parameters: { mode, language: 'javaScript', jsCode },
});
const ifNode = (name, expression, position) => ({
  id: uid(name), name, type: 'n8n-nodes-base.if', typeVersion: 2.3, position,
  parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 3 }, conditions: [{ id: uid(name + '-condition'), leftValue: expression, rightValue: '', operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} },
});

// Nome configurável sem depender de acesso a variáveis de ambiente dentro do Code node.
node('dados').parameters.assignments.assignments.push({
  id: uid('agent-name'), name: 'agentName', value: "={{ $env.NOME_AGENTE || 'Alexia' }}", type: 'string',
});

node('Interpretar pedido e filtros').parameters.options.systemMessage += `\n\nREINÍCIO DA BUSCA\n- Classifique como reiniciar_busca quando o cliente disser: quero outro, outro produto, outro material, voltar, recomeçar, nova busca, não gostei, nenhuma opção, tem mais, mostrar outros, trocar filtros, pesquisar novamente ou expressão equivalente.\n- Nunca use filtros antigos depois de uma intenção clara de reinício.\n- Inclua reiniciar_busca entre as intenções permitidas.`;

const validatorCode = String.raw`try {
function parseObject(value, fallback={}) { if (value && typeof value === 'object' && !Array.isArray(value)) return value; if (typeof value !== 'string' || !value.trim()) return fallback; const c=value.replace(/[\x60]{3}json/gi,'').replace(/[\x60]{3}/g,'').trim(); try{return JSON.parse(c)}catch{} const a=c.indexOf('{'),b=c.lastIndexOf('}'); if(a>=0&&b>a)try{return JSON.parse(c.slice(a,b+1))}catch{} return fallback; }
function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\sº°:_-]/g,' ').replace(/\s+/g,' ').trim()}
function clean(v){return String(v||'').replace(/\*+/g,'').replace(/[\x60]+/g,'').trim()}
function money(v){if(v===null||v===undefined||v==='')return'';if(typeof v==='number')return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});const s=String(v).trim();return /^R\$/.test(s)?s:'R$ '+s}
const data=$('dados').item.json;
const agent=String(data.agentName||'Alexia').trim()||'Alexia';
const sessionId=String(data.instance||'')+':'+String(data.remotejid||'');
const message=String($('message').item.json.message||'').trim();
const current=norm(message);
const interpreted=parseObject($json.output??$json.text??$json,{});
const extracted=parseObject(interpreted.filters,{});
const previous=parseObject($('Buscar filtros do cliente').item.json.filterState??'{}',{});
const empty={idade:'',anoEscolar:'',disciplina:'',tema:'',habilidade:'',objetivo:'',dataComemorativa:'',tipoCompra:'',produtoMencionado:'',stage:'idle',awaiting:'',lastResults:[],lastProduct:null,selectedProduct:null,pendingPurchase:null,selectedVersion:'',lastSearchQuery:'',seenProductIds:[],lastIntent:'',lastUserMessage:'',lastBotAction:'',reminderPending:false,startedAt:'',updatedAt:'',filterFormSubmitted:false};
let state={...empty,...previous};
let action='reply', text='', query='', section='all', intent=String(interpreted.intencao||'conversa');
let captureFields=[], metricEvents=[], resetSession=false, startUpsell=false, purchasedProduct=null;
const now=new Date().toISOString(); state.updatedAt=now;
const results=Array.isArray(state.lastResults)?state.lastResults:[];
const yes=/^(sim|s|claro|confirmo|confirmado|pode|pode sim|sim pode|isso|correto|ok|beleza|quero|vamos|fechado)(?:\s+.*)?$/.test(current);
const no=/^(nao|n|negativo|nao quero|cancelar|cancela|voltar)(?:\s+.*)?$/.test(current);
const resetPattern=/\b(quero outro|quero outra|outro produto|outro material|outra atividade|nova busca|nova pesquisa|novo atendimento|recomecar|comecar de novo|voltar ao inicio|trocar filtros|mudar filtros|pesquisar novamente|nao gostei|nenhuma opcao|nenhum deles|nenhuma delas|mostrar outros|mostre outros|tem mais|mais opcoes)\b/;
const reset=$json.resetIntent===true||interpreted.reset===true||intent==='reiniciar_busca'||resetPattern.test(current);
function question(field){
  if(field==='age_or_year')return 'Vamos encontrar o material ideal 😊 Para qual idade ou ano escolar você procura?';
  if(field==='discipline')return 'Qual disciplina você quer trabalhar? Se não tiver preferência, responda “qualquer”.';
  if(field==='theme')return 'Qual tema, conteúdo ou habilidade você quer trabalhar?';
  if(field==='date')return 'É para alguma data comemorativa? Responda “não” ou informe o nome da data.';
  if(field==='version')return 'Você procura a versão final para uso próprio, a versão PLR para revenda ou qualquer uma?';
  return 'Qual informação você deseja alterar: idade, ano escolar, disciplina, tema, data comemorativa ou versão?';
}
function parseForm(raw){const values={},aliases={idade:'idade','ano escolar':'anoEscolar','disciplina':'disciplina','tema':'tema','tema ou conteudo':'tema','conteudo':'tema','habilidade':'habilidade','habilidade ou objetivo':'habilidade','objetivo':'objetivo','data comemorativa':'dataComemorativa','tipo de versao':'tipoCompra','versao':'tipoCompra','nome do produto':'produtoMencionado','produto':'produtoMencionado'};let labels=0;for(const line of String(raw||'').split(/\r?\n/)){const m=line.match(/^\s*([^:=]{2,40})\s*[:=]\s*(.*?)\s*$/);if(!m)continue;const f=aliases[norm(m[1])];if(!f)continue;labels++;const v=String(m[2]||'').replace(/\s*\([^)]*\)\s*$/,'').trim();if(v&&!/^(nao informado|nao sei|nenhum|nenhuma|n\/a|-)$/.test(norm(v)))values[f]=v}return{values,submitted:labels>=2,labels}}
function formTemplate(){return ['Para agilizar, você também pode preencher tudo de uma vez:','Idade:','Ano escolar:','Disciplina:','Tema ou conteúdo:','Habilidade ou objetivo:','Data comemorativa: não ou nome da data','Tipo de versão: final, PLR ou qualquer'].join('\n')}
function parseAgeYear(raw){const t=norm(raw),out={};const age=t.match(/\b(\d{1,2})\s*(?:anos?|aninhos?)\b/)||t.match(/^(\d{1,2})$/);const year=t.match(/\b([1-9])\s*(?:º|o|°)?\s*(?:ano|serie)\b/);if(age)out.idade=age[1]+' anos';if(year)out.anoEscolar=year[1]+'º ano';return out}
function setField(field,value){const v=clean(value);if(!v)return;state[field]=v;captureFields.push({field,value:v})}
function queryFor(s){const raw=s.produtoMencionado||(s.dataComemorativa&&!/^nao$/i.test(norm(s.dataComemorativa))?s.dataComemorativa:'')||s.tema||s.habilidade||s.objetivo||s.disciplina||'';const v=norm(raw);if(/\b(letra|letras|alfabeto|abecedario|silaba|silabas)\b/.test(v))return raw;if(/\b(portugues|lingua portuguesa)\b/.test(v))return'alfabetização';if(/\b(numero|numeros|numeral|numerais)\b/.test(v))return'matemática';return clean(raw)}
function optionsText(){if(!results.length)return 'Não tenho opções salvas nesta conversa. Posso iniciar uma nova busca para você.';const lines=['Estas são as opções que você já recebeu:'];results.slice(0,3).forEach((p,i)=>lines.push('Opção '+(i+1)+': '+p.title+(p.price!==''?' — '+money(p.price):'')));lines.push('Responda com o número ou com o nome do material.');return lines.join('\n')}
function choiceIndex(t){if(/^\s*[1-3]\s*$/.test(t))return Number(t.trim())-1;for(const [re,i] of [[/\b(opcao 1|primeir[oa])\b/,0],[/\b(opcao 2|segund[oa])\b/,1],[/\b(opcao 3|terceir[oa])\b/,2]])if(re.test(t))return i;return-1}
function choiceByName(t){let best=null,size=0;for(const item of results){const title=norm(item.title);if(title.length>=4&&(t.includes(title)||title.includes(t))&&title.length>size){best=item;size=title.length}}return best}
function availableVersions(item){const arr=[];if(item?.publicUrl)arr.push('final'+(item.price!==''?' por '+money(item.price):''));if(item?.plrUrl)arr.push('PLR'+(item.plrPrice!==''?' por '+money(item.plrPrice):''));return arr}
function pendingFor(item,mode){let chosen=mode;if(chosen==='both'){if(item.publicUrl&&!item.plrUrl)chosen='final';else if(item.plrUrl&&!item.publicUrl)chosen='plr'}const link=chosen==='plr'?item.plrUrl:item.publicUrl;const value=chosen==='plr'?item.plrPrice:item.price;return{product:item,mode:chosen,link:String(link||''),price:value??''}}
function confirmation(p){return ['Você escolheu: '+p.product.title,'Versão: '+(p.mode==='plr'?'PLR com licença de revenda':'final para uso próprio')+(p.price!==''?' — '+money(p.price):''),'Confirma a compra? Responda “sim” ou “não”.'].join('\n')}
const form=parseForm(message);

if(reset){
  state={...empty,stage:'collecting',awaiting:'age_or_year',startedAt:now,updatedAt:now}; resetSession=true; metricEvents=['ficha_iniciada']; intent='reiniciar_busca'; text='Claro! Vamos buscar outro material. '+question('age_or_year');
} else if(state.reminderPending){
  state.reminderPending=false;
  if(yes){text='Perfeito, vamos continuar. '+question(state.awaiting||'age_or_year'); intent='retomar_atendimento'}
  else if(no){state={...empty,updatedAt:now};text='Tudo bem 😊 Quando quiser procurar outro material, é só me chamar.';intent='encerrar_atendimento'}
  else{text='Seu atendimento continua aberto. '+question(state.awaiting||'age_or_year');intent='retomar_atendimento'}
} else {
  const idx=choiceIndex(current),named=choiceByName(current),chosen=idx>=0?results[idx]:named;
  const buy=/\b(quero comprar|vou comprar|comprar|adquirir|fechar a compra|fico com esse|fico com essa|manda o link|mande o link|envia o link|como pago|onde compro)\b/.test(current);
  const mode=/\b(plr|revenda|revender)\b/.test(current)?'plr':/\b(versao final|uso pessoal|arquivo final|final)\b/.test(current)?'final':'both';
  if(state.stage==='confirming_purchase'&&state.pendingPurchase&&(yes||no)){
    if(yes){const p=state.pendingPurchase;if(!p.link){text='Esse link não está cadastrado. Vou manter o produto selecionado para você escolher outra versão.';state.stage='awaiting_version';state.awaiting='version'}else{text='Compra confirmada 😊\n\n'+p.product.title+'\n'+(p.mode==='plr'?'Versão PLR':'Versão final')+(p.price!==''?' — '+money(p.price):'')+'\n\nLink para comprar:\n'+p.link+'\n\nSe precisar, continuo aqui para ajudar.';metricEvents=['compra_confirmada','link_enviado'];startUpsell=true;purchasedProduct=p.product;state.stage='checkout_sent';state.awaiting='';state.lastProduct=p.product;state.pendingPurchase=null}intent='confirmar_compra'}
    else{text=optionsText();state.pendingPurchase=null;state.stage='awaiting_choice';state.awaiting='product_choice';intent='cancelar_confirmacao'}
  } else if(chosen){
    state.selectedProduct=chosen;state.lastProduct=chosen;state.produtoMencionado=chosen.title||'';state.stage='awaiting_purchase_intent';state.awaiting='purchase_intent';captureFields.push({field:'produto_selecionado',value:JSON.stringify(chosen)});metricEvents=['produto_selecionado'];intent='selecionar_produto';const versions=availableVersions(chosen);text='Você escolheu a Opção '+(results.indexOf(chosen)+1)+': '+chosen.title+'.'+(versions.length?' Disponível em '+versions.join(' e ')+'.':'')+' Deseja comprar este material?';
  } else if((buy||mode!=='both')&&(state.selectedProduct||state.lastProduct)){
    const product=state.selectedProduct||state.lastProduct;
    if(mode==='both'&&product.publicUrl&&product.plrUrl){state.stage='awaiting_version';state.awaiting='version';text='Você quer a versão final para uso próprio ou a versão PLR com licença de revenda?';intent='escolher_versao'}
    else {const p=pendingFor(product,mode);state.pendingPurchase=p;state.selectedVersion=p.mode;state.stage='confirming_purchase';state.awaiting='purchase_confirmation';captureFields.push({field:'compra_pendente',value:JSON.stringify(p)});text=confirmation(p);intent='confirmar_compra'}
  } else if(state.stage==='awaiting_purchase_intent'&&yes&&(state.selectedProduct||state.lastProduct)){
    const product=state.selectedProduct||state.lastProduct;if(product.publicUrl&&product.plrUrl){state.stage='awaiting_version';state.awaiting='version';text='Perfeito. Você quer a versão final para uso próprio ou a versão PLR com licença de revenda?'}else{const p=pendingFor(product,'both');state.pendingPurchase=p;state.stage='confirming_purchase';state.awaiting='purchase_confirmation';captureFields.push({field:'compra_pendente',value:JSON.stringify(p)});text=confirmation(p)}intent='confirmar_compra';
  } else if(buy&&results.length>1&&!state.selectedProduct&&!state.lastProduct){
    state.stage='awaiting_choice';state.awaiting='product_choice';text='Claro! Qual produto você quer comprar? Responda “Opção 1”, “Opção 2” ou “Opção 3”.';intent='selecionar_produto';
  } else if(form.submitted){
    state={...state,stage:'searching',awaiting:'',filterFormSubmitted:true};for(const [f,v] of Object.entries(form.values))setField(f,v);if(!state.tipoCompra)setField('tipoCompra','qualquer');const hasRange=Boolean(state.idade||state.anoEscolar),hasTopic=Boolean(state.disciplina||state.tema||state.habilidade||state.objetivo||(state.dataComemorativa&&!/^nao$/i.test(norm(state.dataComemorativa))));if(hasRange&&hasTopic){action='search';query=queryFor(state);metricEvents=['ficha_concluida'];intent='buscar_material'}else{state.stage='collecting';state.awaiting=!hasRange?'age_or_year':'theme';text='Ainda falta '+(!hasRange?'a idade ou o ano escolar':'o tema, conteúdo ou habilidade')+'. '+question(state.awaiting);intent='coletar_filtros'}
  } else if(state.stage==='collecting'&&/\b(instagram|facebook|tiktok|youtube|redes? sociais?|whatsapp|contato|site|link da loja|sobre a loja)\b/.test(current)){
    action='store_info';intent='informacao_loja';
  } else if(state.stage==='collecting'&&/^(oi|ola|opa|bom dia|boa tarde|boa noite|tudo bem)[!.? ]*$/.test(current)){
    text='Olá! Continuo aqui com você 😊 '+question(state.awaiting||'age_or_year');intent='saudacao';
  } else if(state.stage==='collecting'){
    const field=state.awaiting||'age_or_year';intent='coletar_filtros';
    if(field==='age_or_year'){const p=parseAgeYear(message);if(!p.idade&&!p.anoEscolar){text='Para pesquisar corretamente, preciso da idade ou do ano escolar. Exemplo: “6 anos” ou “1º ano”.'}else{for(const [f,v] of Object.entries(p))setField(f,v);state.awaiting='discipline';text=question('discipline')}}
    else if(field==='discipline'){setField('disciplina',/^(qualquer|tanto faz|nao sei)$/.test(current)?'qualquer':message);state.awaiting='theme';text=question('theme')}
    else if(field==='theme'){if(message.length<2)text='Informe um tema, conteúdo ou habilidade. Exemplo: sílabas, emoções, matemática ou coordenação motora.';else{setField('tema',message);state.awaiting='date';text=question('date')}}
    else if(field==='date'){setField('dataComemorativa',/^(nao|nenhuma|nao e)$/.test(current)?'não':message);state.awaiting='version';text=question('version')}
    else if(field==='version'){const version=/\b(plr|revenda)\b/.test(current)?'plr':/\b(final|uso pessoal)\b/.test(current)?'final':/\b(qualquer|tanto faz|ambas)\b/.test(current)?'qualquer':'';if(!version){text='Responda “final”, “PLR” ou “qualquer”, por favor.'}else{setField('tipoCompra',version);state.stage='searching';state.awaiting='';state.filterFormSubmitted=true;action='search';query=queryFor(state);metricEvents=['ficha_concluida'];text=''}}
  } else if(state.stage==='adjusting_filters'){
    intent='ajustar_filtros';const line=parseForm(message);let changed=false;if(line.labels){for(const[f,v]of Object.entries(line.values)){setField(f,v);changed=true}}else{const age=parseAgeYear(message);if(age.idade||age.anoEscolar){for(const[f,v]of Object.entries(age))setField(f,v);changed=true}else if(/\b(final|plr|revenda|qualquer)\b/.test(current)){setField('tipoCompra',/plr|revenda/.test(current)?'plr':/final/.test(current)?'final':'qualquer');changed=true}else if(message.length>2&&/\b(tema|conteudo|disciplina|habilidade|data)\b/.test(current)){const m=message.match(/(?:tema|conteúdo|conteudo|disciplina|habilidade|data comemorativa)\s*[:=-]?\s*(.+)$/i);if(m){setField(/disciplina/i.test(message)?'disciplina':/habilidade/i.test(message)?'habilidade':/data/i.test(message)?'dataComemorativa':'tema',m[1]);changed=true}}}if(changed){state.stage='searching';state.awaiting='';action='search';query=queryFor(state);text=''}else{text='Diga somente o campo que deseja mudar. Exemplo: “Tema: alfabetização” ou “Idade: 7 anos”.'}
  } else {
    const greeting=/^(oi|ola|opa|bom dia|boa tarde|boa noite|tudo bem|oi tudo bem)[!.? ]*$/.test(current);
    const guidance=/\b(me ajuda|me ajude|pode me ajudar|ajudar a escolher|ajudar a encontrar|quero um material|preciso de um material|procuro um material|busco um material|quais materiais|que tipo de material)\b/.test(current);
    const detail=state.lastProduct&&/\b(preco|valor|plr|pdf|amostra|paginas?|detalhes?|como funciona)\b/.test(current);
    const store=/\b(instagram|facebook|tiktok|youtube|redes? sociais?|whatsapp|contato|site|link da loja|sobre a loja)\b/.test(current);
    const count=/\b(quantos?|quantidade|total)\b.*\b(materia(?:l|is)|produtos?|atividades?)\b/.test(current);
    if(guidance){state={...state,idade:'',anoEscolar:'',disciplina:'',tema:'',habilidade:'',objetivo:'',dataComemorativa:'',tipoCompra:'',produtoMencionado:'',stage:'collecting',awaiting:'age_or_year',startedAt:now};metricEvents=['ficha_iniciada'];text='Claro! Eu sou '+agent+' e vou te ajudar. '+question('age_or_year')+'\n\n'+formTemplate();intent='iniciar_ficha'}
    else if(detail){action='detail';query=state.lastProduct.title||state.produtoMencionado;intent='detalhe_produto'}
    else if(store){action='store_info';intent='informacao_loja'}
    else if(count){action='count';intent='contar_catalogo'}
    else if(greeting){text='Olá! Eu sou '+agent+' 😊 Posso ajudar você a encontrar um material pedagógico ou tirar uma dúvida.';intent='saudacao'}
    else{text=clean(interpreted.reply)||'Entendi 😊 Posso responder sua dúvida ou ajudar a encontrar um material. O que você precisa?';intent='conversa'}
  }
}
if(action==='search'&&!query)query=queryFor(state);
if(state.tipoCompra==='plr')section='plr';else if(state.tipoCompra==='final')section='products';
state.lastIntent=intent;state.lastUserMessage=message;state.lastBotAction=action;state.lastSearchQuery=query||state.lastSearchQuery;
return {json:{action,text,imageUrl:'',hasImage:false,query,section,state,stateJson:JSON.stringify(state),currentMessage:message,intent,stage:state.stage,awaiting:state.awaiting,sessionId,captureFields,metricEvents,resetSession,startUpsell,purchasedProduct}};
} catch(error) {
  return {json:{action:'reply',text:'Recebi sua mensagem e continuo aqui para ajudar 😊 Pode repetir com outras palavras?',imageUrl:'',hasImage:false,query:'',section:'all',state:{},stateJson:'{}',intent:'recuperacao',stage:'idle',awaiting:'',sessionId:'',captureFields:[],metricEvents:[],resetSession:false,startUpsell:false,validationRecovered:true,errorMessage:String(error.message||error)}};
}`;
node('Validar e mesclar filtros').parameters.jsCode = validatorCode;

const formatterCode = String.raw`try{
function clean(v){return String(v??'').replace(/\*+/g,'').replace(/^#{1,6}\s*/gm,'').replace(/[\x60]+/g,'').trim()}
function money(v){if(v===null||v===undefined||v==='')return'';if(typeof v==='number')return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});const s=String(v).trim();return /^R\$/.test(s)?s:'R$ '+s}
function validImage(v){if(typeof v!=='string')return'';const u=v.trim();return /^https:\/\/[^\s]+$/i.test(u)?u:''}
function imageOf(i){for(const c of [i?.whatsapp?.imageUrl,i?.coverUrl,i?.imageUrl,i?.thumbnailUrl,i?.image,i?.plr?.whatsapp?.imageUrl]){const u=validImage(c);if(u)return u}return''}
function unwrap(v){if(!v||typeof v!=='object')return{};if(v.body&&typeof v.body==='object')return v.body;if(v.data&&typeof v.data==='object'&&!Array.isArray(v.data))return v.data;return v}
function allItems(p){const out=[],seen=new Set();for(const k of ['products','plrProducts','freeMaterials','kits','clubs'])for(const i of Array.isArray(p[k])?p[k]:[]){const id=String(i.id||i.publicUrl||i.title||i.name||'');if(id&&!seen.has(id)){seen.add(id);out.push(i)}}return out}
function summary(i){return{id:String(i.id||''),title:clean(i.title||i.name),description:clean(i.description||i.whatsapp?.message||''),price:i.price??'',publicUrl:String(i.publicUrl||''),coverUrl:imageOf(i),isPlr:Boolean(i.isPlr||i.plr),plrPrice:i.plr?.price??i.plrPrice??'',plrUrl:String(i.plr?.publicUrl||i.plrUrl||''),previewUrl:String(i.previewUrl||''),discipline:String(i.discipline||i.disciplina||''),schoolYear:String(i.schoolYear||i.anoEscolar||''),age:String(i.age||i.idade||'')}}
function productText(item,index){const official=clean(item?.whatsapp?.message||item?.plr?.whatsapp?.message||''),description=clean(item.description||''),parts=['📚 OPÇÃO '+(index+1),'📘 '+clean(item.title||item.name)];let body=official||description;if(body){body=body.replace(/https?:\/\/\S+/gi,'').replace(/🛒[^\n]*/gi,'').replace(/\n{3,}/g,'\n\n').trim();if(body)parts.push(body)}if(item.price!=null)parts.push('💰 Versão final: '+money(item.price));if(item.isPlr||item.plr||item.plrUrl)parts.push('♻️ Versão PLR: '+money(item.plr?.price??item.plrPrice));parts.push('Para escolher, responda “Opção '+(index+1)+'”.');return parts.join('\n\n')}
const payload=unwrap($json),source=$('Validar e mesclar filtros').item.json,action=String(source.action||'search'),items=allItems(payload),state={...(source.state||{})};
function done(data){return{json:{text:'',imageUrl:'',hasImage:false,deliveries:[],followUpText:'',found:true,needsBroadSearch:false,suggested:false,metricEvents:[],sessionId:source.sessionId,...data,state,stateJson:JSON.stringify(state)}}}
if(action==='store_info'){const store=payload.store||{},asked=clean(source.currentMessage).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),social=store.socialNetworks||{};let text='';if(asked.includes('instagram'))text=social.instagram?'Instagram da loja: '+social.instagram:'A loja ainda não cadastrou um Instagram.';else if(asked.includes('facebook'))text=social.facebook?'Facebook da loja: '+social.facebook:'A loja ainda não cadastrou um Facebook.';else if(asked.includes('tiktok'))text=social.tiktok?'TikTok da loja: '+social.tiktok:'A loja ainda não cadastrou um TikTok.';else if(asked.includes('youtube'))text=social.youtube?'YouTube da loja: '+social.youtube:'A loja ainda não cadastrou um canal no YouTube.';else if(asked.includes('whatsapp')||asked.includes('contato'))text=store.contact?.whatsapp?'WhatsApp para atendimento: '+store.contact.whatsapp:'O WhatsApp da loja ainda não foi informado.';else text=[store.name,store.description,store.publicUrl].filter(Boolean).join('\n\n')||'As informações da loja ainda não foram cadastradas.';return done({text:text+' 😊'})}
if(action==='count'){const c=payload.counts||{},p=Number(c.products||0),plr=Number(c.plrProducts||0),free=Number(c.freeMaterials||0);return done({text:'A loja possui '+p+' produtos publicados'+(plr?', '+plr+' opções com PLR':'')+(free?' e '+free+' materiais gratuitos':'')+'. Posso iniciar uma busca guiada para você 😊'})}
if(action==='detail'){let item=state.lastProduct?items.find(i=>String(i.id)===String(state.lastProduct.id))||items.find(i=>clean(i.title||i.name)===clean(state.lastProduct.title)):null;item=item||items[0];if(!item)return done({text:'Não consegui recuperar os detalhes desse produto. Diga o nome dele e eu tento novamente 😊',found:false});const asked=clean(source.currentMessage).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();let text='';if(/pdf|amostra/.test(asked))text=item.previewUrl?'PDF de amostra: '+item.previewUrl:'Este material não possui PDF de amostra cadastrado.';else if(/plr|revenda/.test(asked))text=item.isPlr||item.plr?'Versão PLR: '+money(item.plr?.price??item.plrPrice):'Este material não possui versão PLR.';else if(/preco|valor|quanto custa/.test(asked))text='Versão final: '+money(item.price)+(item.isPlr||item.plr?'\nVersão PLR: '+money(item.plr?.price??item.plrPrice):'');else if(/pagina/.test(asked))text=item.pageCount?'O material possui '+item.pageCount+' páginas.':'A quantidade de páginas não foi cadastrada.';else text=clean(item.description||item.whatsapp?.message||'Posso explicar o preço, a versão PLR ou o PDF de amostra.');return done({text})}
if((action==='search'||action==='list')&&!items.length){state.stage='adjusting_filters';state.awaiting='adjust_field';return done({text:'Não encontrei um material exatamente com esses dados, mas vamos ajustar sem começar tudo de novo 😊\n\nQual informação você quer mudar? Envie, por exemplo:\nTema: alfabetização\nDisciplina: português\nIdade: 7 anos\nVersão: qualquer',found:false,metricEvents:['resultado_vazio']})}
if(action==='search'||action==='list'){const seen=new Set(Array.isArray(state.seenProductIds)?state.seenProductIds.map(String):[]),available=state.moreResults?items.filter(item=>!seen.has(String(item.id||item.publicUrl||item.title||item.name||''))):items;if(state.moreResults&&!available.length){state.stage='awaiting_choice';state.awaiting='product_choice';return done({text:'Já mostrei todas as opções encontradas. Se quiser outro material, diga “nova busca”.',found:false,metricEvents:['resultado_vazio']})}const selected=available.slice(0,3),total=selected.length;const deliveries=selected.map((item,index)=>({kind:'product',text:productText(item,index),imageUrl:imageOf(item),hasImage:Boolean(imageOf(item)),productIndex:index+1,title:clean(item.title||item.name)}));state.lastResults=selected.map(summary);state.seenProductIds=[...new Set([...seen,...state.lastResults.map(item=>String(item.id||item.publicUrl||item.title))])].slice(-30);state.lastProduct=state.lastResults.length===1?state.lastResults[0]:null;state.selectedProduct=state.lastResults.length===1?state.lastResults[0]:null;state.pendingPurchase=null;state.stage=state.lastResults.length>1?'awaiting_choice':'awaiting_purchase_intent';state.awaiting=state.lastResults.length>1?'product_choice':'purchase_intent';const followUpText=total===1?'Encontrei esta opção com os filtros informados. É o que você procura? Responda “sim”, “não” ou “nova busca” 😊':'Encontrei '+total+' opções. Responda “Opção 1”, “Opção 2” ou “Opção 3”. Se nenhuma servir, diga “nova busca” 😊';return done({deliveries,followUpText,found:true,metricEvents:['resultado_encontrado']})}
return done({text:'Estou aqui para continuar o atendimento 😊 O que você gostaria de saber?'});
}catch(error){return{json:{text:'A consulta teve uma inconsistência, mas o atendimento continua 😊 Diga “nova busca” para tentarmos novamente.',imageUrl:'',hasImage:false,deliveries:[],followUpText:'',found:false,needsBroadSearch:false,state:{},stateJson:'{}',metricEvents:[],formatRecovered:true,errorMessage:String(error.message||error)}}}`;
node('Formatar resultado oficial').parameters.jsCode = formatterCode;

// Consolida a classificação do Gemini/Groq com regras locais. Assim uma falha do modelo
// não impede o reinício, e uma resposta válida do modelo também é respeitada.
const resetClassifier=codeNode('Classificar reinício com IA e regras',String.raw`function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim()}function parse(v){if(v&&typeof v==='object')return v;try{const c=String(v||'').replace(/[\x60]{3}json/gi,'').replace(/[\x60]{3}/g,'').trim();const a=c.indexOf('{'),b=c.lastIndexOf('}');return JSON.parse(a>=0&&b>a?c.slice(a,b+1):c)}catch{return{}}}const interpreted=parse($json.output??$json.text??{}),message=norm($('message').item.json.message||''),patterns=['quero outro','quero outra','outro produto','outro material','outra atividade','voltar ao inicio','recomecar','comecar de novo','nova busca','nova pesquisa','nao gostei','nenhuma opcao','nenhum deles','nenhuma delas','tem mais','mostrar outros','mostre outros','trocar filtros','mudar filtros','pesquisar novamente'];const byModel=interpreted.reset===true||String(interpreted.intencao||'')==='reiniciar_busca';const byRules=patterns.some(p=>message.includes(p));return{json:{...$json,resetIntent:byModel||byRules,resetSource:byModel?'modelo':byRules?'regra':'nenhum'}};`,[2320,-80]);
w.nodes.push(resetClassifier);
for(const from of ['Interpretar pedido e filtros','Adaptar resposta da Groq','Interpretação local de emergência']){
  const conn=w.connections[from];if(!conn?.main)continue;for(const outputs of conn.main)for(const c of outputs)if(c.node==='Validar e mesclar filtros')c.node='Classificar reinício com IA e regras';
}
const needsAi=w.connections['Precisa de IA?'];if(needsAi?.main?.[1])for(const c of needsAi.main[1])if(c.node==='Validar e mesclar filtros')c.node='Classificar reinício com IA e regras';
setConnections('Classificar reinício com IA e regras', [['Validar e mesclar filtros']]);

// O catálogo ampliado aleatório é desativado. Resultado vazio volta para ajuste humano dos filtros.
node('Precisa ampliar a busca?').parameters.conditions.conditions[0].leftValue = '={{ false }}';

// Inserção sequencial da limpeza de consulta antes de qualquer novo estado ser salvo.
const resetIf = ifNode('Reinício solicitado?', '={{ Boolean($json.resetSession) }}', [3060, -20]);
const resetSuffixes = ['idade','anoEscolar','disciplina','tema','habilidade','objetivo','dataComemorativa','tipoCompra','produto_selecionado','compra_pendente','meta','timestamp'];
const resetNodes = resetSuffixes.map((suffix, i) => redisDelete(`Limpar consulta ${i+1}`, suffix, [3260+i*150, 360]));
const continueNode = codeNode('Continuar após limpeza', "return {json:$json};", [3260, -20]);
w.nodes.push(resetIf, ...resetNodes, continueNode);
setConnections('Restaurar decisão após conferência', [['Reinício solicitado?']]);
setConnections('Reinício solicitado?', [[resetNodes[0].name], ['Continuar após limpeza']]);
for (let i=0;i<resetNodes.length-1;i++) setConnections(resetNodes[i].name, [[resetNodes[i+1].name]]);
setConnections(resetNodes.at(-1).name, [['Continuar após limpeza']]);
setConnections('Continuar após limpeza', [['Salvar filtros do cliente','Filtros completos?','Registrar evento de atendimento','Preparar campos individuais','Salvar metadados da consulta','Preparar métricas da decisão','Iniciar upsell?']]);

const prepareFields = codeNode('Preparar campos individuais', String.raw`const src=$json;const list=Array.isArray(src.captureFields)?src.captureFields:[];return list.filter(x=>x&&x.field&&String(x.value??'')!=='').map(x=>({json:{sessionId:src.sessionId,field:String(x.field),value:typeof x.value==='string'?x.value:JSON.stringify(x.value)}}));`, [3460, 500], 'runOnceForAllItems');
const saveField = redisSet('Salvar campo individual', "={{ 'consulta_' + $json.sessionId + '_' + $json.field }}", '={{ $json.value }}', [3680, 500]);
const saveMeta = redisSet('Salvar metadados da consulta', "={{ 'consulta_' + $json.sessionId + '_meta' }}", "={{ JSON.stringify({ sessionId: $json.sessionId, instance: $('dados').item.json.instance, remoteJid: $('dados').item.json.remotejid, state: $json.state, awaiting: $json.awaiting, updatedAt: $now.toISO(), reminderPending: false }) }}", [3460, 620]);
const saveTimestamp = redisSet('Salvar timestamp da consulta', "={{ 'consulta_' + $json.sessionId + '_timestamp' }}", '={{ $now.toISO() }}', [3680, 620]);
w.nodes.push(prepareFields, saveField, saveMeta, saveTimestamp);
setConnections('Preparar campos individuais', [['Salvar campo individual']]);
setConnections('Salvar metadados da consulta', [['Salvar timestamp da consulta']]);

const prepareMetricsCode = String.raw`const src=$json;const events=Array.isArray(src.metricEvents)?src.metricEvents:[];return events.map(event=>({json:{event,sessionId:src.sessionId||String($('dados').item.json.instance||'')+':'+String($('dados').item.json.remotejid||''),instance:$('dados').item.json.instance,remoteJid:$('dados').item.json.remotejid,messageId:$('dados').item.json.id,at:new Date().toISOString(),stage:src.stage||src.state?.stage||'',filters:{idade:src.state?.idade||'',anoEscolar:src.state?.anoEscolar||'',disciplina:src.state?.disciplina||'',tema:src.state?.tema||'',dataComemorativa:src.state?.dataComemorativa||'',tipoCompra:src.state?.tipoCompra||''}}}));`;
const prepareMetrics = codeNode('Preparar métricas da decisão', prepareMetricsCode, [3460, 740], 'runOnceForAllItems');
const metricPush = {
  id: uid('Registrar métrica de conversão'), name:'Registrar métrica de conversão', type:'n8n-nodes-base.redis', typeVersion:1, position:[3680,740],
  parameters:{operation:'push',list:'educalizando:metricas:v16',messageData:'={{ JSON.stringify($json) }}',tail:true},credentials:redisCred,retryOnFail:true,maxTries:3,waitBetweenTries:300,onError:'continueRegularOutput'
};
const prepareResultMetrics = codeNode('Preparar métricas do resultado', prepareMetricsCode, [3320, -420], 'runOnceForAllItems');
const resultMetricPush = JSON.parse(JSON.stringify(metricPush));resultMetricPush.id=uid('Registrar métrica do resultado');resultMetricPush.name='Registrar métrica do resultado';resultMetricPush.position=[3540,-420];
w.nodes.push(prepareMetrics,metricPush,prepareResultMetrics,resultMetricPush);
setConnections('Preparar métricas da decisão', [['Registrar métrica de conversão']]);
connect('Formatar resultado oficial','Preparar métricas do resultado');
setConnections('Preparar métricas do resultado', [['Registrar métrica do resultado']]);

// Upsell após cinco minutos, somente depois de uma confirmação real.
const upsellIf=ifNode('Iniciar upsell?', '={{ Boolean($json.startUpsell && $json.purchasedProduct) }}', [3460,860]);
const waitUpsell={id:uid('Aguardar 5 minutos para upsell'),name:'Aguardar 5 minutos para upsell',type:'n8n-nodes-base.wait',typeVersion:1.1,position:[3680,860],parameters:{amount:5,unit:'minutes'}};
const upsellRequest=JSON.parse(JSON.stringify(node('Consultar API da loja')));upsellRequest.id=uid('Consultar produto relacionado');upsellRequest.name='Consultar produto relacionado';upsellRequest.position=[3900,860];upsellRequest.parameters.queryParameters.parameters[0].value="={{ $json.state?.disciplina || $json.state?.tema || $json.purchasedProduct?.discipline || $json.purchasedProduct?.title || '' }}";upsellRequest.parameters.queryParameters.parameters[1].value='all';
const chooseUpsell=codeNode('Selecionar upsell relacionado',String.raw`function unwrap(v){if(v?.body&&typeof v.body==='object')return v.body;if(v?.data&&typeof v.data==='object'&&!Array.isArray(v.data))return v.data;return v||{}}function image(i){return String(i?.whatsapp?.imageUrl||i?.coverUrl||i?.imageUrl||'')}const p=unwrap($json),src=$('Validar e mesclar filtros').item.json,bought=src.purchasedProduct||{},all=['products','plrProducts'].flatMap(k=>Array.isArray(p[k])?p[k]:[]),item=all.find(x=>String(x.id||'')!==String(bought.id||'')&&String(x.title||x.name||'')!==String(bought.title||''));if(!item)return[];const link=String(item.publicUrl||item.plr?.publicUrl||item.plrUrl||'');const text='Talvez você também goste de: '+String(item.title||item.name||'outro material')+'.'+(link?'\n\nVeja aqui:\n'+link:'');return[{json:{text,imageUrl:image(item),hasImage:Boolean(image(item))}}];`,[4120,860],'runOnceForAllItems');
const upsellHasImage=ifNode('Upsell tem capa?','={{ Boolean($json.hasImage) }}',[4340,860]);
const sendUpsellImage=JSON.parse(JSON.stringify(node('Enviar produto com capa')));sendUpsellImage.id=uid('Enviar upsell com capa');sendUpsellImage.name='Enviar upsell com capa';sendUpsellImage.position=[4560,800];
const sendUpsellText=JSON.parse(JSON.stringify(node('Enviar texto')));sendUpsellText.id=uid('Enviar upsell em texto');sendUpsellText.name='Enviar upsell em texto';sendUpsellText.position=[4560,920];
w.nodes.push(upsellIf,waitUpsell,upsellRequest,chooseUpsell,upsellHasImage,sendUpsellImage,sendUpsellText);
setConnections('Iniciar upsell?', [['Aguardar 5 minutos para upsell'],[]]);
setConnections('Aguardar 5 minutos para upsell', [['Consultar produto relacionado']]);
setConnections('Consultar produto relacionado', [['Selecionar upsell relacionado'],[]]);
setConnections('Selecionar upsell relacionado', [['Upsell tem capa?']]);
setConnections('Upsell tem capa?', [['Enviar upsell com capa'],['Enviar upsell em texto']]);

// Métrica de resultados e metadados atualizados depois que o catálogo altera o estado.
connect('Formatar resultado oficial','Salvar metadados após resultado');
const saveResultMeta=redisSet('Salvar metadados após resultado',"={{ 'consulta_' + ($json.sessionId || $('Validar e mesclar filtros').item.json.sessionId) + '_meta' }}","={{ JSON.stringify({ sessionId: $json.sessionId || $('Validar e mesclar filtros').item.json.sessionId, instance: $('dados').item.json.instance, remoteJid: $('dados').item.json.remotejid, state: $json.state, awaiting: $json.state?.awaiting || '', updatedAt: $now.toISO(), reminderPending: false }) }}",[3540,-520]);
w.nodes.push(saveResultMeta);

// Mantém o log técnico e acrescenta sessionId/eventos de conversão.
node('Registrar evento de atendimento').parameters.list='educalizando:events:v16';
node('Registrar evento de atendimento').parameters.messageData="={{ JSON.stringify({ at: $now.toISO(), executionId: $execution.id, messageId: $('dados').item.json.id, sessionId: $json.sessionId, instance: $('dados').item.json.instance, remoteJid: $('dados').item.json.remotejid, action: $json.action, intent: $json.intent, stage: $json.stage, awaiting: $json.awaiting, query: $json.query || '', recovered: Boolean($json.validationRecovered) }) }}";

fs.writeFileSync(output, JSON.stringify(w, null, 2));

// Workflow independente de abandono. Ele lê as sessões V16, envia um lembrete após 60 minutos
// e remove as chaves conhecidas depois de 24 horas sem retomada.
const abandonment = {
  name:'RECUPERADOR DE ATENDIMENTOS V16',
  nodes:[
    {id:uid('A cada 30 minutos'),name:'A cada 30 minutos',type:'n8n-nodes-base.scheduleTrigger',typeVersion:1.2,position:[-900,0],parameters:{rule:{interval:[{field:'minutes',minutesInterval:30}]}}},
    {id:uid('Listar consultas abertas'),name:'Listar consultas abertas',type:'n8n-nodes-base.redis',typeVersion:1,position:[-680,0],parameters:{operation:'keys',keyPattern:'consulta_*_meta',getValues:true},credentials:redisCred,retryOnFail:true,maxTries:3,waitBetweenTries:500,onError:'continueRegularOutput'},
    codeNode('Analisar consultas inativas',String.raw`const input=$input.first()?.json||{},now=Date.now(),out=[];for(const [key,raw] of Object.entries(input)){if(!key.startsWith('consulta_')||!key.endsWith('_meta'))continue;let meta={};try{meta=typeof raw==='string'?JSON.parse(raw):raw||{}}catch{continue}const updated=Date.parse(meta.updatedAt||0),reminded=Date.parse(meta.reminderSentAt||0);if(!updated)continue;const age=now-updated;if(reminded&&now-reminded>=24*60*60*1000)out.push({json:{...meta,metaKey:key,action:'expire'}});else if(!reminded&&age>=60*60*1000)out.push({json:{...meta,metaKey:key,action:'remind'}})}return out;`,[-460,0],'runOnceForAllItems'),
    ifNode('Expirou 24 horas?','={{ $json.action === "expire" }}',[-240,0]),
    codeNode('Preparar limpeza da sessão',String.raw`const s=String($json.sessionId||'');const suffixes=['idade','anoEscolar','disciplina','tema','habilidade','objetivo','dataComemorativa','tipoCompra','produto_selecionado','compra_pendente','meta','timestamp'];return suffixes.map(suffix=>({json:{key:'consulta_'+s+'_'+suffix}}));`,[0,-140],'runOnceForAllItems'),
    {id:uid('Excluir chave expirada'),name:'Excluir chave expirada',type:'n8n-nodes-base.redis',typeVersion:1,position:[220,-140],parameters:{operation:'delete',key:'={{ $json.key }}'},credentials:redisCred,retryOnFail:true,maxTries:3,waitBetweenTries:300,onError:'continueRegularOutput'},
    codeNode('Preparar lembrete de abandono',String.raw`const meta={...$json,reminderSentAt:new Date().toISOString(),reminderPending:true};meta.state={...(meta.state||{}),reminderPending:true};const year=meta.state.anoEscolar||meta.state.idade||'o material que você procura';const questions={age_or_year:'Para qual idade ou ano escolar você procura?',discipline:'Qual disciplina você quer trabalhar?',theme:'Qual tema, conteúdo ou habilidade você quer trabalhar?',date:'É para alguma data comemorativa?',version:'Você procura versão final, PLR ou qualquer uma?'};return{json:{...meta,message:'Olá! Quer continuar procurando um material para '+year+'? Responda “sim” e eu continuo da última pergunta 😊',resumeQuestion:questions[meta.state.awaiting]||questions.age_or_year,stateJson:JSON.stringify(meta.state),metaJson:JSON.stringify(meta)}};`,[0,100]),
    redisSet('Salvar estado aguardando retomada',"={{ 'educalizando:filtros:v16:' + $json.instance + ':' + $json.remoteJid }}",'={{ $json.stateJson }}',[220,100]),
    redisSet('Atualizar metadados do lembrete','={{ $json.metaKey }}','={{ $json.metaJson }}',[440,100]),
    {id:uid('Enviar lembrete de continuação'),name:'Enviar lembrete de continuação',type:'n8n-nodes-evolution-api.evolutionApi',typeVersion:1,position:[660,100],parameters:{resource:'messages-api',instanceName:'={{ $json.instance }}',remoteJid:'={{ $json.remoteJid }}',messageText:'={{ $json.message }}',options_message:{linkPreview:false}},credentials:evolutionCred,retryOnFail:true,maxTries:3,waitBetweenTries:900,onError:'continueRegularOutput'},
    {id:uid('Registrar abandono detectado'),name:'Registrar abandono detectado',type:'n8n-nodes-base.redis',typeVersion:1,position:[880,100],parameters:{operation:'push',list:'educalizando:metricas:v16',messageData:'={{ JSON.stringify({ event: "abandono_detectado", sessionId: $json.sessionId, instance: $json.instance, remoteJid: $json.remoteJid, at: $now.toISO() }) }}',tail:true},credentials:redisCred,retryOnFail:true,maxTries:3,waitBetweenTries:300,onError:'continueRegularOutput'},
  ],
  connections:{
    'A cada 30 minutos':{main:[[{node:'Listar consultas abertas',type:'main',index:0}]]},
    'Listar consultas abertas':{main:[[{node:'Analisar consultas inativas',type:'main',index:0}]]},
    'Analisar consultas inativas':{main:[[{node:'Expirou 24 horas?',type:'main',index:0}]]},
    'Expirou 24 horas?':{main:[[{node:'Preparar limpeza da sessão',type:'main',index:0}],[{node:'Preparar lembrete de abandono',type:'main',index:0}]]},
    'Preparar limpeza da sessão':{main:[[{node:'Excluir chave expirada',type:'main',index:0}]]},
    'Preparar lembrete de abandono':{main:[[{node:'Salvar estado aguardando retomada',type:'main',index:0}]]},
    'Salvar estado aguardando retomada':{main:[[{node:'Atualizar metadados do lembrete',type:'main',index:0}]]},
    'Atualizar metadados do lembrete':{main:[[{node:'Enviar lembrete de continuação',type:'main',index:0}]]},
    'Enviar lembrete de continuação':{main:[[{node:'Registrar abandono detectado',type:'main',index:0}],[]]},
  },
  pinData:{},settings:{executionOrder:'v1'},active:false,versionId:uid('abandonment-version'),meta:{templateCredsSetupCompleted:true},tags:[]
};
fs.writeFileSync(abandonmentOutput, JSON.stringify(abandonment,null,2));

const messageRecovery=JSON.parse(fs.readFileSync(path.join(root,'RECUPERADOR DE MENSAGENS V15.json'),'utf8'));
messageRecovery.name='RECUPERADOR DE MENSAGENS V16';
let messageRecoverySerialized=JSON.stringify(messageRecovery)
  .replaceAll('educalizando:outbox:v15','educalizando:outbox:v16')
  .replaceAll('educalizando:mensagem:v15:','educalizando:mensagem:v16:');
fs.writeFileSync(messageRecoveryOutput,JSON.stringify(JSON.parse(messageRecoverySerialized),null,2));
console.log(`Gerados:\n- ${path.basename(output)} (${w.nodes.length} nós)\n- ${path.basename(messageRecoveryOutput)} (${messageRecovery.nodes.length} nós)\n- ${path.basename(abandonmentOutput)} (${abandonment.nodes.length} nós)`);
