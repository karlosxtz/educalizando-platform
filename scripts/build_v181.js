const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const source=path.join(root,'ATENDENTE EDUCALIZANDO V18.json');
const output=path.join(root,'ATENDENTE EDUCALIZANDO V18.1.json');
const w=JSON.parse(fs.readFileSync(source,'utf8'));
w.name='ATENDENTE EDUCALIZANDO V18.1';
const node=name=>{const found=w.nodes.find(n=>n.name===name);if(!found)throw new Error('Nó ausente: '+name);return found};
const uid=name=>{const h=crypto.createHash('sha1').update('v18.1:'+name).digest('hex').slice(0,32);return`${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`};
const redisCred=JSON.parse(JSON.stringify(node('Buscar filtros do cliente').credentials));
const code=(name,jsCode,position,mode='runOnceForEachItem')=>({id:uid(name),name,type:'n8n-nodes-base.code',typeVersion:2,position,parameters:{mode,language:'javaScript',jsCode}});
const iff=(name,expr,position)=>({id:uid(name),name,type:'n8n-nodes-base.if',typeVersion:2.3,position,parameters:{conditions:{options:{caseSensitive:true,leftValue:'',typeValidation:'strict',version:3},conditions:[{id:uid(name+' condição'),leftValue:expr,rightValue:'',operator:{type:'boolean',operation:'true',singleValue:true}}],combinator:'and'},options:{}}});
const redisGet=(name,key,propertyName,position)=>({id:uid(name),name,type:'n8n-nodes-base.redis',typeVersion:1,position,parameters:{operation:'get',propertyName,key,options:{}},credentials:redisCred,retryOnFail:true,maxTries:3,waitBetweenTries:300,onError:'continueRegularOutput'});
const redisSet=(name,key,value,position,ttl)=>({id:uid(name),name,type:'n8n-nodes-base.redis',typeVersion:1,position,parameters:{operation:'set',key,value,keyType:'string',expire:true,ttl},credentials:redisCred,retryOnFail:true,maxTries:3,waitBetweenTries:300,onError:'continueRegularOutput'});
const redisKeys=(name,keyPattern,position)=>({id:uid(name),name,type:'n8n-nodes-base.redis',typeVersion:1,position,parameters:{operation:'keys',keyPattern,getValues:true},credentials:redisCred,retryOnFail:true,maxTries:3,waitBetweenTries:300,onError:'continueRegularOutput'});
const redisPush=(name,list,messageData,position)=>({id:uid(name),name,type:'n8n-nodes-base.redis',typeVersion:1,position,parameters:{operation:'push',list,messageData,tail:true},credentials:redisCred,retryOnFail:true,maxTries:3,waitBetweenTries:300,onError:'continueRegularOutput'});
const setConn=(from,outputs)=>w.connections[from]={main:outputs.map(group=>group.map(name=>({node:name,type:'main',index:0})))};
const replace=(value,from,to,label)=>{if(!value.includes(from))throw new Error('Trecho ausente: '+label);return value.replace(from,to)};

