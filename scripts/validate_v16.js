const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const mainPath=path.join(root,'ATENDENTE EDUCALIZANDO CONVERSACIONAL V16.json');
const recoveryPath=path.join(root,'RECUPERADOR DE ATENDIMENTOS V16.json');
const messageRecoveryPath=path.join(root,'RECUPERADOR DE MENSAGENS V16.json');
const main=JSON.parse(fs.readFileSync(mainPath,'utf8'));
const recovery=JSON.parse(fs.readFileSync(recoveryPath,'utf8'));
const messageRecovery=JSON.parse(fs.readFileSync(messageRecoveryPath,'utf8'));
const checks=[];
function check(ok,label){checks.push({ok:Boolean(ok),label});if(!ok)process.exitCode=1}
function structural(flow,label){
  const names=new Set(flow.nodes.map(n=>n.name)),ids=new Set();
  check(names.size===flow.nodes.length,`${label}: nomes únicos`);
  for(const n of flow.nodes){check(!ids.has(n.id),`${label}: id único ${n.name}`);ids.add(n.id);if(n.type==='n8n-nodes-base.code'){try{new Function(n.parameters.jsCode)}catch(e){check(false,`${label}: JavaScript válido em ${n.name}: ${e.message}`)}}}
  for(const [from,conn] of Object.entries(flow.connections||{})){check(names.has(from),`${label}: origem existe ${from}`);for(const outputs of conn.main||[])for(const c of outputs||[])check(names.has(c.node),`${label}: destino existe ${from} -> ${c.node}`)}
}
structural(main,'principal');structural(recovery,'abandono');
structural(messageRecovery,'mensagens');
const node=n=>main.nodes.find(x=>x.name===n);
check(node('Webhook').parameters.path==='evolutioneducalizandobot-v102','webhook preservado');
check(main.nodes.length>=90,'nós existentes preservados e V16 ampliada');
check(node('Google Gemini Chat Model').credentials.googlePalmApi.id==='zixppSx0KNmswzqr','credencial Gemini preservada');
check(node('Buscar filtros do cliente').credentials.redis.id==='h3OP959odDzP19Lo','credencial Redis preservada');
check(node('Enviar texto').credentials.evolutionApi.id==='ClwZMoUCTXeZ3VLz','credencial Evolution preservada');
check(main.nodes.some(n=>n.name==='Registrar métrica de conversão'),'métricas de conversão');
check(main.nodes.some(n=>n.name==='Classificar reinício com IA e regras'),'classificação de reinício por IA e regras');
check(main.nodes.some(n=>n.name==='Aguardar 5 minutos para upsell'),'upsell de 5 minutos');
check(recovery.nodes.some(n=>n.name==='A cada 30 minutos'),'recuperação a cada 30 minutos');
check(JSON.stringify(main).includes('educalizando:outbox:v16')&&!JSON.stringify(main).includes('educalizando:outbox:v15'),'fila principal isolada na V16');
check(JSON.stringify(messageRecovery).includes('educalizando:outbox:v16')&&!JSON.stringify(messageRecovery).includes('educalizando:outbox:v15'),'recuperador usa fila V16');

