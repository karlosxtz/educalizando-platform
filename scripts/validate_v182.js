const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const files={main:'ATENDENTE EDUCALIZANDO V18.2.json',messages:'RECUPERADOR DE MENSAGENS V18.json',attendance:'RECUPERADOR DE ATENDIMENTOS V18.json'};
const flows=Object.fromEntries(Object.entries(files).map(([k,v])=>[k,JSON.parse(fs.readFileSync(path.join(root,v),'utf8'))]));
const checks=[];function check(ok,label){checks.push({ok:Boolean(ok),label});if(!ok)process.exitCode=1}
function structural(flow,label){const names=new Set(),ids=new Set();for(const n of flow.nodes){check(!names.has(n.name),`${label}: nome único ${n.name}`);names.add(n.name);check(!ids.has(n.id),`${label}: id único ${n.name}`);ids.add(n.id);if(n.type==='n8n-nodes-base.code')try{new Function(n.parameters.jsCode)}catch(e){check(false,`${label}: código válido ${n.name}: ${e.message}`)}}for(const[from,c]of Object.entries(flow.connections||{})){check(names.has(from),`${label}: origem ${from}`);for(const out of c.main||[])for(const x of out||[])check(names.has(x.node),`${label}: ${from} -> ${x.node}`)}}
for(const[k,v]of Object.entries(flows))structural(v,k);
const main=flows.main,node=name=>main.nodes.find(n=>n.name===name),raw=JSON.stringify(main);
const v181=JSON.parse(fs.readFileSync(path.join(root,'ATENDENTE EDUCALIZANDO V18.1.json'),'utf8'));
check(v181.nodes.every(old=>main.nodes.some(n=>n.name===old.name)),'todos os nós da V18.1 foram preservados');
check(JSON.stringify(node('Webhook').parameters)===JSON.stringify(v181.nodes.find(n=>n.name==='Webhook').parameters),'configuração completa do webhook foi preservada');
check(v181.nodes.every(old=>JSON.stringify(main.nodes.find(n=>n.name===old.name)?.credentials||{})===JSON.stringify(old.credentials||{})),'todas as credenciais dos nós existentes foram preservadas');
check(node('Webhook').parameters.path==='evolutioneducalizandobot-v102','webhook preservado');
check(main.nodes.length===220,'quantidade esperada de nós no atendente');
check(!raw.includes('outbox:v17')&&raw.includes('outbox:v18'),'fila V18 isolada');
check(!JSON.stringify(flows.messages).includes('outbox:v17')&&JSON.stringify(flows.messages).includes('outbox:v18'),'recuperador usa fila V18');
check(node('Buscar filtros do cliente').credentials.redis.id==='h3OP959odDzP19Lo','credencial Redis preservada');
check(node('Google Gemini Chat Model').credentials.googlePalmApi.id==='zixppSx0KNmswzqr','credencial Gemini preservada');
check(node('Enviar texto').credentials.evolutionApi.id==='ClwZMoUCTXeZ3VLz','credencial Evolution preservada');
for(const required of ['Preparar proteção antiflood','Verificar hash da mensagem','Avaliar spam e flood','Classificar perfil comercial','Buscar histórico de compras','Salvar pacote retornado','Aguardar 45 minutos para satisfação','Pausar bot para atendimento humano','Salvar sessão atual do atendente','Buscar sessão do handoff interno','Montar resumo para atendente'])check(Boolean(node(required)),`nó presente: ${required}`);
for(const required of ['Relatório diário às 8h','Formatar relatório diário','Salvar snapshot diário','Zerar contadores do dia'])check(flows.attendance.nodes.some(n=>n.name===required),`relatório: ${required}`);

