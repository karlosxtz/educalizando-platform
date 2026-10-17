const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const base = JSON.parse(fs.readFileSync(path.join(root, 'ATENDENTE EDUCALIZANDO V18.2.2.json'), 'utf8'));
const flow = JSON.parse(fs.readFileSync(path.join(root, 'ATENDENTE EDUCALIZANDO V18.2.3.json'), 'utf8'));
let passed = 0;
const failures = [];
function check(value, label) { value ? passed++ : failures.push(label); }
function node(workflow, name) { return workflow.nodes.find((item) => item.name === name); }

check(flow.nodes.length === base.nodes.length, 'quantidade de nós alterada');
check(JSON.stringify(flow.connections) === JSON.stringify(base.connections), 'conexões alteradas');
check(JSON.stringify(node(flow, 'Webhook').parameters) === JSON.stringify(node(base, 'Webhook').parameters), 'webhook alterado');
for (const original of base.nodes) {
  const current = node(flow, original.name);
  check(Boolean(current), `nó removido: ${original.name}`);
  if (current) check(JSON.stringify(current.credentials || {}) === JSON.stringify(original.credentials || {}), `credencial alterada: ${original.name}`);
}

const router = node(flow, 'Roteamento instantâneo').parameters.jsCode;
const validator = node(flow, 'Validar e mesclar filtros').parameters.jsCode;
const formatter = node(flow, 'Formatar alternativa ampliada').parameters.jsCode;

check(router.includes("if(quickChoice){intencao='selecionar_produto'"), 'escolha ainda chama IA');
check(router.includes('choiceNumber<=savedResults.length'), 'atalho aceita opção inexistente');
check(validator.includes("o+p+c?a+o"), 'escolha não tolera erro em opção');
check(validator.includes("state.stage==='awaiting_choice'&&results.length"), 'estado de escolha pode reiniciar a ficha');
check(validator.includes("intent='aguardar_escolha'"), 'escolha inválida não mantém o estado');
check(!validator.includes('Qual produto você quer comprar? Responda “Opção 1”, “Opção 2” ou “Opção 3”.'), 'pergunta de compra continua fixa em três');
check(formatter.includes("const labels=selected.map"), 'acompanhamento não calcula opções reais');
check(!formatter.includes('Responda “Opção 1”, “Opção 2”, “Opção 3”'), 'acompanhamento continua fixo em três');

function choiceIndex(value) {
  const t = String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const m = t.match(/(?:^|\b)(?:o+p+c?a+o\s*)?(?:numero\s*)?([1-4])(?:\b|$)/);
  if (m) return Number(m[1]) - 1;
  for (const [re, i] of [[/\bprimeir[oa]\b/, 0], [/\bsegund[oa]\b/, 1], [/\bterceir[oa]\b/, 2]]) if (re.test(t)) return i;
  return -1;
}
for (const [text, expected] of [['2',1],['opção 2',1],['oopção 2',1],['opcao numero 2',1],['a segunda',1],['primeiro',0],['terceira',2]]) {
  check(choiceIndex(text) === expected, `não reconheceu: ${text}`);
}

function choiceText(total) {
  const labels = Array.from({ length: total }, (_, i) => `“Opção ${i + 1}”`);
  return labels.length <= 1 ? labels[0] : labels.slice(0, -1).join(', ') + ' ou ' + labels[labels.length - 1];
}
check(choiceText(1) === '“Opção 1”', 'texto para um produto incorreto');
check(choiceText(2) === '“Opção 1” ou “Opção 2”', 'texto para dois produtos incorreto');
check(choiceText(3) === '“Opção 1”, “Opção 2” ou “Opção 3”', 'texto para três produtos incorreto');

const changed = [];
for (const original of base.nodes) {
  const current = node(flow, original.name);
  if (JSON.stringify(original) !== JSON.stringify(current)) changed.push(original.name);
}
check(changed.every((name) => ['dados','Roteamento instantâneo','Validar e mesclar filtros','Formatar alternativa ampliada'].includes(name)), `alteração fora do escopo: ${changed.join(', ')}`);

for (const current of flow.nodes.filter((item) => item.type === 'n8n-nodes-base.code')) {
  try { new Function(current.parameters.jsCode); check(true, `sintaxe ${current.name}`); }
  catch (error) { check(false, `sintaxe inválida em ${current.name}: ${error.message}`); }
}

if (failures.length) {
  console.error(`${passed}/${passed + failures.length} verificações aprovadas`);
  failures.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}
console.log(`${passed}/${passed} verificações aprovadas`);