// BUG 1: aceitar somente mensagem nova do cliente e deduplicar pelo messageId antes de qualquer processamento.
const newMessage=iff('É mensagem nova do cliente?',`={{ ['messages.upsert','messages_upsert'].includes(String($json.event || '').toLowerCase()) && (String($('Webhook').item.json.body?.data?.status || '').toUpperCase() === 'RECEIVED' || $json.fromMe === false || String($json.fromMe).toLowerCase() === 'false') }}`,[120,-300]);
const getProcessed=redisGet('Verificar msg_processada pelo messageId',"={{ 'msg_processada_' + $json.id }}",'msgProcessada',[340,-300]);
const notProcessed=iff('MessageId ainda não processado?','={{ !$json.msgProcessada }}',[560,-300]);
const markProcessed=redisSet('Marcar msg_processada por 60 segundos',"={{ 'msg_processada_' + $('dados').item.json.id }}",'1',[780,-300],60);
const getStarted=redisGet('Buscar sessão iniciada',"={{ 'sessao_iniciada_' + $('dados').item.json.instance + ':' + $('dados').item.json.remotejid }}",'sessionStarted',[1000,-300]);
const started=iff('Sessão já iniciada?','={{ Boolean($json.sessionStarted) }}',[1220,-300]);
const markStarted=redisSet('Marcar sessão iniciada por 24 horas',"={{ 'sessao_iniciada_' + $('dados').item.json.instance + ':' + $('dados').item.json.remotejid }}",'1',[1440,-220],86400);
w.nodes.push(newMessage,getProcessed,notProcessed,markProcessed,getStarted,started,markStarted);
setConn('É atualização de entrega?',[['Registrar entrega ou leitura'],['É mensagem nova do cliente?']]);
setConn('É mensagem nova do cliente?',[['Verificar msg_processada pelo messageId'],[]]);
setConn('Verificar msg_processada pelo messageId',[['MessageId ainda não processado?']]);
setConn('MessageId ainda não processado?',[['Marcar msg_processada por 60 segundos'],[]]);
setConn('Marcar msg_processada por 60 segundos',[['Buscar sessão iniciada']]);
setConn('Buscar sessão iniciada',[['Sessão já iniciada?']]);
setConn('Sessão já iniciada?',[['Normalizar mensagem recebida'],['Marcar sessão iniciada por 24 horas']]);
setConn('Marcar sessão iniciada por 24 horas',[['Normalizar mensagem recebida']]);

// BUG 2 e 3: ler as chaves exatas antes da decisão e mesclá-las ao estado agregado.
const exactKeys=redisKeys('Ler chaves exatas da consulta',"={{ 'consulta_' + $('dados').item.json.instance + ':' + $('dados').item.json.remotejid + '_*' }}",[4320,-40]);
const mergeExact=code('Mesclar chaves exatas da consulta',String.raw`function parse(v){try{return typeof v==='string'?JSON.parse(v):v&&typeof v==='object'?v:{}}catch{return{}}}const sessionId=String($('dados').item.json.instance||'')+':'+String($('dados').item.json.remotejid||''),base=parse($('Buscar filtros do cliente').item.json.filterState||'{}'),values=$json||{},prefix='consulta_'+sessionId+'_',map={idade:'idade',ano_escolar:'anoEscolar',disciplina:'disciplina',tema:'tema',habilidade:'habilidade',data_comemorativa:'dataComemorativa'};for(const[suffix,field]of Object.entries(map)){const value=values[prefix+suffix];if(value!==undefined&&value!==null&&String(value).trim()!=='')base[field]=String(value).trim()}return{json:{...$json,mergedFilterState:JSON.stringify(base)}};`,[4540,-40]);
w.nodes.push(exactKeys,mergeExact);
setConn('Buscar filtros do cliente',[['Ler chaves exatas da consulta']]);
setConn('Ler chaves exatas da consulta',[['Mesclar chaves exatas da consulta']]);
setConn('Mesclar chaves exatas da consulta',[['Classificar perfil comercial']]);