const validator=node('Validar e mesclar filtros').parameters.jsCode;
function runValidator(message,state={},opts={}){const refs={dados:{instance:'inst',remotejid:opts.remotejid||'5511999999999@s.whatsapp.net',numeroLimpo:String(opts.remotejid||'5511999999999@s.whatsapp.net').replace(/@s\.whatsapp\.net$/i,'').replace(/[^0-9]/g,''),id:'m1',pushName:'Maria',agentName:'Alexia',cupomPrimeira:'VOLTA10',cupomTerceira:'FIEL15',cupomQuinta:'VIP20',linkPacote:'https://loja/pacote',descontoPacote:'10',abTesteAtivo:'true',escaladaAtiva:'true'},message:{message},'Buscar filtros do cliente':{filterState:JSON.stringify(state)},'Mesclar chaves exatas da consulta':{mergedFilterState:JSON.stringify(state)},'Buscar sessão iniciada':{sessionStarted:opts.first===false?'1':''},'Buscar perfil persistente por número':{persistentProfile:opts.persistentProfile?JSON.stringify(opts.persistentProfile):''},'Normalizar intenção principal':{intentPrincipal:opts.intentPrincipal||''},'Classificar tipo da mensagem':{messageRoute:opts.messageRoute||'TEXTO'},'Classificar perfil comercial':{customerProfile:opts.profile||'COMPRADOR'},'Buscar histórico de compras':{purchaseHistory:opts.history?JSON.stringify(opts.history):''},'Buscar total de compras':{purchaseTotal:String(opts.total||0)},'Buscar nome do cliente':{savedName:opts.name||''},'Buscar variante A B':{savedAB:opts.ab||''}};const dollar=name=>({item:{json:refs[name]||{}}});return new Function('$json','$',validator)({output:JSON.stringify(opts.interpreted||{intencao:'conversa',reply:'',reset:false,filters:{}}),resetIntent:opts.resetIntent===true},dollar).json}
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

// Requisitos exclusivos da V18.
for(const required of ['Buscar nome do cliente','Buscar variante A B','Salvar nome do cliente','Salvar urgência da sessão','Salvar filtro normalizado','Salvar variante A B','Salvar prioridade alta','É atualização de entrega?','Registrar entrega ou leitura','Mensagem enviada é crítica?','Verificar entrega crítica','Reenviar mensagem crítica','Reenvio foi entregue?'])check(Boolean(node(required)),`V18 atendente: ${required}`);
for(const required of ['Reativação segunda às 10h','Configurar reativação semanal','Listar históricos para reativação','Listar atividades recentes','Selecionar clientes para reativação','Enviar reativação semanal','Marcar reativação enviada','Registrar métrica de reativação'])check(flows.attendance.nodes.some(n=>n.name===required),`V18 recuperador: ${required}`);
const dadosNext=(main.connections.dados?.main?.[0]||[]).map(x=>x.node);check(dadosNext.length===1&&dadosNext[0]==='É atualização de entrega?','atualização de entrega é separada antes do atendimento');
const updateBranches=main.connections['É atualização de entrega?']?.main||[];check(updateBranches[0]?.[0]?.node==='Registrar entrega ou leitura'&&updateBranches[1]?.some(x=>x.node==='É mensagem nova do cliente?'),'ACK é registrado e mensagens comuns seguem o filtro de eventos');
check(raw.includes('whisper-large-v3')&&raw.includes('WHISPER_MODEL'),'modelo Whisper configurável por ambiente');
check(raw.includes('Não consegui ouvir seu áudio. Pode digitar sua dúvida? 😊'),'fallback exato de áudio');
check(raw.includes("type: $('Normalizar mensagem recebida').item.json.isAudio ? 'audio_transcrito'"),'transcrição é salva como audio_transcrito');
for(const key of ['nome_','urgencia_','filtro_normalizado_','ab_variante_','prioridade_','entrega_ack_','tentativa_reenvio_'])check(raw.includes(key),`chave Redis presente: ${key}`);

