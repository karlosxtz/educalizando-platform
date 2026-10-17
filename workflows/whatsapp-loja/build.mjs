import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import * as runtime from './runtime.mjs';

const helpers = Object.values(runtime).map(fn => fn.toString().replace(/^function /, 'function ')).join('\n');
const nodes = [];
const connections = {};
const add = (name, type, parameters, extra = {}) => {
  nodes.push({ id: randomUUID(), name, type, typeVersion: type.endsWith('.httpRequest') ? 4.2 : type.endsWith('.code') ? 2 : type.endsWith('.if') ? 2.2 : type.endsWith('.webhook') ? 2 : 1,
    position: [nodes.length * 220, 0], parameters, ...extra });
};
const connect = (from, to, output = 0) => {
  connections[from] ||= { main: [] };
  connections[from].main[output] ||= [];
  connections[from].main[output].push({ node: to, type: 'main', index: 0 });
};
const code = (name, source) => add(name, 'n8n-nodes-base.code', { jsCode: helpers + '\n' + source });
const gate = (name, expression) => add(name, 'n8n-nodes-base.if', { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ id: randomUUID(), leftValue: expression, rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} });
const redis = (name, parameters) => add(name, 'n8n-nodes-base.redis', parameters);
const http = (name, url, body, credentialType = 'httpHeaderAuth', errorMode = 'continueRegularOutput') => add(name, 'n8n-nodes-base.httpRequest', {
  method: 'POST', url, authentication: credentialType === 'groqApi' ? 'predefinedCredentialType' : 'genericCredentialType',
  ...(credentialType === 'groqApi' ? { nodeCredentialType: 'groqApi' } : { genericAuthType: 'httpHeaderAuth' }),
  sendBody: true, specifyBody: 'json', jsonBody: body, options: { timeout: 20000 },
}, { onError: errorMode });

add('Webhook Evolution', 'n8n-nodes-base.webhook', { httpMethod: 'POST', path: 'educalizando-loja-v1', authentication: 'headerAuth', responseMode: 'onReceived', options: {} }, { webhookId: randomUUID() });
code('Configuração', `return [{json: {instanceName: 'PREENCHER_INSTANCIA', evolutionBaseUrl: 'https://PREENCHER_EVOLUTION', catalogUrl: 'https://www.educalizando.com.br/api/integrations/store-chatbot', groqModel: 'llama-3.3-70b-versatile', testMode: true, testPhone: ''}}];`);
code('Normalizar entrada', String.raw`const config=$input.first().json;
if (!config.instanceName || config.instanceName.startsWith('PREENCHER') || config.evolutionBaseUrl.includes('PREENCHER')) throw new Error('Configure a instância e o endereço da Evolution no nó Configuração.');
const origin=new URL(config.evolutionBaseUrl); if(origin.protocol!=='https:') throw new Error('Use HTTPS na Evolution.');
if(config.evolutionBaseUrl.endsWith('/')) config.evolutionBaseUrl=config.evolutionBaseUrl.slice(0,-1);
if(config.catalogUrl!=='https://www.educalizando.com.br/api/integrations/store-chatbot') throw new Error('Use o endpoint oficial da loja Educalizando.');
if(config.testMode&&!/^\d{10,15}$/.test(String(config.testPhone).replace(/\D/g,''))) throw new Error('Configure seu telefone de teste antes de executar.');
const input=normalizeInput($('Webhook Evolution').first().json.body, config); return input?[{json:input}]:[];`);
redis('Deduplicar mensagem', { operation: 'incr', key: "={{ $('Normalizar entrada').first().json.dedupKey }}", expire: true, ttl: 86400 });
gate('Primeira entrega?', '={{ Number(Object.values($json)[0]) === 1 }}');
redis('Revisão da conversa', { operation: 'incr', key: "={{ $('Normalizar entrada').first().json.revisionKey }}", expire: true, ttl: 3600 });
code('Guardar revisão', `return [{json:{...$('Normalizar entrada').first().json, revision:Number(Object.values($input.first().json)[0])}}];`);
redis('Ler sessão', { operation: 'get', key: '={{ $json.stateKey }}', propertyName: 'session', keyType: 'string', options: {} });
code('Preparar conversa', `const input=$('Guardar revisão').first().json; const context=prepareConversation(input,$input.first().json.session); return context?[{json:context}]:[];`);
gate('Precisa da Groq?', '={{ $json.needsAI }}');
http('Interpretar com Groq', 'https://api.groq.com/openai/v1/chat/completions', '={{ JSON.stringify($json.groqBody) }}', 'groqApi');
code('Validar interpretação', `return [{json:validateDecision($('Preparar conversa').first().json,$input.first().json)}];`);
gate('Consultar catálogo?', '={{ $json.needsCatalog }}');
add('Consultar API da loja', 'n8n-nodes-base.httpRequest', {
  method: 'GET', url: "={{ $('Normalizar entrada').first().json.config.catalogUrl }}", authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth',
  sendQuery: true, queryParameters: { parameters: [
    { name: 'q', value: "={{ $('Validar interpretação').first().json.decision.productId ? '' : ($('Validar interpretação').first().json.decision.query || $('Validar interpretação').first().json.state.lastQuery || '') }}" },
    { name: 'id', value: "={{ $('Validar interpretação').first().json.decision.productId || '' }}" },
    { name: 'pageSize', value: '20' },
    { name: 'section', value: "={{ $('Validar interpretação').first().json.decision.license === 'plr' ? 'plr' : 'all' }}" },
  ] }, options: { timeout: 25000 },
}, { onError: 'continueRegularOutput' });
code('Resposta com dados oficiais', `return [{json:formatReply($('Validar interpretação').first().json,$input.first().json)}];`);
redis('Conferir revisão atual', { operation: 'get', key: '={{ $json.revisionKey }}', propertyName: 'latestRevision', keyType: 'string', options: {} });
gate('Resposta ainda atual?', "={{ Number($json.latestRevision) === $('Guardar revisão').first().json.revision }}");
code('Preparar envio', `return [{json:$('Resposta com dados oficiais').first().json}];`);
gate('Enviar capa?', '={{ Boolean($json.imageUrl) }}');
http('Enviar material com capa', "={{ $json.config.evolutionBaseUrl + '/message/sendMedia/' + encodeURIComponent($json.config.instanceName) }}", '={{ JSON.stringify({number:$json.phone,mediatype:"image",media:$json.imageUrl,caption:$json.reply}) }}', 'httpHeaderAuth', 'continueErrorOutput');
http('Enviar resposta em texto', "={{ $json.config.evolutionBaseUrl + '/message/sendText/' + encodeURIComponent($json.config.instanceName) }}", '={{ JSON.stringify({number:$json.phone,text:$json.reply,linkPreview:false}) }}', 'httpHeaderAuth', 'continueErrorOutput');
code('Confirmar envio', `const result=$input.first().json; if(!result.key?.id&&!result.data?.key?.id) throw new Error('A Evolution não confirmou o envio. Verifique esta execução antes de reenviar para evitar mensagens duplicadas.'); return [{json:{...$('Preparar envio').first().json,sentAt:new Date().toISOString()}}];`);
redis('Salvar sessão após envio', { operation: 'set', key: '={{ $json.stateKey }}', value: '={{ JSON.stringify($json.nextState) }}', keyType: 'string', expire: true, ttl: 43200 });
redis('Registrar recibo', { operation: 'set', key: '={{ $json.receiptKey }}', value: '={{ JSON.stringify({status:"sent",sentAt:$json.sentAt}) }}', keyType: 'string', expire: true, ttl: 86400 });
code('Envio não confirmado', `const previous=$('Preparar envio').first().json; return [{json:{...previous,failedAt:new Date().toISOString()}}];`);
redis('Registrar falha de entrega', { operation: 'set', key: '={{ $json.receiptKey }}', value: '={{ JSON.stringify({status:"failed",failedAt:$json.failedAt,reply:$json.reply}) }}', keyType: 'string', expire: true, ttl: 86400 });

