const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const base = JSON.parse(fs.readFileSync(path.join(root, 'ATENDENTE EDUCALIZANDO V18.2.json'), 'utf8'));
const flow = JSON.parse(fs.readFileSync(path.join(root, 'ATENDENTE EDUCALIZANDO V18.2.1.json'), 'utf8'));
let passed = 0;
const failures = [];

function check(condition, description) {
  if (condition) passed += 1;
  else failures.push(description);
}

function node(workflow, name) {
  return workflow.nodes.find((item) => item.name === name);
}

check(flow.nodes.length === base.nodes.length, 'quantidade de nós foi alterada');
check(JSON.stringify(node(flow, 'Webhook').parameters) === JSON.stringify(node(base, 'Webhook').parameters), 'webhook foi alterado');

for (const original of base.nodes) {
  const current = node(flow, original.name);
  check(Boolean(current), `nó removido: ${original.name}`);
  if (current) check(JSON.stringify(current.credentials || {}) === JSON.stringify(original.credentials || {}), `credencial alterada: ${original.name}`);
}

const classifier = node(flow, 'Classificar tipo da mensagem').parameters.jsCode;
check(classifier.includes("const source = $('dados').item.json"), 'classificador não recupera o item do nó dados');
check(classifier.includes('...source'), 'classificador não preserva o payload original');
check(classifier.indexOf('message.conversation') < classifier.indexOf('message.audioMessage'), 'texto não tem prioridade sobre áudio');

const switchNode = node(flow, 'Switch tipo de mensagem');
for (const rule of switchNode.parameters.rules.values) {
  for (const condition of rule.conditions.conditions) {
    check(condition.leftValue.includes("$('Classificar tipo da mensagem').item.json.messageRoute"), `Switch ${rule.outputKey} ainda depende da saída do Redis`);
  }
}

for (const route of ['TEXTO', 'AUDIO', 'IMAGEM', 'DOCUMENTO', 'DESCONHECIDO']) {
  const code = node(flow, `Entrada ${route}`).parameters.jsCode;
  check(code.includes("$('Classificar tipo da mensagem').item.json"), `Entrada ${route} não restaura o payload`);
  check(code.includes('...source'), `Entrada ${route} não preserva os campos`);
}

function classify(source) {
  const transformed = classifier
    .replace("const source = $('dados').item.json;", 'const source = __source;')
    .replace(/return\s*\{\s*json:\s*\{/m, 'return { json: {');
  return vm.runInNewContext(`(function(){${transformed}})()`, { __source: source }).json.messageRoute;
}

const cases = [
  [{ rawMessage: { conversation: 'oi' }, conversation: 'oi', mensageType: 'conversation' }, 'TEXTO'],
  [{ rawMessage: { extendedTextMessage: { text: 'boa noite preciso de um material' } }, conversation: 'boa noite preciso de um material', mensageType: 'extendedTextMessage' }, 'TEXTO'],
  [{ rawMessage: { audioMessage: { url: 'x' } }, conversation: '', mensageType: 'audioMessage' }, 'AUDIO'],
  [{ rawMessage: { imageMessage: { caption: 'foto' } }, conversation: 'foto', mensageType: 'imageMessage' }, 'IMAGEM'],
  [{ rawMessage: { documentMessage: { fileName: 'a.pdf' } }, conversation: '', mensageType: 'documentMessage' }, 'DOCUMENTO'],
  [{ rawMessage: { ephemeralMessage: { message: { conversation: 'olá' } } }, conversation: '', mensageType: '' }, 'TEXTO'],
  [{ rawMessage: {}, conversation: 'texto preservado', mensageType: '' }, 'TEXTO'],
  [{ rawMessage: { stickerMessage: {} }, conversation: '', mensageType: 'stickerMessage' }, 'DESCONHECIDO']
];

for (const [input, expected] of cases) {
  check(classify(input) === expected, `classificação incorreta para ${expected}`);
}

const baseNames = new Set(base.nodes.map((item) => item.name));
for (const name of baseNames) check(flow.nodes.some((item) => item.name === name), `nome de nó não preservado: ${name}`);

if (failures.length) {
  console.error(`${passed}/${passed + failures.length} verificações aprovadas`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`${passed}/${passed} verificações aprovadas`);