r=runValidator('meu nome é Carla',{stage:'idle'},{interpreted:{intencao:'conversa',reply:'Olá!',reset:false,filters:{}}});check(r.nameCaptured&&r.state.customerName==='Carla','nome informado passivamente é capturado');
r=runValidator('oi',{stage:'idle',exchangeCount:2},{interpreted:{intencao:'saudacao',reply:'Olá!',reset:false,filters:{}}});check(r.state.nameAsked&&r.state.awaitingName&&/Como posso te chamar/.test(r.text),'nome é perguntado uma única vez após três trocas');
r=runValidator('boa tarde',{stage:'idle'},{name:'Eduardo',intentPrincipal:'SAUDACAO',interpreted:{intencao:'saudacao',reply:'',reset:false,filters:{}}});check(r.state.customerName==='Eduardo'&&r.action==='reply'&&r.text==='Olá, Eduardo! O que você está procurando hoje?','saudação pura usa o nome e a resposta definida na V18.2');
const persistentGreeting=runValidator('oi',{stage:'idle'},{persistentProfile:{nome:'Eduardo'},intentPrincipal:'SAUDACAO'});check(persistentGreeting.state.customerName==='Eduardo'&&!persistentGreeting.state.awaitingName,'nome persistente é reutilizado sem nova pergunta');
r=runValidator('15/10/2026',{stage:'collecting',awaiting:'deadline',idade:'6 anos',disciplina:'Português',tema:'sílabas'});check(r.urgencyCaptured&&r.state.dataLimite==='15/10/2026'&&r.awaiting==='pedagogical_context','prazo é salvo antes do contexto pedagógico');
r=runValidator('aula',{stage:'collecting',awaiting:'pedagogical_context',idade:'6 anos',disciplina:'Português',tema:'sílabas',dataLimite:'20/10/2026'});check(r.state.contextoPedagogico==='aula'&&r.awaiting==='date','contexto pedagógico é coletado');
r=runValidator('qualquer',{stage:'collecting',awaiting:'version',idade:'6 anos',disciplina:'mat',tema:'silaba',dataComemorativa:'não'});check(r.action==='search'&&r.normalizedCaptured&&r.state.disciplina==='Matemática'&&r.state.tema==='sílabas','abreviações e erros comuns são normalizados antes da busca');
r=runValidator('qual é melhor?',{stage:'awaiting_choice',awaiting:'product_choice',lastResults:items});check(r.intent==='comparar_produtos'&&/Comparação rápida/.test(r.text)&&/eu indicaria a Opção/.test(r.text),'comparação curta recomenda uma opção');
r=runValidator('estou muito frustrado',{stage:'collecting',awaiting:'theme'});check(r.humanHandoff&&r.priorityHigh&&r.metricEvents.includes('escalada_automatica'),'frustração aciona escalada de alta prioridade');
r=runValidator('nenhuma opção',{stage:'awaiting_choice',refusalCount:1,lastResults:items});check(r.humanHandoff&&r.priorityHigh,'segunda rejeição aciona atendimento humano');
formatted=runFormatter({products:items},{action:'catalog',state:{},sessionId:'s'});check(/seguintes áreas/.test(formatted.text)&&/Português/.test(formatted.text)&&!/Produto 1/.test(formatted.text),'catálogo dinâmico lista categorias sem despejar produtos');
formatted=runFormatter({products:[]},{action:'search',state:{failedSearches:2},sessionId:'s'});check(formatted.humanHandoff&&formatted.priorityHigh&&formatted.metricEvents.includes('escalada_automatica'),'terceira busca vazia escala para humano');
formatted=runFormatter({products:items},{action:'opening',abVariant:'B',state:{abVariant:'B'},sessionId:'s'});check(/Temos mais de 3 materiais/.test(formatted.text),'variante B usa contagem real do catálogo');
const weekly=flows.attendance.nodes.find(n=>n.name==='Reativação segunda às 10h');check(JSON.stringify(weekly.parameters).includes('10')&&JSON.stringify(weekly.parameters).includes('1'),'reativação semanal agenda segunda-feira às 10h');
const reactivationCode=flows.attendance.nodes.find(n=>n.name==='Selecionar clientes para reativação').parameters.jsCode;check(reactivationCode.includes('21*86400000')&&reactivationCode.includes('7*86400000')&&reactivationCode.includes('Math.min(50'),'reativação exige compra antiga, inatividade e limita 50 contatos');
const reportCode=flows.attendance.nodes.find(n=>n.name==='Formatar relatório diário').parameters.jsCode;check(raw.includes('^ab_(sessao|busca|compra)_([AB])$')&&reportCode.includes('>=100')&&reportCode.includes("winner=ca>=cb?'A':'B'"),'relatório A/B exige amostra mínima de 100 sessões por variante');
check(node('Consultar API da loja').parameters.queryParameters.parameters.some(p=>p.name==='contexto'),'contexto pedagógico é enviado à API quando disponível');
check(node('Mensagem enviada é crítica?').parameters.conditions.conditions[0].leftValue.includes('pendingPurchase')&&node('Mensagem enviada é crítica?').parameters.conditions.conditions[0].leftValue.includes('cupom'),'retry cobre link, pacote e cupom');
check(raw.includes('escalationEnabled')&&raw.includes('escaladaAtiva'),'ESCALADA_AUTOMATICA_ATIVO controla a escalada por conversa');

