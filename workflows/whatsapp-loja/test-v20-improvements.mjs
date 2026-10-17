import assert from 'node:assert/strict';
import {conversationTools,interpretConversation,prepareCandidates,composeResponse,finishConversationReply} from './v20-conversation.mjs';
const T=conversationTools();
const fresh=()=>({cfg:{},mensagem:'',state:{filtros:T.defaults(),resultados:[{id:'a',titulo:'Letras'},{id:'b',titulo:'Sílabas'}],vistos:['a','b'],historico:[],ultimaBusca:{query:{section:'all',q:'leitura',category:'cat',maxPrice:20,page:1},page:1}},catalogContext:{store:{id:'s'},facets:{}}});
for(const [message,id] of [['quero o primeiro','a'],['ver o segundo','b'],['aquele último','b']]) {const x=fresh();x.mensagem=message;const r=interpretConversation(x,{acao:'responder'});assert.equal(r.consultaEscolhida.id,id);assert.equal(r.queries[0].id,id);}
let x=fresh();x.mensagem='quero esse';assert.equal(interpretConversation(x,{acao:'comprar'}).rota,'resposta');
x=fresh();x.mensagem='outro parecido';const more=interpretConversation(x,{acao:'responder'});assert.equal(more.excluirVistos,true);assert.equal(more.queries[0].q,'leitura');assert.equal(more.queries[0].maxPrice,20);
x=fresh();x.mensagem='tentar novamente';const retry=interpretConversation(x,{acao:'responder'});assert.deepEqual(retry.queries[0],{section:'all',q:'leitura',category:'cat',maxPrice:20,page:1});
x=fresh();let r=interpretConversation(x,{acao:'atendente'});assert.equal(r.handoff,true);assert.match(finishConversationReply(r,{resposta:'Vou encaminhar'}).texto,/pausada/);
x=fresh();x.cfg.numeroAtendente='5511999999999';assert.equal(interpretConversation(x,{acao:'atendente'}).handoff,true);
x=fresh();x.state.resultados=[{id:'a',titulo:'Letras'}];x.mensagem='posso revender?';r=interpretConversation(x,{acao:'responder'});assert.equal(r.detalhe,'licenca');
const body={scope:{privateToStore:true},store:{id:'s',slug:'teste'},products:[{id:'a',title:'Letras',price:12,isPlr:true,plr:{price:25,description:'Revenda conforme os termos cadastrados',publicUrl:'https://www.educalizando.com.br/loja/teste/produto/letras?licenca=plr'},publicUrl:'https://www.educalizando.com.br/loja/teste/produto/letras',coverUrl:'https://arquivos.educalizando.com.br/capa.webp'}]};
let output=composeResponse(prepareCandidates(r,[body]),null);assert.match(output.envios[0].texto,/Versão final/);assert.match(output.envios[0].texto,/Versão PLR/);assert.match(output.envios[0].texto,/Revenda conforme/);assert.doesNotMatch(output.envios[0].texto,/ilimitad|qualquer uso/);
const failed=composeResponse(prepareCandidates(r,[{error:'timeout'}]),{resposta:'Não temos'});assert.equal(failed.metricKey,'consulta_falhou');assert.doesNotMatch(failed.envios[0].texto,/Não temos/);
console.log('PASS melhorias conversacionais: referências, ambiguidade, busca combinada, repetição, licença e encaminhamento seguro. Sem mensagens enviadas.');