const validator=node('Validar e mesclar filtros').parameters.jsCode;
function runValidator(message,state={},interpreted={intencao:'conversa',reply:'',reset:false,filters:{}}){
  const refs={
    dados:{instance:'instancia',remotejid:'5511999999999@s.whatsapp.net',id:'msg1',agentName:'Alexia'},
    message:{message},
    'Buscar filtros do cliente':{filterState:JSON.stringify(state)},
  };
  const dollar=(name)=>({item:{json:refs[name]||{}}});
  const fn=new Function('$json','$',validator);
  return fn({output:JSON.stringify(interpreted)},dollar).json;
}
let r=runValidator('oi');check(r.action==='reply'&&/Alexia/.test(r.text),'saudação usa nome do agente');
r=runValidator('pode me ajudar a escolher um material?');check(r.awaiting==='age_or_year'&&r.metricEvents.includes('ficha_iniciada'),'inicia ficha sem pesquisar');let state=r.state;
r=runValidator('6 anos',state);check(r.awaiting==='discipline'&&r.captureFields.some(x=>x.field==='idade'),'salva idade isoladamente');state=r.state;
r=runValidator('português',state);check(r.awaiting==='theme'&&r.captureFields.some(x=>x.field==='disciplina'),'salva disciplina isoladamente');state=r.state;
r=runValidator('sílabas',state);check(r.awaiting==='date'&&r.captureFields.some(x=>x.field==='tema'),'salva tema isoladamente');state=r.state;
r=runValidator('não',state);check(r.awaiting==='version'&&r.captureFields.some(x=>x.field==='dataComemorativa'),'salva data isoladamente');state=r.state;
r=runValidator('qualquer',state);check(r.action==='search'&&r.metricEvents.includes('ficha_concluida'),'pesquisa após ficha concluída');
r=runValidator('Idade: 7 anos\nDisciplina: matemática\nTema: números\nData comemorativa: não\nTipo de versão: final');check(r.action==='search'&&r.query,'ficha completa pesquisa imediatamente');
r=runValidator('não gostei',state);check(r.resetSession&&r.awaiting==='age_or_year','reinício robusto limpa e recomeça');

const products=[{id:'a',title:'Jogo das Sílabas',price:6.99,publicUrl:'https://loja/final',plrPrice:18.99,plrUrl:'https://loja/plr'},{id:'b',title:'Bingo das Letras',price:8,publicUrl:'https://loja/b'}];
state={...state,lastResults:products,stage:'awaiting_choice',awaiting:'product_choice'};
r=runValidator('2',state);check(r.state.selectedProduct.id==='b'&&r.metricEvents.includes('produto_selecionado'),'escolha numérica mantém produto');state=r.state;
r=runValidator('quero comprar',state);check(r.stage==='confirming_purchase'&&/Confirma a compra/.test(r.text)&&!r.text.includes('https://'),'compra pede confirmação antes do link');state=r.state;
r=runValidator('sim',state);check(r.metricEvents.includes('compra_confirmada')&&r.metricEvents.includes('link_enviado')&&r.startUpsell&&r.text.includes('https://loja/b'),'confirmação envia link e inicia upsell');
state={...state,pendingPurchase:{product:products[1],mode:'final',link:'https://loja/b',price:8},stage:'confirming_purchase',awaiting:'purchase_confirmation'};
r=runValidator('não',state);check(r.stage==='awaiting_choice'&&/Opção 1/.test(r.text)&&!r.text.includes('https://'),'recusa volta às opções sem nova pesquisa');
state={stage:'collecting',awaiting:'theme',anoEscolar:'1º ano'};
r=runValidator('qual é o instagram?',state);check(r.action==='store_info'&&r.awaiting==='theme','dúvida paralela não destrói ficha');
state={stage:'collecting',awaiting:'discipline',idade:'6 anos',reminderPending:true};
r=runValidator('sim',state);check(r.intent==='retomar_atendimento'&&r.awaiting==='discipline'&&!r.captureFields.length,'retomada não grava “sim” como disciplina');

const formatter=node('Formatar resultado oficial').parameters.jsCode;
function runFormatter(payload,source){const dollar=(name)=>({item:{json:name==='Validar e mesclar filtros'?source:{}}});const fn=new Function('$json','$',formatter);return fn(payload,dollar).json}
let f=runFormatter({products:[]},{action:'search',state:{idade:'6 anos',tema:'sílabas'},sessionId:'s'});check(f.state.stage==='adjusting_filters'&&f.metricEvents.includes('resultado_vazio'),'zero resultado pede ajuste e mantém filtros');
f=runFormatter({products:[{id:'1',title:'Produto',description:'Descrição oficial',price:10,publicUrl:'https://loja/p',coverUrl:'https://img/p.jpg'}]},{action:'search',state:{},sessionId:'s'});check(f.deliveries.length===1&&f.deliveries[0].hasImage&&!f.deliveries[0].text.includes('https://loja/p')&&f.metricEvents.includes('resultado_encontrado'),'produto envia capa sem link antes da confirmação');

for(const c of checks)console.log(`${c.ok?'OK':'FALHA'} - ${c.label}`);
console.log(`\n${checks.filter(c=>c.ok).length}/${checks.length} verificações aprovadas`);
