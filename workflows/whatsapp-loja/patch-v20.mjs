import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {conversationTools,SYSTEM_PROMPT,WRITER_PROMPT,interpretConversation,prepareCandidates,composeResponse,splitDeliveries,buildReplyContext,finishConversationReply} from './v20-conversation.mjs';

const workflow=JSON.parse(await readFile('.cloudflare/v20-original.json','utf8'));
const get=name=>{const n=workflow.nodes.find(n=>n.name===name);if(!n)throw new Error('Missing node: '+name);return n;};
const code=(name,fn,call)=>{get(name).parameters.jsCode=conversationTools.toString()+'\n'+fn.toString()+'\n'+call;};
const prepare=get('Preparar contexto IA');
let source=prepare.parameters.jsCode;
source=source.replace('v: 20, nome:', 'v: 21, nome:');
source=conversationTools.toString()+'\nconst SISTEMA = '+JSON.stringify(SYSTEM_PROMPT)+';\n'+source.slice(source.indexOf('const base ='));
source=source.replace(/const FILTROS = \(\) => \(\{[^\n]+\}\);/, 'const FILTROS = () => ('+JSON.stringify(conversationTools().defaults())+');');
source=source.replace('const payload = {', 'const apiContext = $input.first().json || {};\nconst catalogContext = apiContext.scope?.privateToStore === true ? apiContext : {};\nconst payload = {\n  loja: catalogContext.store || null,\n  catalogoDisponivel: catalogContext.facets || null,');
source=source.replace('let novaConversa = !raw;', "let novaConversa = !raw;\nif(Number(state.v||0)<21) {state.filtros=FILTROS();state.resultados=[];state.remainingResults=[];state.escolhido=null;state.vistos=[];state.ultimaBusca=null;state.historico=[];state.v=21;novaConversa=true;}");
source=source.replace('  mensagemAtual: mensagem,', "  prioridadeUltimaMensagem: true, tipoMensagem: /^(opa )?(oi|ola|bom dia|boa tarde|boa noite)/.test(conversationTools().normalize(mensagem)) ? 'saudacao-ou-abertura' : 'pedido',\n  mensagemAtual: mensagem,");
source=source.replace(/const systemPrompt = SISTEMA[^\n]+;/,'const systemPrompt = SISTEMA.replace("[[AGENTE]]",cfg.agente).replace("[[SITE]]",cfg.lojaSite);');
source=source.replace('systemPrompt, promptUsuario:', 'systemPrompt, catalogContext, promptUsuario:');
prepare.parameters.jsCode=source;
code('Interpretar resposta IA',interpretConversation,"return [{json:interpretConversation($('Preparar contexto IA').first().json,$input.first().json.output)}];");
get('Expandir consultas').parameters.jsCode="const I=$('Interpretar resposta IA').first().json;\nreturn (I.queries||[]).map(query=>({json:{...query}}));";
code('Preparar candidatos',prepareCandidates,"return [{json:prepareCandidates($('Interpretar resposta IA').first().json,$input.all().map(item=>item.json))}];");
code('Montar resposta da busca',composeResponse,"return [{json:composeResponse($('Preparar candidatos').first().json,$input.first().json.output)}];");
get('Dividir envios').parameters.jsCode=splitDeliveries.toString()+"\nreturn splitDeliveries($input.first().json).map(json=>({json}));";
const request=get('Consultar loja');
request.parameters.sendQuery=true;
request.parameters.specifyQuery='json';
request.parameters.jsonQuery='={{ JSON.stringify($json) }}';
delete request.parameters.queryParameters;
request.parameters.options.timeout=25000;
request.onError='continueRegularOutput';
const curator=get('Curador IA');
curator.onError='continueRegularOutput';
curator.parameters.options.systemMessage=WRITER_PROMPT;
get('Modelo Gemini').parameters.options={...get('Modelo Gemini').parameters.options,temperature:0.55,maxOutputTokens:1600};
// No empty or duplicate "searching..." WhatsApp messages: proceed to the lookup.
workflow.connections['É busca?'].main[0]=[{node:'Expandir consultas',type:'main',index:0}];
get('Avisar busca').disabled=true;
const context={
  id:randomUUID(),name:'Consultar contexto da loja',type:'n8n-nodes-base.httpRequest',typeVersion:4.2,
  position:[prepare.position[0]-260,prepare.position[1]],
  parameters:{url:"={{ $('Consolidar mensagens').first().json.cfg.lojaApi }}",sendQuery:true,
    queryParameters:{parameters:[{name:'section',value:'facets'}]},sendHeaders:true,
    headerParameters:{parameters:[{name:'Authorization',value:"={{ 'Bearer ' + $('Consolidar mensagens').first().json.cfg.lojaToken }}"}]},
    options:{timeout:25000,response:{response:{responseFormat:'json'}}}},
  onError:'continueRegularOutput',
};
workflow.nodes.push(context);
workflow.connections['Carregar estado'].main[0]=[{node:context.name,type:'main',index:0}];
workflow.connections[context.name]={main:[[{node:prepare.name,type:'main',index:0}]]};
const naturalContext={id:randomUUID(),name:'Preparar resposta natural',type:'n8n-nodes-base.code',typeVersion:2,position:[prepare.position[0]+550,prepare.position[1]+450],parameters:{jsCode:buildReplyContext.toString()+"\nconst I=$input.first().json;\nreturn [{json:{...I,promptResposta:JSON.stringify(buildReplyContext(I))}}];"}};
const writer=JSON.parse(JSON.stringify(get('Agente conversa')));
writer.id=randomUUID();writer.name='Responder conversa IA';writer.position=[naturalContext.position[0]+250,naturalContext.position[1]];
writer.parameters.text='={{ $json.promptResposta }}';
writer.parameters.options.systemMessage=WRITER_PROMPT;
writer.onError='continueRegularOutput';
const naturalFinish={id:randomUUID(),name:'Finalizar resposta natural',type:'n8n-nodes-base.code',typeVersion:2,position:[writer.position[0]+250,writer.position[1]],parameters:{jsCode:conversationTools.toString()+'\n'+finishConversationReply.toString()+"\nreturn [{json:finishConversationReply($('Preparar resposta natural').first().json,$input.first().json.output)}];"}};
workflow.nodes.push(naturalContext,writer,naturalFinish);
workflow.connections['É busca?'].main[1]=[{node:naturalContext.name,type:'main',index:0}];
workflow.connections[naturalContext.name]={main:[[{node:writer.name,type:'main',index:0}]]};
workflow.connections[writer.name]={main:[[{node:naturalFinish.name,type:'main',index:0}]]};
workflow.connections[naturalFinish.name]={main:[[{node:'Dividir envios',type:'main',index:0}]]};
workflow.connections['Modelo Gemini'].ai_languageModel[0].push({node:writer.name,type:'ai_languageModel',index:0});
get('Nota 48').parameters.content='## V20 — conversa natural e capas\nIA interpreta e redige as respostas com o catálogo real. Saudação não vira catálogo. Filtros toleram abreviações e erros. Preços e links são oficiais; URLs validadas sem depender do construtor URL do sandbox. Máximo dois materiais por resposta.';
// Runtime credential references and webhook identity stay unchanged.
workflow.settings={...workflow.settings};
delete workflow.pinData;
await mkdir('.cloudflare',{recursive:true});
await writeFile('.cloudflare/v20-updated.json',JSON.stringify(workflow,null,2));
const publicCopy=JSON.parse(JSON.stringify(workflow));
publicCopy.active=false;
delete publicCopy.id;delete publicCopy.versionId;delete publicCopy.activeVersionId;
publicCopy.nodes.find(n=>n.name==='Normalizar entrada').parameters.jsCode=publicCopy.nodes.find(n=>n.name==='Normalizar entrada').parameters.jsCode.replace(/edu_live_[A-Za-z0-9_-]+/g,'CONFIGURE_LOJA_TOKEN');
await writeFile('workflows/whatsapp-loja/ATENDENTE-EDUCALIZANDO-V20-ATUALIZADO-template.json',JSON.stringify(publicCopy,null,2));
console.log('V20 preparada: '+workflow.nodes.length+' nós; cópia privada preserva credenciais; template sem chave da loja.');
