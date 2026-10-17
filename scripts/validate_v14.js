const fs = require('fs');
const assert = require('assert');

const main = JSON.parse(fs.readFileSync('ATENDENTE EDUCALIZANDO ENTERPRISE V14.json', 'utf8'));
const worker = JSON.parse(fs.readFileSync('RECUPERADOR DE MENSAGENS ENTERPRISE V14.json', 'utf8'));
const nodes = Object.fromEntries(main.nodes.map((node) => [node.name, node]));
const workerNodes = Object.fromEntries(worker.nodes.map((node) => [node.name, node]));

function run(code, { json = {}, refs = {}, inputItems = [{ json }] } = {}) {
  const ref = (name) => ({ item: { json: refs[name] || {} } });
  return Function('$json', '$', '$input', code)(json, ref, { first: () => inputItems[0] });
}
function checkGraph(workflow) {
  const names = workflow.nodes.map((node) => node.name);
  const ids = workflow.nodes.map((node) => node.id);
  assert.equal(new Set(names).size, names.length, `${workflow.name}: nome duplicado`);
  assert.equal(new Set(ids).size, ids.length, `${workflow.name}: id duplicado`);
  const known = new Set(names);
  for (const [source, groups] of Object.entries(workflow.connections || {})) {
    assert(known.has(source), `${workflow.name}: origem ausente ${source}`);
    for (const channel of Object.values(groups || {})) for (const branch of channel || []) for (const edge of branch || []) assert(known.has(edge.node), `${workflow.name}: destino ausente ${edge.node}`);
  }
  for (const node of workflow.nodes.filter((node) => node.type === 'n8n-nodes-base.code')) Function('$json', '$', '$input', node.parameters.jsCode || node.parameters.functionCode);
}
checkGraph(main);
checkGraph(worker);
assert.equal(main.nodes.length, 60);
assert.equal(worker.nodes.length, 10);
assert.equal(main.active, false);
assert.equal(worker.active, false);
assert(JSON.stringify(main).includes('educalizando:outbox:v14'));
assert(JSON.stringify(main).includes('educalizando:latest:v14'));
assert(JSON.stringify(main).includes('educalizando:events:v14'));
assert(JSON.stringify(worker).includes('educalizando:deadletter:v14'));
assert(!JSON.stringify(main).includes('educalizando:outbox:v13'));

const products = Array.from({ length: 7 }, (_, index) => ({
  id: `p${index + 1}`,
  title: index === 0 ? 'Jogo das Sílabas' : index === 1 ? 'Atividade das Emoções' : `Material Educacional ${index + 1}`,
  description: `Descrição oficial ${index + 1}`,
  price: 7 + index,
  publicUrl: `https://loja/final-${index + 1}`,
  coverUrl: `https://cdn/capa-${index + 1}.jpg`,
  isPlr: true,
  plr: { price: 19 + index, publicUrl: `https://loja/plr-${index + 1}` },
}));
const format = nodes['Formatar resultado oficial'].parameters.jsCode;
const validator = nodes['Validar e mesclar filtros'].parameters.jsCode;
const searchSource = { action: 'search', currentMessage: 'material para 6 anos', query: 'alfabetização', state: { idade: '6 anos', tema: 'alfabetização', lastSearchQuery: 'alfabetização', seenProductIds: [] } };
const page1 = run(format, { json: { products }, refs: { 'Validar e mesclar filtros': searchSource } }).json;
assert.equal(page1.deliveries.length, 3);
assert.deepEqual(page1.deliveries.map((item) => item.text.split('\n')[0]), ['📚 OPÇÃO 1 DE 3', '📚 OPÇÃO 2 DE 3', '📚 OPÇÃO 3 DE 3']);
let state = JSON.parse(page1.stateJson);
assert.deepEqual(state.seenProductIds, ['p1', 'p2', 'p3']);
assert.equal(state.stage, 'awaiting_choice');
assert.equal(state.awaiting, 'product_choice');
assert.equal(state.lastProduct, null);

function validate(message, previousState, interpreted = {}) {
  return run(validator, {
    json: { output: JSON.stringify({ intencao: 'conversa', reply: 'genérico', reset: false, filters: {}, ...interpreted }) },
    refs: { 'Buscar filtros do cliente': { filterState: JSON.stringify(previousState) }, message: { message } },
  }).json;
}

