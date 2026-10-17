const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const source=path.join(root,'ATENDENTE EDUCALIZANDO V18.1.json');
const output=path.join(root,'ATENDENTE EDUCALIZANDO V18.2.json');
const w=JSON.parse(fs.readFileSync(source,'utf8'));
w.name='ATENDENTE EDUCALIZANDO V18.2';
const node=name=>{const found=w.nodes.find(n=>n.name===name);if(!found)throw new Error('Nó ausente: '+name);return found};
const uid=name=>{const h=crypto.createHash('sha1').update('v18.2:'+name).digest('hex').slice(0,32);return`${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`};
const redisCred=JSON.parse(JSON.stringify(node('Buscar filtros do cliente').credentials));
const code=(name,jsCode,position,mode='runOnceForEachItem')=>({id:uid(name),name,type:'n8n-nodes-base.code',typeVersion:2,position,parameters:{mode,language:'javaScript',jsCode}});
const redisGet=(name,key,propertyName,position)=>({id:uid(name),name,type:'n8n-nodes-base.redis',typeVersion:1,position,parameters:{operation:'get',propertyName,key,options:{}},credentials:redisCred,retryOnFail:true,maxTries:3,waitBetweenTries:300,onError:'continueRegularOutput'});
const redisSet=(name,key,value,position,ttl)=>({id:uid(name),name,type:'n8n-nodes-base.redis',typeVersion:1,position,parameters:{operation:'set',key,value,keyType:'string',expire:true,ttl},credentials:redisCred,retryOnFail:true,maxTries:3,waitBetweenTries:300,onError:'continueRegularOutput'});
const setConn=(from,outputs)=>w.connections[from]={main:outputs.map(group=>group.map(name=>({node:name,type:'main',index:0})))};
const replace=(value,from,to,label)=>{if(!value.includes(from))throw new Error('Trecho ausente: '+label);return value.replace(from,to)};

// BUG 5: classificar o tipo pela presença dos campos, sempre testando texto antes de áudio.
const dataAssignments=node('dados').parameters.assignments.assignments;
const setAssignment=(name,value,type)=>{const item=dataAssignments.find(x=>x.name===name);if(!item)throw new Error('Campo ausente em dados: '+name);item.value=value;if(type)item.type=type};
setAssignment('conversation',"={{ $json.body.data?.message?.conversation || $json.body.data?.message?.extendedTextMessage?.text || $json.body.message?.conversation || $json.body.message?.extendedTextMessage?.text || $json.body.data?.message?.imageMessage?.caption || $json.body.data?.message?.videoMessage?.caption || '' }}");
setAssignment('rawMessage','={{ $json.body.data?.message || $json.body.message || {} }}','object');
setAssignment('mensageType',"={{ $json.body.data?.messageType || $json.body.messageType || '' }}");
if(!dataAssignments.some(x=>x.name==='numeroLimpo'))dataAssignments.push({id:uid('numeroLimpo'),name:'numeroLimpo',value:"={{ String($json.body.data?.key?.remoteJid || '').replace(/@s\\.whatsapp\\.net$/i, '').replace(/[^0-9]/g, '') }}",type:'string'});
node('dados').parameters.assignments.assignments.find(x=>x.name==='flowVersion').value='V18.2';