// Correções específicas dos quatro bugs da V18.1.
for(const required of ['É mensagem nova do cliente?','Verificar msg_processada pelo messageId','MessageId ainda não processado?','Marcar msg_processada por 60 segundos','Buscar sessão iniciada','Sessão já iniciada?','Marcar sessão iniciada por 24 horas','Ler chaves exatas da consulta','Mesclar chaves exatas da consulta','Verificar estado Redis recém-salvo','Confirmar estado Redis antes de avançar','Estado Redis confirmado?','Preparar pipeline dos campos da consulta','Gravar pipeline da consulta','Verificar campos Redis recém-gravados','Confirmar pipeline Redis antes de responder','Pipeline Redis confirmado?','Registrar debug antes da busca','Registrar erro_busca nas métricas','Salvar estado após resultado da busca','Verificar estado após resultado da busca','Confirmar estado da busca antes de responder','Estado da busca confirmado?'])check(Boolean(node(required)),`V18.1 nó presente: ${required}`);
const eventExpr=node('É mensagem nova do cliente?').parameters.conditions.conditions[0].leftValue;check(eventExpr.includes('messages.upsert')&&eventExpr.includes('RECEIVED')&&eventExpr.includes('fromMe'),'entrada aceita somente messages.upsert recebido do cliente');
check(node('Marcar msg_processada por 60 segundos').parameters.ttl===60&&node('Marcar msg_processada por 60 segundos').parameters.key.includes('msg_processada_'),'deduplicação usa messageId e TTL de 60 segundos');
check(main.connections['MessageId ainda não processado?'].main[1].length===0,'messageId repetido é descartado imediatamente');
check(main.connections['Marcar msg_processada por 60 segundos'].main[0][0].node==='Buscar sessão iniciada','marcador de deduplicação é gravado antes do processamento');
check(node('Marcar sessão iniciada por 24 horas').parameters.ttl===86400&&node('Marcar sessão iniciada por 24 horas').parameters.key.includes('sessao_iniciada_'),'sessão iniciada usa TTL de 24 horas');
check(main.connections['Continuar após limpeza'].main[0].length===1&&main.connections['Continuar após limpeza'].main[0][0].node==='Salvar filtros do cliente','estado é a primeira gravação após a decisão');
check(main.connections['Salvar filtros do cliente'].main[0][0].node==='Verificar estado Redis recém-salvo','estado é relido imediatamente após a gravação');
check(main.connections['Pipeline Redis confirmado?'].main[0].some(x=>x.node==='Filtros completos?'),'resposta e busca só avançam após confirmação do pipeline');
const pipelineCode=node('Preparar pipeline dos campos da consulta').parameters.jsCode;for(const suffix of ['idade','ano_escolar','disciplina','tema','habilidade','data_comemorativa'])check(pipelineCode.includes(suffix),`pipeline grava consulta_{sessionId}_${suffix}`);
check(node('Ler chaves exatas da consulta').parameters.keyPattern.includes("'consulta_'"),'validação lê namespace consulta_{sessionId}_*');
check(validator.includes('validRange')&&validator.includes('validTopic')&&validator.includes('state.idade||state.anoEscolar')&&validator.includes('state.disciplina||state.tema||state.habilidade||state.dataComemorativa'),'busca exige faixa e qualquer um dos quatro filtros temáticos');
r=runValidator('buscar agora',{stage:'searching',idade:'6 anos',tema:'sílabas'},{first:false});check(r.action==='search','idade e tema formam combinação válida para busca');
r=runValidator('buscar agora',{stage:'searching',anoEscolar:'1º ano',habilidade:'leitura'},{first:false});check(r.action==='search','ano escolar e habilidade formam combinação válida para busca');
check(node('Registrar debug antes da busca').parameters.key.includes('educalizando:debug:v18:'),'filtros são registrados no debug antes da API');
check(main.connections['Registrar debug antes da busca'].main[0][0].node==='Consultar API da loja','log de debug antecede a consulta da loja');
check(node('Falha na consulta da loja').parameters.assignments.assignments.find(x=>x.name==='text').value==='Tive um problema técnico agora. Pode repetir sua busca?','falha técnica usa a resposta solicitada');
check(node('Registrar erro_busca nas métricas').parameters.messageData.includes("event: 'erro_busca'"),'erro de busca é registrado nas métricas');
check(main.connections['Formatar resultado oficial'].main[0].length===1&&main.connections['Formatar resultado oficial'].main[0][0].node==='Salvar estado após resultado da busca','estado do resultado é salvo antes de qualquer resposta');
check(main.connections['Salvar estado após resultado da busca'].main[0][0].node==='Verificar estado após resultado da busca','estado de busca vazia é relido antes de avançar');
r=runValidator('/reiniciar',{stage:'collecting',idade:'6 anos',tema:'sílabas'},{first:false,resetIntent:true});check(r.resetSession&&r.state.idade==='','/reiniciar reinicia explicitamente a consulta');
r=runValidator('nova busca',{stage:'awaiting_choice',idade:'6 anos',tema:'sílabas'},{first:false,interpreted:{intencao:'reiniciar_busca',reset:true,reply:'',filters:{}}});check(!r.resetSession&&r.state.idade==='6 anos','reinício implícito não apaga a sessão');
const firstGreeting=runValidator('oi',{stage:'idle'},{first:true,intentPrincipal:'SAUDACAO'}),laterGreeting=runValidator('oi',{stage:'idle'},{first:false,intentPrincipal:'SAUDACAO'});check(firstGreeting.action==='reply'&&laterGreeting.action==='reply'&&!firstGreeting.resetSession&&!laterGreeting.resetSession,'saudações não reiniciam nem apagam a sessão');

