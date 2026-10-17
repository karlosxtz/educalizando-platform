const fs = require('fs');
const assert = require('assert');

const main = JSON.parse(fs.readFileSync('ATENDENTE EDUCALIZANDO CONSULTA GUIADA V15.json', 'utf8'));
const worker = JSON.parse(fs.readFileSync('RECUPERADOR DE MENSAGENS V15.json', 'utf8'));
const nodes = Object.fromEntries(main.nodes.map((node) => [node.name, node]));

function run(code, { json = {}, refs = {}, inputItems = [{ json }] } = {}) {
  return Function('$json', '$', '$input', code)(json, (name) => ({ item: { json: refs[name] || {} } }), { first: () => inputItems[0] });
}
function checkGraph(workflow) {
  const names = workflow.nodes.map((node) => node.name);
  assert.equal(new Set(names).size, names.length, `${workflow.name}: nomes duplicados`);
  assert.equal(new Set(workflow.nodes.map((node) => node.id)).size, workflow.nodes.length, `${workflow.name}: IDs duplicados`);
  const known = new Set(names);
  for (const [source, groups] of Object.entries(workflow.connections || {})) {
    assert(known.has(source), `origem ausente ${source}`);
    for (const channel of Object.values(groups || {})) for (const branch of channel || []) for (const edge of branch || []) assert(known.has(edge.node), `destino ausente ${edge.node}`);
  }
  for (const node of workflow.nodes.filter((node) => node.type === 'n8n-nodes-base.code')) Function('$json', '$', '$input', node.parameters.jsCode || node.parameters.functionCode);
}
checkGraph(main);
checkGraph(worker);
assert.equal(main.nodes.length, 64);
assert.equal(worker.nodes.length, 10);
assert.equal(main.active, false);
assert.equal(worker.active, false);
assert(JSON.stringify(main).includes('educalizando:outbox:v15'));
assert(JSON.stringify(main).includes('educalizando:filtros:v15'));
assert(JSON.stringify(worker).includes('educalizando:deadletter:v15'));

const router = nodes['Roteamento instantâneo'].parameters.jsCode;
const validator = nodes['Validar e mesclar filtros'].parameters.jsCode;
const formatter = nodes['Formatar resultado oficial'].parameters.jsCode;
function route(message, state = {}) {
  return run(router, { json: { filterState: JSON.stringify(state) }, refs: { message: { message }, 'Normalizar mensagem recebida': { message }, dados: { conversation: message } } }).json;
}
function validate(message, state = {}, interpreted = {}) {
  return run(validator, {
    json: { output: JSON.stringify({ intencao: 'conversa', reply: '', reset: false, filters: {}, ...interpreted }) },
    refs: { 'Buscar filtros do cliente': { filterState: JSON.stringify(state) }, message: { message } },
  }).json;
}
function routeAndValidate(message, state = {}) {
  const routed = route(message, state);
  assert.equal(routed.useAI, false, `${message}: não deveria depender de IA`);
  return run(validator, { json: routed, refs: { 'Buscar filtros do cliente': { filterState: JSON.stringify(state) }, message: { message } } }).json;
}

for (const message of ['Você pode me ajudar a escolher um material?', 'Quero um material', 'Preciso de ajuda para encontrar um material']) {
  const routed = route(message);
  assert.equal(JSON.parse(routed.output).intencao, 'solicitar_filtros');
  const result = routeAndValidate(message);
  assert.equal(result.action, 'reply');
  assert.equal(result.query, '');
  assert(result.text.includes('Idade:'));
  assert(result.text.includes('Ano escolar:'));
  assert(result.text.includes('Data comemorativa:'));
  assert(result.text.includes('Tipo de versão:'));
}

const naturalGuess = validate('Quero material de sílabas para 6 anos', {}, { intencao: 'buscar_material', filters: { idade: '6 anos', tema: 'sílabas' } });
assert.equal(naturalGuess.action, 'reply', 'texto livre não deve disparar busca');
assert.equal(naturalGuess.query, '');
assert(naturalGuess.text.includes('copie esta ficha'));

const completeForm = [
  'Idade: 6 anos',
  'Ano escolar: 1º ano',
  'Disciplina: Português',
  'Tema ou conteúdo: Sílabas',
  'Habilidade ou objetivo: alfabetização',
  'Data comemorativa: não',
  'Tipo de versão: qualquer',
  'Nome do produto:',
].join('\n');
const routedForm = route(completeForm);
assert.equal(JSON.parse(routedForm.output).intencao, 'buscar_material');
const submitted = routeAndValidate(completeForm);
assert.equal(submitted.action, 'search');
assert.equal(submitted.query, 'Sílabas');
assert.equal(submitted.state.idade, '6 anos');
assert.equal(submitted.state.anoEscolar, '1º ano');
assert.equal(submitted.state.disciplina, 'Português');
assert.equal(submitted.state.tema, 'Sílabas');
assert.equal(submitted.state.dataComemorativa, 'não');
assert.equal(submitted.state.filterFormSubmitted, true);