const classifyType=code('Classificar tipo da mensagem',String.raw`function unwrap(v){let m=v&&typeof v==='object'?v:{};for(let i=0;i<6;i++){const n=m.ephemeralMessage?.message||m.viewOnceMessage?.message||m.viewOnceMessageV2?.message||m.viewOnceMessageV2Extension?.message||m.documentWithCaptionMessage?.message||m.editedMessage?.message;if(!n||typeof n!=='object')break;m=n}return m}const message=unwrap($json.rawMessage||{});let messageRoute='DESCONHECIDO';if(typeof message.conversation==='string'||typeof message.extendedTextMessage?.text==='string')messageRoute='TEXTO';else if(message.audioMessage)messageRoute='AUDIO';else if(message.imageMessage)messageRoute='IMAGEM';else if(message.documentMessage)messageRoute='DOCUMENTO';return{json:{...$json,messageRoute,messageReceived:message}};`,[1660,-300]);
const logType=redisSet('Registrar debug do tipo recebido',"={{ 'educalizando:debug:tipo:' + $('dados').item.json.instance + ':' + $('dados').item.json.remotejid }}","={{ JSON.stringify({ at: $now.toISO(), messageId: $('dados').item.json.id, route: $json.messageRoute, message: $json.messageReceived }) }}",[1880,-300],300);
const condition=(route)=>({conditions:{options:{caseSensitive:true,leftValue:'',typeValidation:'strict',version:3},conditions:[{id:uid('switch '+route),leftValue:'={{ $json.messageRoute }}',rightValue:route,operator:{type:'string',operation:'equals'}}],combinator:'and'},renameOutput:true,outputKey:route});
const typeSwitch={id:uid('Switch tipo de mensagem'),name:'Switch tipo de mensagem',type:'n8n-nodes-base.switch',typeVersion:3.2,position:[2100,-300],parameters:{rules:{values:[condition('TEXTO'),condition('AUDIO'),condition('IMAGEM'),condition('DOCUMENTO')]},options:{fallbackOutput:'extra'}}};
const pass=(name,kind,pos,unknown=false)=>code(name,`return{json:{...$json,messageRoute:'${kind}',forceUnknownReply:${unknown}}};`,pos);
const textBranch=pass('Entrada TEXTO','TEXTO',[2320,-460]);
const audioBranch=pass('Entrada AUDIO','AUDIO',[2320,-380]);
const imageBranch=pass('Entrada IMAGEM','IMAGEM',[2320,-300]);
const documentBranch=pass('Entrada DOCUMENTO','DOCUMENTO',[2320,-220]);
const unknownBranch=pass('Entrada DESCONHECIDO','DESCONHECIDO',[2320,-140],true);
w.nodes.push(classifyType,logType,typeSwitch,textBranch,audioBranch,imageBranch,documentBranch,unknownBranch);
setConn('Sessão já iniciada?',[['Salvar sessão ativa por 24 horas'],['Marcar sessão iniciada por 24 horas']]);
setConn('Marcar sessão iniciada por 24 horas',[['Salvar sessão ativa por 24 horas']]);

// BUG 6 e BUG 4 reforçado: contexto ativo de 24h e perfil durável de 30 dias por número limpo.
const activeSession=redisSet('Salvar sessão ativa por 24 horas',"={{ 'sessao_' + $('dados').item.json.instance + ':' + $('dados').item.json.remotejid }}","={{ JSON.stringify({ instance: $('dados').item.json.instance, remoteJid: $('dados').item.json.remotejid, numero: $('dados').item.json.numeroLimpo, messageId: $('dados').item.json.id, updatedAt: $now.toISO() }) }}",[1600,-160],86400);
w.nodes.push(activeSession);
setConn('Salvar sessão ativa por 24 horas',[['Classificar tipo da mensagem']]);
setConn('Classificar tipo da mensagem',[['Registrar debug do tipo recebido']]);
setConn('Registrar debug do tipo recebido',[['Switch tipo de mensagem']]);
setConn('Switch tipo de mensagem',[[textBranch.name],[audioBranch.name],[imageBranch.name],[documentBranch.name],[unknownBranch.name]]);
for(const name of [textBranch.name,audioBranch.name,imageBranch.name,documentBranch.name,unknownBranch.name])setConn(name,[['Normalizar mensagem recebida']]);

let normalizer=node('Normalizar mensagem recebida').parameters.jsCode;
normalizer=replace(normalizer,`if (message.audioMessage || type === 'audioMessage') {
  isAudio = true;
  mediaKind = 'audio';
} else if (message.conversation) {
  text = String(message.conversation).trim();
} else if (message.extendedTextMessage?.text) {
  text = String(message.extendedTextMessage.text).trim();
} else if (message.imageMessage) {`,`if (message.conversation) {
  text = String(message.conversation).trim();
} else if (message.extendedTextMessage?.text) {
  text = String(message.extendedTextMessage.text).trim();
} else if (message.audioMessage || type === 'audioMessage') {
  isAudio = true;
  mediaKind = 'audio';
} else if (message.imageMessage) {`,'ordem texto antes de áudio');
node('Normalizar mensagem recebida').parameters.jsCode=normalizer;