let validator=node('Validar e mesclar filtros').parameters.jsCode;
validator=replace(validator,"const previous=parseObject($('Buscar filtros do cliente').item.json.filterState??'{}',{});","const previous=parseObject($('Mesclar chaves exatas da consulta').item.json.mergedFilterState||$('Buscar filtros do cliente').item.json.filterState||'{}',{});",'estado mesclado');
validator=replace(validator,"const reset=$json.resetIntent===true||interpreted.reset===true||intent==='reiniciar_busca'||resetPattern.test(current);","const explicitReset=/^(reiniciar|start)$/.test(current);const reset=explicitReset;",'reinício explícito');
validator=replace(validator,"if(action==='search'&&!query)query=queryFor(state);",`const validRange=Boolean(String(state.idade||state.anoEscolar||'').trim()),validTopic=Boolean(String(state.disciplina||state.tema||state.habilidade||state.dataComemorativa||'').trim()&&!/^nao$/i.test(norm(state.disciplina||state.tema||state.habilidade||state.dataComemorativa||'')));if(action==='search'&&!(validRange&&validTopic)){action='reply';state.stage='collecting';state.awaiting=!validRange?'age_or_year':'theme';text='Para buscar, falta '+(!validRange?'a idade ou o ano escolar':'a disciplina, o tema, a habilidade ou a data comemorativa')+'. '+question(state.awaiting)}else if(state.stage==='searching'&&validRange&&validTopic){action='search'}if(action==='search'&&!query)query=queryFor(state);`,'validação mínima da busca');
validator=replace(validator,"else if(greeting){const digits=sessionId.replace(/\\D/g,'');const seed=Number(digits.slice(-1)||0);abVariant=abVariant||((seed%2===0)?'A':'B');state.abVariant=abVariant;metricEvents=['ab_sessao_'+abVariant];if(String(data.abTesteAtivo||'true')==='true'){action='opening';query='';section='all';text=''}else text='Olá! Sou a '+agent+' da Educalizando. O que você está procurando hoje?';intent='saudacao'}",`else if(greeting){const firstMessage=!Boolean($('Buscar sessão iniciada').item.json.sessionStarted),digits=sessionId.replace(/\\D/g,''),seed=Number(digits.slice(-1)||0);abVariant=abVariant||((seed%2===0)?'A':'B');state.abVariant=abVariant;if(firstMessage){metricEvents=['ab_sessao_'+abVariant];if(String(data.abTesteAtivo||'true')==='true'){action='opening';query='';section='all';text=''}else text='Olá! Sou a '+agent+' da Educalizando. O que você está procurando hoje?'}else{text='Olá novamente! Como posso ajudar você agora?'}intent='saudacao'}`,'saudação somente inicial');
node('Validar e mesclar filtros').parameters.jsCode=validator;

let restart=node('Classificar reinício com IA e regras').parameters.jsCode;
restart=replace(restart,"const byModel=interpreted.reset===true||String(interpreted.intencao||'')==='reiniciar_busca';const byRules=patterns.some(p=>message.includes(p));","const byModel=false;const byRules=/^(reiniciar|start)$/.test(message);",'classificador de reinício');
node('Classificar reinício com IA e regras').parameters.jsCode=restart;