const incompleteForm = ['Idade: 6 anos', 'Ano escolar:', 'Disciplina:', 'Tema ou conteúdo:', 'Habilidade ou objetivo:', 'Data comemorativa: não'].join('\n');
const incomplete = routeAndValidate(incompleteForm);
assert.equal(incomplete.action, 'reply');
assert.equal(incomplete.query, '');
assert(incomplete.text.includes('Ainda faltam'));
assert(incomplete.text.includes('Tema ou conteúdo:'));

const products = [
  { id: 'p1', title: 'Jogo das Sílabas', description: 'Descrição oficial.', price: 7, publicUrl: 'https://loja/final-1', coverUrl: 'https://cdn/capa-1.jpg', isPlr: true, plr: { price: 19, publicUrl: 'https://loja/plr-1' } },
  { id: 'p2', title: 'Sílabas para Alfabetização', description: 'Descrição oficial 2.', price: 8, publicUrl: 'https://loja/final-2', coverUrl: 'https://cdn/capa-2.jpg' },
];
const source = { ...submitted, action: 'search', currentMessage: completeForm };
const found = run(formatter, { json: { products }, refs: { 'Validar e mesclar filtros': source } }).json;
assert.equal(found.deliveries.length, 2);
assert(found.followUpText.includes('correspondem aos filtros informados'));
assert(!found.followUpText.includes('para 1 opção'));

const foundState = JSON.parse(found.stateJson);
const chosen = validate('Opção 2', foundState);
assert.equal(chosen.action, 'reply');
assert.equal(chosen.state.lastProduct.id, 'p2');
assert(chosen.text.includes('Sílabas para Alfabetização'));
const purchase = validate('Quero comprar', chosen.state);
assert.equal(purchase.action, 'reply');
assert(purchase.text.includes('https://loja/final-2'));
assert(!purchase.text.includes('https://loja/final-1'));

const dateForm = ['Idade: 7 anos', 'Ano escolar: 2º ano', 'Disciplina: História', 'Tema ou conteúdo:', 'Habilidade ou objetivo:', 'Data comemorativa: Independência do Brasil', 'Tipo de versão: final', 'Nome do produto:'].join('\n');
const dateSearch = routeAndValidate(dateForm);
assert.equal(dateSearch.action, 'search');
assert.equal(dateSearch.query, 'Independência do Brasil');
assert.equal(dateSearch.section, 'products');

const notFound = run(formatter, { json: { products: [] }, refs: { 'Validar e mesclar filtros': source } }).json;
assert.equal(notFound.found, false);
assert.equal(notFound.needsBroadSearch, false, 'não deve sugerir catálogo aleatório');
assert.equal(notFound.suggested, false);
assert(notFound.text.includes('Não encontrei um material com todos esses filtros'));
assert(notFound.text.includes('Idade: 6 anos'));
assert(notFound.text.includes('Tema ou conteúdo: Sílabas'));
assert.equal(JSON.parse(notFound.stateJson).filterFormSubmitted, false);

const oldState = foundState;
const newMaterial = routeAndValidate('Quero pesquisar outro material', oldState);
assert.equal(newMaterial.action, 'reply');
assert.equal(newMaterial.query, '');
assert.equal(newMaterial.state.lastResults.length, 0);
assert.equal(newMaterial.state.lastProduct, null);
assert.equal(newMaterial.state.filterFormSubmitted, false);
assert(newMaterial.text.includes('Idade:'));

// Confirma que a correção V14.1 de restauração continua presente.
assert.deepEqual(main.connections['Decisão ainda atual?'].main[0].map((x) => x.node), ['Restaurar decisão após conferência']);
assert.deepEqual(main.connections['Resposta de texto ainda atual?'].main[0].map((x) => x.node), ['Restaurar resposta após conferência']);
assert.deepEqual(main.connections['Catálogo ainda atual?'].main[0].map((x) => x.node), ['Restaurar catálogo após conferência']);
assert.deepEqual(main.connections['Item ainda atual?'].main[0].map((x) => x.node), ['Restaurar item após conferência']);
const restoreCatalog = run(nodes['Restaurar catálogo após conferência'].parameters.jsCode, { json: { latestMessageId: 'm1' }, refs: { 'Formatar resultado oficial': found } }).json;
assert.equal(restoreCatalog.deliveries.length, 2);

console.log(JSON.stringify({
  ok: true,
  mainNodes: main.nodes.length,
  workerNodes: worker.nodes.length,
  tested: ['pedido de ajuda sem busca', 'ficha completa', 'ficha incompleta', 'bloqueio de texto livre', 'nenhum resultado sem sugestão aleatória', 'nova consulta limpa', 'produtos e compra preservados', 'restauração Redis preservada'],
}, null, 2));