const persistentProfile=redisGet('Buscar perfil persistente por número',"={{ 'perfil_numero_' + $('dados').item.json.numeroLimpo }}",'persistentProfile',[4160,-180]);
w.nodes.push(persistentProfile);
setConn('Buscar total de compras',[['Buscar perfil persistente por número']]);
setConn('Buscar perfil persistente por número',[['Buscar nome do cliente']]);
node('Salvar nome do cliente').parameters.ttl=86400;
const prepareProfile=code('Preparar perfil persistente do cliente',String.raw`function parse(v){try{return typeof v==='string'?JSON.parse(v||'{}'):(v||{})}catch{return{}}}const old=parse($('Buscar perfil persistente por número').item.json.persistentProfile),decision=$json,state=decision.state||{},history=parse($('Buscar histórico de compras').item.json.purchaseHistory),total=Number($('Buscar total de compras').item.json.purchaseTotal||old.totalCompras||0);return{json:{profileJson:JSON.stringify({...old,numero:$('dados').item.json.numeroLimpo,nome:state.customerName||old.nome||'',historico:history&&Object.keys(history).length?history:(old.historico||{}),totalCompras:total,ultimaDisciplina:state.disciplina||history.lastProduct?.discipline||history.lastProduct?.disciplina||old.ultimaDisciplina||'',updatedAt:new Date().toISOString()})}};`,[3980,1780]);
const saveProfile=redisSet('Salvar perfil persistente por 30 dias',"={{ 'perfil_numero_' + $('dados').item.json.numeroLimpo }}",'={{ $json.profileJson }}',[4200,1780],2592000);
const preparePurchaseProfile=code('Atualizar perfil persistente após compra',String.raw`function parse(v){try{return typeof v==='string'?JSON.parse(v||'{}'):(v||{})}catch{return{}}}const old=parse($('Buscar perfil persistente por número').item.json.persistentProfile),src=$json,product=src.purchasedProduct||{},nome=src.state?.customerName||old.nome||'',total=Number(src.purchaseTotal||old.totalCompras||0)+1;return{json:{profileJson:JSON.stringify({...old,numero:$('dados').item.json.numeroLimpo,nome,historico:{lastProduct:product,total,lastPurchaseAt:new Date().toISOString()},totalCompras:total,ultimaDisciplina:product.discipline||product.disciplina||src.state?.disciplina||old.ultimaDisciplina||'',updatedAt:new Date().toISOString()})}};`,[3980,1880]);
const savePurchaseProfile=redisSet('Salvar perfil persistente após compra',"={{ 'perfil_numero_' + $('dados').item.json.numeroLimpo }}",'={{ $json.profileJson }}',[4200,1880],2592000);
w.nodes.push(prepareProfile,saveProfile,preparePurchaseProfile,savePurchaseProfile);
setConn('Nome capturado?',[['Salvar nome do cliente','Preparar perfil persistente do cliente'],[]]);
setConn('Preparar perfil persistente do cliente',[['Salvar perfil persistente por 30 dias']]);
const purchaseOutputs=w.connections['Compra confirmada?'].main[0];if(!purchaseOutputs.some(x=>x.node===preparePurchaseProfile.name))purchaseOutputs.push({node:preparePurchaseProfile.name,type:'main',index:0});
setConn('Atualizar perfil persistente após compra',[['Salvar perfil persistente após compra']]);

// BUG 7: classificação curta no modelo atual, ignorando saudações antes de interpretar filtros.
const shortClassifier=JSON.parse(JSON.stringify(node('Interpretar pedido e filtros')));
shortClassifier.id=uid('Classificar intenção principal');shortClassifier.name='Classificar intenção principal';shortClassifier.position=[4920,280];
shortClassifier.parameters.text="={{ $('message').item.json.message }}";
shortClassifier.parameters.options={systemMessage:`Classifique a intenção principal da mensagem abaixo.
Ignore saudações (oi, olá, bom dia, boa noite, tudo bem).
Responda apenas com uma das opções:
BUSCA, COMPRA, SUPORTE, SAUDACAO, DESCONHECIDO

Mensagem: {mensagem_cliente}`};
const normalizeIntent=code('Normalizar intenção principal',String.raw`function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim()}const raw=String($json.output||$json.text||'').toUpperCase(),message=norm($('message').item.json.message||''),withoutGreeting=message.replace(/^(oi|ola|bom dia|boa tarde|boa noite|tudo bem)\b[\s,!.?-]*/,'').trim();let intentPrincipal=(raw.match(/\b(BUSCA|COMPRA|SUPORTE|SAUDACAO|DESCONHECIDO)\b/)||[])[1]||'DESCONHECIDO';if(/\b(quero comprar|comprar|adquirir|manda o link|como pago)\b/.test(withoutGreeting))intentPrincipal='COMPRA';else if(/\b(preciso|procuro|busco|quero|tem|material|atividade|algo)\b/.test(withoutGreeting)||/\b\d+[ºo]?\s*ano\b/.test(withoutGreeting))intentPrincipal='BUSCA';else if(/^(oi|ola|bom dia|boa tarde|boa noite|tudo bem)$/.test(message))intentPrincipal='SAUDACAO';return{json:{...$json,filterState:$('Buscar filtros do cliente').item.json.filterState||'{}',intentPrincipal}};`,[5140,280]);
w.nodes.push(shortClassifier,normalizeIntent);
setConn('Precisa de IA?',[[shortClassifier.name],['Classificar reinício com IA e regras']]);
setConn(shortClassifier.name,[[normalizeIntent.name],['IA reserva Groq']]);
setConn(normalizeIntent.name,[['Interpretar pedido e filtros']]);
const modelConnections=w.connections['Google Gemini Chat Model']?.ai_languageModel?.[0]||[];
if(!modelConnections.some(x=>x.node===shortClassifier.name))modelConnections.push({node:shortClassifier.name,type:'ai_languageModel',index:0});