// BUG 2: persistência obrigatória e conferida antes de respostas, buscas e demais efeitos.
const oldFan=(w.connections['Continuar após limpeza']?.main?.[0]||[]).map(x=>x.node).filter(name=>name!=='Salvar filtros do cliente'&&name!=='Filtros completos?');
const verifyState=redisGet('Verificar estado Redis recém-salvo',"={{ 'educalizando:filtros:v18:' + $('dados').item.json.instance + ':' + $('dados').item.json.remotejid }}",'stateJustSaved',[3740,1120]);
const confirmState=code('Confirmar estado Redis antes de avançar',String.raw`function parse(v){try{return JSON.parse(v||'{}')}catch{return{}}}const expected=$('Restaurar decisão após conferência').item.json,actual=parse($json.stateJustSaved),wanted=parse(expected.stateJson);const fields=['idade','anoEscolar','disciplina','tema','habilidade','dataComemorativa','stage','awaiting'];const statePersisted=fields.every(k=>String(actual[k]??'')===String(wanted[k]??''));return{json:{...expected,statePersisted}};`,[3960,1120]);
const stateOk=iff('Estado Redis confirmado?','={{ Boolean($json.statePersisted) }}',[4180,1120]);
const preparePipeline=code('Preparar pipeline dos campos da consulta',String.raw`const src=$json,s=src.state||{},sessionId=src.sessionId,map={idade:s.idade||'',ano_escolar:s.anoEscolar||'',disciplina:s.disciplina||'',tema:s.tema||'',habilidade:s.habilidade||'',data_comemorativa:s.dataComemorativa||''};return Object.entries(map).map(([field,value])=>({json:{redisKey:'consulta_'+sessionId+'_'+field,redisValue:String(value||'')}}));`,[4400,1080],'runOnceForAllItems');
const savePipeline=redisSet('Gravar pipeline da consulta','={{ $json.redisKey }}','={{ $json.redisValue }}',[4620,1080],90000);
const consolidatePipeline=code('Consolidar pipeline gravado',String.raw`const src=$('Restaurar decisão após conferência').item.json;return[{json:{...src,pipelineWritten:true}}];`,[4840,1080],'runOnceForAllItems');
const verifyFields=redisKeys('Verificar campos Redis recém-gravados',"={{ 'consulta_' + $('dados').item.json.instance + ':' + $('dados').item.json.remotejid + '_*' }}",[5060,1080]);
const confirmFields=code('Confirmar pipeline Redis antes de responder',String.raw`const src=$('Restaurar decisão após conferência').item.json,s=src.state||{},sessionId=src.sessionId,prefix='consulta_'+sessionId+'_',expected={idade:s.idade||'',ano_escolar:s.anoEscolar||'',disciplina:s.disciplina||'',tema:s.tema||'',habilidade:s.habilidade||'',data_comemorativa:s.dataComemorativa||''};const pipelinePersisted=Object.entries(expected).every(([field,value])=>String($json[prefix+field]??'')===String(value));return{json:{...src,pipelinePersisted}};`,[5280,1080]);
const fieldsOk=iff('Pipeline Redis confirmado?','={{ Boolean($json.pipelinePersisted) }}',[5500,1080]);
const persistenceFailure={id:uid('Falha segura de persistência'),name:'Falha segura de persistência',type:'n8n-nodes-base.set',typeVersion:3.4,position:[5500,1220],parameters:{assignments:{assignments:[{id:uid('falha persistência texto'),name:'text',type:'string',value:'Tive um problema técnico agora. Pode repetir sua mensagem?'},{id:uid('falha persistência imagem'),name:'imageUrl',type:'string',value:''}]},options:{}}};
w.nodes.push(verifyState,confirmState,stateOk,preparePipeline,savePipeline,consolidatePipeline,verifyFields,confirmFields,fieldsOk,persistenceFailure);
setConn('Continuar após limpeza',[['Salvar filtros do cliente']]);
setConn('Salvar filtros do cliente',[['Verificar estado Redis recém-salvo']]);
setConn('Verificar estado Redis recém-salvo',[['Confirmar estado Redis antes de avançar']]);
setConn('Confirmar estado Redis antes de avançar',[['Estado Redis confirmado?']]);
setConn('Estado Redis confirmado?',[['Preparar pipeline dos campos da consulta'],['Falha segura de persistência']]);
setConn('Preparar pipeline dos campos da consulta',[['Gravar pipeline da consulta']]);
setConn('Gravar pipeline da consulta',[['Consolidar pipeline gravado']]);
setConn('Consolidar pipeline gravado',[['Verificar campos Redis recém-gravados']]);
setConn('Verificar campos Redis recém-gravados',[['Confirmar pipeline Redis antes de responder']]);
setConn('Confirmar pipeline Redis antes de responder',[['Pipeline Redis confirmado?']]);
setConn('Pipeline Redis confirmado?',[[...oldFan,'Filtros completos?'],['Falha segura de persistência']]);
setConn('Falha segura de persistência',[['Conferir atualidade antes de enviar']]);