// Correções específicas da V18.2.
for(const required of ['Classificar tipo da mensagem','Registrar debug do tipo recebido','Switch tipo de mensagem','Entrada TEXTO','Entrada AUDIO','Entrada IMAGEM','Entrada DOCUMENTO','Entrada DESCONHECIDO','Salvar sessão ativa por 24 horas','Buscar perfil persistente por número','Preparar perfil persistente do cliente','Salvar perfil persistente por 30 dias','Atualizar perfil persistente após compra','Salvar perfil persistente após compra','Classificar intenção principal','Normalizar intenção principal'])check(Boolean(node(required)),`V18.2 nó presente: ${required}`);
const classifyCode=node('Classificar tipo da mensagem').parameters.jsCode;
function classify(rawMessage){return new Function('$json',classifyCode)({rawMessage}).json.messageRoute}
check(classify({conversation:'oi',audioMessage:{url:'x'}})==='TEXTO','conversation tem prioridade sobre audioMessage');
check(classify({extendedTextMessage:{text:'boa noite'}})==='TEXTO','extendedTextMessage.text segue pelo branch TEXTO');
check(classify({audioMessage:{url:'x'}})==='AUDIO','audioMessage segue pelo branch AUDIO');
check(classify({imageMessage:{url:'x'}})==='IMAGEM','imageMessage segue pelo branch IMAGEM');
check(classify({documentMessage:{fileName:'x.pdf'}})==='DOCUMENTO','documentMessage segue pelo branch DOCUMENTO');
check(classify({stickerMessage:{}})==='DESCONHECIDO','tipo não previsto segue pelo branch DESCONHECIDO');
const switchRules=node('Switch tipo de mensagem').parameters.rules.values.map(v=>v.outputKey);check(JSON.stringify(switchRules)===JSON.stringify(['TEXTO','AUDIO','IMAGEM','DOCUMENTO']),'Switch mantém a ordem TEXTO, AUDIO, IMAGEM e DOCUMENTO');
check(node('Switch tipo de mensagem').parameters.options.fallbackOutput==='extra'&&main.connections['Switch tipo de mensagem'].main[4][0].node==='Entrada DESCONHECIDO','fallback do Switch segue para DESCONHECIDO');
check(node('Registrar debug do tipo recebido').parameters.ttl===300&&node('Registrar debug do tipo recebido').parameters.key.includes('educalizando:debug:tipo:'),'log de tipo usa TTL de cinco minutos');
const normalizerCode=node('Normalizar mensagem recebida').parameters.jsCode;const normalizeResult=new Function('$json',normalizerCode)({rawMessage:{conversation:'oi',audioMessage:{url:'x'}},mensageType:'audioMessage',conversation:'oi'}).json;check(normalizeResult.message==='oi'&&!normalizeResult.isAudio&&normalizeResult.mediaKind==='text','normalizador nunca trata conversation como áudio');
r=runValidator('conteúdo desconhecido',{stage:'idle'},{messageRoute:'DESCONHECIDO'});check(r.text==='Recebi algo que não consigo processar. Pode digitar sua mensagem? 😊','mídia desconhecida usa o fallback exato');
r=runValidator('texto comum sem intenção',{stage:'idle'},{intentPrincipal:'DESCONHECIDO',interpreted:{intencao:'conversa',reply:'',reset:false,filters:{}}});check(r.text==='Pode me contar mais sobre o que você precisa? 😊','texto desconhecido nunca usa fallback de mídia');
check(node('Salvar sessão ativa por 24 horas').parameters.ttl===86400&&node('Salvar sessão ativa por 24 horas').parameters.key.includes("'sessao_'"),'sessão ativa usa sessao_{sessionId} com TTL de 24 horas');
check(node('Buscar perfil persistente por número').parameters.key.includes('perfil_numero_')&&node('Salvar perfil persistente por 30 dias').parameters.ttl===2592000,'perfil por número usa TTL de 30 dias');
check(node('dados').parameters.assignments.assignments.find(x=>x.name==='numeroLimpo').value.includes("replace(/[^0-9]/g, '')"),'número persistente remove domínio e caracteres especiais');
check(main.connections['Buscar total de compras'].main[0][0].node==='Buscar perfil persistente por número','perfil persistente é lido antes de qualquer resposta');
check(main.connections['Nome capturado?'].main[0].some(x=>x.node==='Salvar nome do cliente')&&main.connections['Nome capturado?'].main[0].some(x=>x.node==='Preparar perfil persistente do cliente'),'nome capturado é gravado na sessão e no perfil');
check(node('Salvar nome do cliente').parameters.ttl===86400,'nome da sessão acompanha o contexto ativo de 24 horas');
check(node('Salvar perfil persistente após compra').parameters.ttl===2592000&&node('Atualizar perfil persistente após compra').parameters.jsCode.includes('ultimaDisciplina'),'perfil mantém total, histórico e última disciplina após compra');
const prompt=node('Classificar intenção principal').parameters.options.systemMessage;for(const token of ['Ignore saudações','BUSCA, COMPRA, SUPORTE, SAUDACAO, DESCONHECIDO','Mensagem: {mensagem_cliente}'])check(prompt.includes(token),`prompt curto contém: ${token}`);
const intentCode=node('Normalizar intenção principal').parameters.jsCode;function shortIntent(message,output='DESCONHECIDO'){const refs={message:{message},'Buscar filtros do cliente':{filterState:'{}'}};const dollar=name=>({item:{json:refs[name]||{}}});return new Function('$json','$',intentCode)({output},dollar).json.intentPrincipal}
for(const message of ['boa noite preciso de um material','bom dia tem material de matemática?','olá, procuro algo para o 3º ano'])check(shortIntent(message)==='BUSCA',`saudação + busca reconhecida: ${message}`);
check(shortIntent('oi quero comprar algo')==='COMPRA','saudação + compra é reconhecida como COMPRA');
check(shortIntent('oi')==='SAUDACAO','saudação pura é reconhecida como SAUDACAO');
for(const message of ['boa noite preciso de um material','bom dia tem material de matemática?','olá, procuro algo para o 3º ano']){r=runValidator(message,{stage:'idle'},{intentPrincipal:'BUSCA'});check(r.awaiting==='age_or_year'&&r.intent==='iniciar_ficha',`BUSCA inicia coleta sem repetir saudação: ${message}`)}
check(node('Marcar sessão iniciada por 24 horas').parameters.ttl===86400,'sessao_iniciada mantém TTL de 24 horas');
const cleanupText=main.nodes.filter(n=>/^Limpar consulta/.test(n.name)).map(n=>JSON.stringify(n.parameters)).join('\n');check(!cleanupText.includes('sessao_iniciada_'),'limpeza normal nunca apaga sessao_iniciada');

for(const c of checks)console.log(`${c.ok?'OK':'FALHA'} - ${c.label}`);
console.log(`\n${checks.filter(x=>x.ok).length}/${checks.length} verificações aprovadas`);