const chain = ['Webhook Evolution','Configuração','Normalizar entrada','Deduplicar mensagem','Primeira entrega?','Revisão da conversa','Guardar revisão','Ler sessão','Preparar conversa','Precisa da Groq?'];
for(let i=1;i<chain.length;i++) connect(chain[i-1],chain[i]);
connect('Precisa da Groq?','Interpretar com Groq'); connect('Precisa da Groq?','Validar interpretação',1);
connect('Interpretar com Groq','Validar interpretação'); connect('Validar interpretação','Consultar catálogo?');
connect('Consultar catálogo?','Consultar API da loja'); connect('Consultar catálogo?','Resposta com dados oficiais',1);
connect('Consultar API da loja','Resposta com dados oficiais'); connect('Resposta com dados oficiais','Conferir revisão atual');
connect('Conferir revisão atual','Resposta ainda atual?'); connect('Resposta ainda atual?','Preparar envio'); connect('Preparar envio','Enviar capa?');
connect('Enviar capa?','Enviar material com capa'); connect('Enviar capa?','Enviar resposta em texto',1);
for(const name of ['Enviar material com capa','Enviar resposta em texto']) { connect(name,'Confirmar envio'); connect(name,'Envio não confirmado',1); }
connect('Confirmar envio','Salvar sessão após envio'); connect('Salvar sessão após envio','Registrar recibo'); connect('Envio não confirmado','Registrar falha de entrega');

// Compact canvas: input, interpretation, catalog, delivery; clear separate branches.
nodes.forEach((node,index)=>{node.position=[(index%8)*240,Math.floor(index/8)*300];});
add('Leia antes de ativar', 'n8n-nodes-base.stickyNote', { content: '## Educalizando — atendimento da sua loja\nFluxo DESATIVADO e em modo de teste.\n1. Configure instância e URL da Evolution, telefone de teste.\n2. Selecione Redis, Groq, chave da API da loja, apikey Evolution e autenticação do webhook nos nós.\n3. Cadastre MESSAGES_UPSERT na Evolution com o mesmo header secreto do webhook.\n4. Teste antes de desligar testMode.\nA IA só interpreta intenções. Preços e links vêm da API, nunca da IA.\nAtendimento humano pausa o bot; não envia notificações nem confirma pagamento.\nNão reutilize um webhook já usado por outro bot ativo.', height: 400, width: 440 }, { typeVersion: 1, position: [-500, 0] });
const workflow = { name: 'Educalizando — WhatsApp da loja · Evolution + Redis + Groq', nodes, connections, active: false,
  settings: { executionOrder: 'v1', saveDataErrorExecution: 'none', saveDataSuccessExecution: 'none', saveManualExecutions: false, executionTimeout: 120 },
  pinData: {}, tags: [], meta: { templateCredsSetupCompleted: false } };
fs.writeFileSync(new URL('./educalizando-whatsapp-loja.json', import.meta.url), JSON.stringify(workflow,null,2)+'\n');
console.log('Workflow draft generated: '+nodes.length+' nodes. Inactive, no secrets, test mode enabled.');