// BUG 4: o estado produzido pela busca, inclusive busca vazia, também é salvo antes de responder.
const formatterFan=(w.connections['Formatar resultado oficial']?.main?.[0]||[]).map(x=>x.node);
const saveResultState=redisSet('Salvar estado após resultado da busca',"={{ 'educalizando:filtros:v18:' + $('dados').item.json.instance + ':' + $('dados').item.json.remotejid }}",'={{ $json.stateJson }}',[3540,520],7200);
const verifyResultState=redisGet('Verificar estado após resultado da busca',"={{ 'educalizando:filtros:v18:' + $('dados').item.json.instance + ':' + $('dados').item.json.remotejid }}",'resultStateSaved',[3760,520]);
const confirmResultState=code('Confirmar estado da busca antes de responder',String.raw`function parse(v){try{return JSON.parse(v||'{}')}catch{return{}}}const src=$('Formatar resultado oficial').item.json,actual=parse($json.resultStateSaved),expected=src.state||{},resultStatePersisted=String(actual.stage||'')===String(expected.stage||'')&&String(actual.awaiting||'')===String(expected.awaiting||'')&&Number(actual.failedSearches||0)===Number(expected.failedSearches||0);return{json:{...src,resultStatePersisted}};`,[3980,520]);
const resultStateOk=iff('Estado da busca confirmado?','={{ Boolean($json.resultStatePersisted) }}',[4200,520]);
w.nodes.push(saveResultState,verifyResultState,confirmResultState,resultStateOk);
setConn('Formatar resultado oficial',[['Salvar estado após resultado da busca']]);
setConn('Salvar estado após resultado da busca',[['Verificar estado após resultado da busca']]);
setConn('Verificar estado após resultado da busca',[['Confirmar estado da busca antes de responder']]);
setConn('Confirmar estado da busca antes de responder',[['Estado da busca confirmado?']]);
setConn('Estado da busca confirmado?',[formatterFan,['Falha segura de persistência']]);

// BUG 3: log imediatamente antes da busca e fallback técnico com métrica.
const isSearch=iff('É busca de produto?','={{ $json.action === "search" }}',[2860,720]);
const debugSearch=redisSet('Registrar debug antes da busca',"={{ 'educalizando:debug:v18:' + $json.sessionId }}","={{ JSON.stringify({ at: $now.toISO(), action: $json.action, query: $json.query, section: $json.section, filters: { idade: $json.state?.idade || '', ano_escolar: $json.state?.anoEscolar || '', disciplina: $json.state?.disciplina || '', tema: $json.state?.tema || '', habilidade: $json.state?.habilidade || '', data_comemorativa: $json.state?.dataComemorativa || '' } }) }}",[3080,680],86400);
const searchErrorMetric=redisPush('Registrar erro_busca nas métricas','educalizando:metricas:v18',"={{ JSON.stringify({ event: 'erro_busca', sessionId: $('Validar e mesclar filtros').item.json.sessionId, at: $now.toISO(), query: $('Validar e mesclar filtros').item.json.query || '' }) }}",[3540,900]);
w.nodes.push(isSearch,debugSearch,searchErrorMetric);
setConn('Filtros completos?',[['Conferir atualidade antes de enviar'],['É busca de produto?']]);
setConn('É busca de produto?',[['Registrar debug antes da busca'],['Consultar API da loja']]);
setConn('Registrar debug antes da busca',[['Consultar API da loja']]);
const failure=node('Falha na consulta da loja');
failure.parameters.assignments.assignments.find(x=>x.name==='text').value='Tive um problema técnico agora. Pode repetir sua busca?';
if(!failure.parameters.assignments.assignments.some(x=>x.name==='metricEvents'))failure.parameters.assignments.assignments.push({id:uid('erro busca eventos'),name:'metricEvents',type:'array',value:'=["erro_busca"]'});
setConn('Falha na consulta da loja',[['Conferir atualidade antes de enviar','Registrar erro_busca nas métricas']]);

fs.writeFileSync(output,JSON.stringify(w,null,2));
console.log(`V18.1 gerada: ${w.nodes.length} nós.`);
