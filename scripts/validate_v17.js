const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const files={main:'ATENDENTE EDUCALIZANDO V17.json',messages:'RECUPERADOR DE MENSAGENS V17.json',attendance:'RECUPERADOR DE ATENDIMENTOS V17.json'};
const flows=Object.fromEntries(Object.entries(files).map(([k,v])=>[k,JSON.parse(fs.readFileSync(path.join(root,v),'utf8'))]));
const checks=[];function check(ok,label){checks.push({ok:Boolean(ok),label});if(!ok)process.exitCode=1}
function structural(flow,label){const names=new Set(),ids=new Set();for(const n of flow.nodes){check(!names.has(n.name),`${label}: nome único ${n.name}`);names.add(n.name);check(!ids.has(n.id),`${label}: id único ${n.name}`);ids.add(n.id);if(n.type==='n8n-nodes-base.code')try{new Function(n.parameters.jsCode)}catch(e){check(false,`${label}: código válido ${n.name}: ${e.message}`)}}for(const[from,c]of Object.entries(flow.connections||{})){check(names.has(from),`${label}: origem ${from}`);for(const out of c.main||[])for(const x of out||[])check(names.has(x.node),`${label}: ${from} -> ${x.node}`)}}
for(const[k,v]of Object.entries(flows))structural(v,k);
const main=flows.main,node=name=>main.nodes.find(n=>n.name===name),raw=JSON.stringify(main);
const v16=JSON.parse(fs.readFileSync(path.join(root,'ATENDENTE EDUCALIZANDO CONVERSACIONAL V16.json'),'utf8'));
check(v16.nodes.every(old=>main.nodes.some(n=>n.name===old.name)),'todos os nós da V16 foram preservados');
check(node('Webhook').parameters.path==='evolutioneducalizandobot-v102','webhook preservado');
check(main.nodes.length===143,'quantidade esperada de nós no atendente');
check(!raw.includes('outbox:v16')&&raw.includes('outbox:v17'),'fila V17 isolada');
check(!JSON.stringify(flows.messages).includes('outbox:v16')&&JSON.stringify(flows.messages).includes('outbox:v17'),'recuperador usa fila V17');
check(node('Buscar filtros do cliente').credentials.redis.id==='h3OP959odDzP19Lo','credencial Redis preservada');
check(node('Google Gemini Chat Model').credentials.googlePalmApi.id==='zixppSx0KNmswzqr','credencial Gemini preservada');
check(node('Enviar texto').credentials.evolutionApi.id==='ClwZMoUCTXeZ3VLz','credencial Evolution preservada');
for(const required of ['Preparar proteção antiflood','Verificar hash da mensagem','Avaliar spam e flood','Classificar perfil comercial','Buscar histórico de compras','Salvar pacote retornado','Aguardar 45 minutos para satisfação','Pausar bot para atendimento humano','Salvar sessão atual do atendente','Buscar sessão do handoff interno','Montar resumo para atendente'])check(Boolean(node(required)),`nó presente: ${required}`);
for(const required of ['Relatório diário às 8h','Formatar relatório diário','Salvar snapshot diário','Zerar contadores do dia'])check(flows.attendance.nodes.some(n=>n.name===required),`relatório: ${required}`);

const validator=node('Validar e mesclar filtros').parameters.jsCode;
function runValidator(message,state={},opts={}){const refs={dados:{instance:'inst',remotejid:'5511999999999@s.whatsapp.net',id:'m1',pushName:'Maria',agentName:'Alexia',cupomPrimeira:'VOLTA10',cupomTerceira:'FIEL15',cupomQuinta:'VIP20',linkPacote:'https://loja/pacote',descontoPacote:'10'},message:{message},'Buscar filtros do cliente':{filterState:JSON.stringify(state)},'Classificar perfil comercial':{customerProfile:opts.profile||'COMPRADOR'},'Buscar histórico de compras':{purchaseHistory:opts.history?JSON.stringify(opts.history):''},'Buscar total de compras':{purchaseTotal:String(opts.total||0)}};const dollar=name=>({item:{json:refs[name]||{}}});return new Function('$json','$',validator)({output:JSON.stringify(opts.interpreted||{intencao:'conversa',reply:'',reset:false,filters:{}})},dollar).json}
let r=runValidator('quero ver o que tem',{}, {profile:'EXPLORADOR'});check(r.stage==='exploring_categories'&&/Português/.test(r.text),'explorador vê categorias primeiro');
r=runValidator('preciso de um material',{}, {profile:'COMPRADOR'});check(r.awaiting==='age_or_year'&&!/categorias/.test(r.text),'comprador vai direto aos filtros');
const previous={lastProduct:{id:'p1',title:'Jogo das Sílabas',discipline:'Português',schoolYear:'1º ano',age:'6 anos'}};
r=runValidator('oi',{}, {profile:'RECORRENTE',history:previous});check(r.stage==='returning_choice'&&/Olá de volta/.test(r.text)&&/Jogo das Sílabas/.test(r.text),'recorrente recebe saudação com última compra');
r=runValidator('quero outro igual',{}, {profile:'RECORRENTE',history:previous});check(r.awaiting==='theme'&&r.state.disciplina==='Português'&&r.state.anoEscolar==='1º ano','atalho recorrente pré-preenche filtros');
const items=[1,2,3].map(i=>({id:'p'+i,title:'Produto '+i,price:10,publicUrl:'https://loja/p'+i,discipline:'Português',schoolYear:'1º ano'}));
const packageState={stage:'awaiting_choice',awaiting:'product_choice',lastResults:items,package:{id:'pack',title:'Pacote completo',ids:['p1','p2','p3'],items,price:27,publicUrl:'https://loja/pacote',isPackage:true}};
r=runValidator('4',packageState);check(r.state.selectedProduct.isPackage&&/Opção 4/.test(r.text),'opção 4 seleciona pacote');let selected=r.state;
r=runValidator('quero comprar',selected);check(r.stage==='confirming_purchase'&&!r.text.includes('https://'),'pacote pede confirmação sem antecipar link');selected=r.state;
r=runValidator('sim',selected,{total:0});check(r.purchaseConfirmed&&r.text.includes('https://loja/pacote')&&r.text.includes('VOLTA10'),'confirma pacote e concede cupom da primeira compra');
r=runValidator('não abriu',{stage:'awaiting_satisfaction',awaiting:'satisfaction',lastProduct:items[0]});check(r.stage==='collecting_support_name','problema inicia coleta de suporte');let support=r.state;
r=runValidator('Maria da Silva',support);check(r.stage==='collecting_support_email','suporte coleta nome e pede e-mail');support=r.state;
r=runValidator('maria@example.com',support);check(r.supportTriggered&&r.humanHandoff&&r.metricEvents.includes('suporte_acionado'),'suporte é salvo, medido e encaminhado');
r=runValidator('falar com atendente',{stage:'idle'});check(r.humanHandoff&&r.stage==='human_paused','handoff pausa atendimento automático');

