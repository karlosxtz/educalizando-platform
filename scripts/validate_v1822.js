const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const base = JSON.parse(fs.readFileSync(path.join(root, 'ATENDENTE EDUCALIZANDO V18.2.1.json'), 'utf8'));
const flow = JSON.parse(fs.readFileSync(path.join(root, 'ATENDENTE EDUCALIZANDO V18.2.2.json'), 'utf8'));
let passed = 0;
const failures = [];

function check(value, description) { value ? passed++ : failures.push(description); }
function node(workflow, name) { return workflow.nodes.find((item) => item.name === name); }

check(flow.nodes.length === base.nodes.length, 'quantidade de nós alterada');
check(JSON.stringify(flow.connections) === JSON.stringify(base.connections), 'conexões alteradas');
check(JSON.stringify(node(flow, 'Webhook').parameters) === JSON.stringify(node(base, 'Webhook').parameters), 'webhook alterado');

for (const original of base.nodes) {
  const current = node(flow, original.name);
  check(Boolean(current), `nó removido: ${original.name}`);
  if (current) check(JSON.stringify(current.credentials || {}) === JSON.stringify(original.credentials || {}), `credencial alterada: ${original.name}`);
}

const anti = node(flow, 'Preparar proteção antiflood').parameters.jsCode;
check(anti.includes("messageId=String(d.id||'')"), 'antiflood não usa messageId');
check(anti.includes("messageId+'|'+m"), 'hash ainda depende somente do texto');

const code = node(flow, 'Validar e mesclar filtros').parameters.jsCode;
check(code.includes("else if(field==='theme')"), 'etapa de tema ausente');
check(code.includes("setField('tema',message);if(!state.tipoCompra)setField('tipoCompra','qualquer')"), 'tema não conclui filtros');
check(code.includes("state.stage='searching';state.awaiting='';state.filterFormSubmitted=true;action='search';query=queryFor(state)"), 'tema não dispara busca');
check(!code.includes("setField('tema',message);state.awaiting='deadline'"), 'tema ainda encaminha para prazo');
check(!code.includes("state.awaiting='pedagogical_context';text=question('pedagogical_context')"), 'prazo ainda bloqueia busca');
check(!code.includes("state.awaiting='date';text=question('date')"), 'contexto ainda bloqueia busca');
check(!code.includes("state.awaiting='version';text=question('version')"), 'data comemorativa ainda bloqueia busca');
check(code.includes("ambas|nao|nenhuma"), 'resposta não não é aceita na etapa legada de versão');
check(code.includes("for(const f of ['idade','anoEscolar','disciplina','tema','habilidade','objetivo','dataComemorativa','tipoCompra','produtoMencionado'])if(extracted[f])setField(f,extracted[f])"), 'filtros iniciais extraídos não são preservados');
check(code.includes("else if(initialTopic){state.stage='collecting';state.awaiting='age_or_year'"), 'tema inicial não pula diretamente para idade');
check(code.includes("if(initialRange&&initialTopic)"), 'mensagem completa não dispara busca direta');

const changed = [];
for (const original of base.nodes) {
  const current = node(flow, original.name);
  if (JSON.stringify(original) !== JSON.stringify(current)) changed.push(original.name);
}
check(changed.every((name) => ['dados', 'Preparar proteção antiflood', 'Validar e mesclar filtros'].includes(name)), `nós extras alterados: ${changed.join(', ')}`);
check(changed.includes('Preparar proteção antiflood'), 'antiflood não foi alterado');
check(changed.includes('Validar e mesclar filtros'), 'validador não foi alterado');

if (failures.length) {
  console.error(`${passed}/${passed + failures.length} verificações aprovadas`);
  failures.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}
console.log(`${passed}/${passed} verificações aprovadas`);