const choose2 = validate('Opção 2', state);
assert.equal(choose2.action, 'reply');
assert.equal(choose2.state.lastProduct.id, 'p2');
assert.equal(choose2.state.stage, 'awaiting_version');
assert(choose2.text.includes('Atividade das Emoções'));
const buy = validate('quero comprar', choose2.state);
assert.equal(buy.action, 'reply');
assert.equal(buy.state.stage, 'checkout');
assert.equal(buy.state.awaiting, 'link_confirmation');
assert(buy.text.includes(products[1].publicUrl));
assert(buy.text.includes(products[1].plr.publicUrl));
assert(!buy.text.includes(products[0].publicUrl));

const success = validate('sim, consegui', buy.state);
assert.equal(success.action, 'reply');
assert.equal(success.state.stage, 'idle');
assert(success.text.includes('Fico feliz'));
const failed = validate('não abriu', buy.state);
assert.equal(failed.action, 'store_info');
assert.equal(failed.state.humanRequested, true);
assert.equal(failed.state.stage, 'human');

const more = validate('mais opções', state);
assert.equal(more.action, 'search');
assert.equal(more.state.moreResults, true);
assert.equal(more.query, 'alfabetização');
const page2Source = { ...more, state: more.state };
const page2 = run(format, { json: { products }, refs: { 'Validar e mesclar filtros': page2Source } }).json;
assert.deepEqual(page2.deliveries.map((item) => item.title), ['Material Educacional 4', 'Material Educacional 5', 'Material Educacional 6']);
const page2State = JSON.parse(page2.stateJson);
assert.deepEqual(page2State.seenProductIds, ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']);
const moreAgain = validate('mostre mais', page2State);
const page3 = run(format, { json: { products }, refs: { 'Validar e mesclar filtros': { ...moreAgain, state: moreAgain.state } } }).json;
assert.equal(page3.deliveries.length, 1);
assert.equal(page3.deliveries[0].title, 'Material Educacional 7');

const compare = validate('qual é melhor?', state);
assert.equal(compare.action, 'reply');
assert(compare.text.includes('Opção 1'));
assert(compare.text.includes('Opção 2'));
const cheapest = validate('qual é o mais barato?', state);
assert.equal(cheapest.state.lastProduct.id, 'p1');
assert(cheapest.text.includes('menor valor'));
const both = validate('quero os dois', state);
assert.equal(both.action, 'reply');
assert(both.text.includes(products[0].publicUrl));
assert(both.text.includes(products[1].publicUrl));

const newSearch = validate('quero um material de matemática para 6 anos', state, { intencao: 'buscar_material', filters: { disciplina: 'matemática', idade: '6 anos' } });
assert.equal(newSearch.action, 'search');
assert.deepEqual(newSearch.state.seenProductIds, []);
assert.equal(newSearch.state.lastProduct, null);

assert.deepEqual(main.connections['Marcar mensagem em processamento'].main[0].map((x) => x.node), ['Registrar mensagem mais recente']);
assert.deepEqual(main.connections['Validar e mesclar filtros'].main[0].map((x) => x.node), ['Conferir atualidade antes de decidir']);
assert.deepEqual(main.connections['Decisão ainda atual?'].main[0].map((x) => x.node).sort(), ['Filtros completos?', 'Registrar evento de atendimento', 'Salvar filtros do cliente'].sort());
assert.deepEqual(main.connections['Catálogo ainda atual?'].main[0].map((x) => x.node).sort(), ['Preparar até 3 produtos e acompanhamento', 'Salvar contexto do catálogo'].sort());
assert.deepEqual(main.connections['Loop sequencial de envios'].main[1].map((x) => x.node), ['Conferir atualidade de cada item']);
assert.deepEqual(main.connections['Item ainda atual?'].main[0].map((x) => x.node), ['Item comercial tem capa?']);

assert.equal(workerNodes['A cada 5 segundos'].parameters.rule.interval[0].secondsInterval, 5);
assert(workerNodes['Preparar nova tentativa'].parameters.jsCode.includes('attempt<=5'));
assert.deepEqual(worker.connections['Ainda pode tentar?'].main[0].map((x) => x.node), ['Recolocar na fila']);
assert.deepEqual(worker.connections['Ainda pode tentar?'].main[1].map((x) => x.node), ['Registrar falha permanente']);

console.log(JSON.stringify({
  ok: true,
  mainNodes: main.nodes.length,
  workerNodes: worker.nodes.length,
  tested: ['escolha', 'compra', 'pós-compra', 'falha de link', 'mais opções', 'sem repetição', 'comparação', 'menor preço', 'dois produtos', 'nova busca', 'cancelamento de respostas antigas', 'dead-letter'],
}, null, 2));