const formatter=node('Formatar resultado oficial').parameters.jsCode;
function runFormatter(payload,source){const refs={'Validar e mesclar filtros':source,dados:{descontoPacote:'10',linkPacote:'https://loja/pacote'}};const dollar=name=>({item:{json:refs[name]||{}}});return new Function('$json','$',formatter)(payload,dollar).json}
let formatted=runFormatter({products:items.map((x,i)=>({...x,description:'Primeira frase do produto. Segunda frase útil. Terceira frase não deve aparecer.',coverUrl:'https://img/'+i+'.jpg',isBestSeller:i===0}))},{action:'search',state:{disciplina:'Português',anoEscolar:'1º ano'},sessionId:'s'});
check(formatted.deliveries.length===4&&formatted.state.package.ids.length===3,'três produtos compatíveis criam pacote como opção 4');
check(formatted.deliveries[0].hasImage&&/Nome: Produto 1/.test(formatted.deliveries[0].text)&&/Para: 1º ano — Português/.test(formatted.deliveries[0].text),'card inclui foto, nome, ano e disciplina');
check(/Primeira frase do produto\. Segunda frase útil\./.test(formatted.deliveries[0].text)&&!/Terceira frase/.test(formatted.deliveries[0].text),'descrição limitada a duas frases');
check(/Mais vendido desta semana/.test(formatted.deliveries[0].text)&&!/\*/.test(formatted.deliveries[0].text),'selo de popularidade e texto sem markdown');

const evalFlood=node('Avaliar spam e flood').parameters.jsCode;
function runFlood(hashExists,old){const refs={'Preparar proteção antiflood':{sessionId:'s',message:'oi',hashKey:'h',rateKey:'r'},'Verificar hash da mensagem':{hashExists}};const dollar=name=>({item:{json:refs[name]||{}}});return new Function('$json','$',evalFlood)({rateState:JSON.stringify(old||{})},dollar).json}
r=runFlood(true,{});check(!r.process&&r.duplicate,'hash repetido é bloqueado');
r=runFlood(false,{ten:Array(5).fill(Date.now()),minute:[]});check(!r.process&&r.burst&&r.noticeOnly,'sexta mensagem em 10 segundos gera um aviso');
r=runFlood(false,{ten:[],minute:Array(20).fill(Date.now())});check(!r.process&&r.flood&&r.pauseUntil>Date.now()+290000,'vigésima primeira mensagem pausa por cinco minutos');
r=runFlood(false,{pausedUntil:Date.now()+200000,ten:[],minute:[]});check(!r.process&&r.temporarilyPaused&&!r.noticeOnly,'mensagens durante pausa são ignoradas');

const reportNode=flows.attendance.nodes.find(n=>n.name==='Formatar relatório diário');const report=new Function('$json',reportNode.parameters.jsCode)({dailyState:JSON.stringify({atendimentos:10,buscas:8,encontrados:6,vazios:2,selecionados:4,compras:2,links:2,suportes:1,abandonos:1,disciplinas:{Português:5,Matemática:3}})}).json;
check(report.text.includes('Taxa de conversão: 20.0%')&&report.text.includes('1. Português — 5 buscas'),'relatório calcula conversão e ranking');

for(const c of checks)console.log(`${c.ok?'OK':'FALHA'} - ${c.label}`);
console.log(`\n${checks.filter(x=>x.ok).length}/${checks.length} verificações aprovadas`);