let validator=node('Validar e mesclar filtros').parameters.jsCode;
validator=replace(validator,"const savedName=String($('Buscar nome do cliente').item.json.savedName||'').trim(),savedAB=String($('Buscar variante A B').item.json.savedAB||'').trim(),escalationEnabled=String(data.escaladaAtiva||'true')==='true';",`const persistentProfile=parseObject($('Buscar perfil persistente por número').item.json.persistentProfile||'{}',{}),savedName=String($('Buscar nome do cliente').item.json.savedName||persistentProfile.nome||'').trim(),savedAB=String($('Buscar variante A B').item.json.savedAB||'').trim(),escalationEnabled=String(data.escaladaAtiva||'true')==='true';`,'perfil persistente no validador');
validator=replace(validator,"let action='reply', text='', query='', section='all', intent=String(interpreted.intencao||'conversa');",`let action='reply', text='', query='', section='all', intent=String(interpreted.intencao||'conversa');const principal=String((()=>{try{return $('Normalizar intenção principal').item.json.intentPrincipal||''}catch{return''}})()).toUpperCase(),forceUnknown=Boolean((()=>{try{return $('Classificar tipo da mensagem').item.json.messageRoute==='DESCONHECIDO'}catch{return false}})());if(principal==='BUSCA')intent='buscar_material';else if(principal==='COMPRA')intent='buscar_material';else if(principal==='SUPORTE')intent='atendente';else if(principal==='SAUDACAO')intent='saudacao';`,'intenção principal');
validator=replace(validator,"if(escalationEnabled&&frustrated){",`if(forceUnknown){text='Recebi algo que não consigo processar. Pode digitar sua mensagem? 😊';intent='desconhecido';
} else if(escalationEnabled&&frustrated){`,'fallback desconhecido');
validator=replace(validator,"else if(guidance){state=",`else if(guidance||principal==='BUSCA'||principal==='COMPRA'){state=`,'busca após saudação');
const oldGreeting="else if(greeting){const firstMessage=!Boolean($('Buscar sessão iniciada').item.json.sessionStarted),digits=sessionId.replace(/\\D/g,''),seed=Number(digits.slice(-1)||0);abVariant=abVariant||((seed%2===0)?'A':'B');state.abVariant=abVariant;if(firstMessage){metricEvents=['ab_sessao_'+abVariant];if(String(data.abTesteAtivo||'true')==='true'){action='opening';query='';section='all';text=''}else text='Olá! Sou a '+agent+' da Educalizando. O que você está procurando hoje?'}else{text='Olá novamente! Como posso ajudar você agora?'}intent='saudacao'}";
validator=replace(validator,oldGreeting,"else if(greeting||principal==='SAUDACAO'){text='Olá'+(state.customerName?', '+state.customerName:'')+'! O que você está procurando hoje?';intent='saudacao'}",'saudação pura');
validator=replace(validator,"else{text=clean(interpreted.reply)||'Entendi 😊 Posso responder sua dúvida ou ajudar a encontrar um material. O que você precisa?';intent='conversa'}","else{text=principal==='DESCONHECIDO'?'Pode me contar mais sobre o que você precisa? 😊':(clean(interpreted.reply)||'Pode me contar mais sobre o que você precisa? 😊');intent='conversa'}",'texto desconhecido');
node('Validar e mesclar filtros').parameters.jsCode=validator;

// A interpretação local também reconhece saudação + pedido e nunca usa erro de mídia para texto.
let local=node('Interpretação local de emergência').parameters.jsCode;
local=replace(local,"let intencao='conversa',reply='Estou aqui para ajudar 😊 Pode me contar o que você precisa?';","let intencao='conversa',reply='Pode me contar mais sobre o que você precisa? 😊';",'fallback local');
node('Interpretação local de emergência').parameters.jsCode=local;

fs.writeFileSync(output,JSON.stringify(w,null,2));
console.log(`V18.2 gerada: ${w.nodes.length} nós.`);
