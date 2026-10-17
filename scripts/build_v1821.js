const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'ATENDENTE EDUCALIZANDO V18.2.json');
const outputPath = path.join(root, 'ATENDENTE EDUCALIZANDO V18.2.1.json');
const workflow = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

function node(name) {
  const found = workflow.nodes.find((item) => item.name === name);
  if (!found) throw new Error(`Nó não encontrado: ${name}`);
  return found;
}

// Os nós Redis anteriores devolvem o resultado da operação e podem substituir
// o item corrente. O classificador sempre deve reler o payload preservado em "dados".
node('Classificar tipo da mensagem').parameters.jsCode = String.raw`function unwrap(v) {
  let m = v && typeof v === 'object' ? v : {};
  for (let i = 0; i < 8; i++) {
    const next =
      m.ephemeralMessage?.message ||
      m.viewOnceMessage?.message ||
      m.viewOnceMessageV2?.message ||
      m.viewOnceMessageV2Extension?.message ||
      m.documentWithCaptionMessage?.message ||
      m.editedMessage?.message;
    if (!next || typeof next !== 'object') break;
    m = next;
  }
  return m;
}

const source = $('dados').item.json;
const message = unwrap(source.rawMessage || {});
const declaredType = String(source.mensageType || '').trim().toLowerCase();

let messageRoute = 'DESCONHECIDO';

if (
  typeof message.conversation === 'string' ||
  typeof message.extendedTextMessage?.text === 'string' ||
  declaredType === 'conversation' ||
  declaredType === 'extendedtextmessage' ||
  (!declaredType && typeof source.conversation === 'string' && source.conversation.trim())
) {
  messageRoute = 'TEXTO';
} else if (message.audioMessage || declaredType === 'audiomessage') {
  messageRoute = 'AUDIO';
} else if (message.imageMessage || declaredType === 'imagemessage') {
  messageRoute = 'IMAGEM';
} else if (message.documentMessage || declaredType === 'documentmessage') {
  messageRoute = 'DOCUMENTO';
}

return {
  json: {
    ...source,
    messageRoute,
    messageReceived: message
  }
};`;

// O log Redis também substitui o item. O Switch consulta diretamente a saída
// confiável do classificador em vez de depender do item devolvido pelo Redis.
const switchNode = node('Switch tipo de mensagem');
for (const rule of switchNode.parameters.rules.values) {
  for (const condition of rule.conditions.conditions) {
    condition.leftValue = "={{ $('Classificar tipo da mensagem').item.json.messageRoute }}";
  }
}

// Cada entrada recompõe o item original depois do log Redis, preservando texto,
// identificadores, tipo e todas as informações usadas no restante do fluxo.
for (const route of ['TEXTO', 'AUDIO', 'IMAGEM', 'DOCUMENTO']) {
  node(`Entrada ${route}`).parameters.jsCode =
    `const source = $('Classificar tipo da mensagem').item.json;\n` +
    `return { json: { ...source, messageRoute: '${route}', forceUnknownReply: false } };`;
}

node('Entrada DESCONHECIDO').parameters.jsCode =
  "const source = $('Classificar tipo da mensagem').item.json;\n" +
  "return { json: { ...source, messageRoute: 'DESCONHECIDO', forceUnknownReply: true } };";

const flowVersion = node('dados').parameters.assignments.assignments.find(
  (assignment) => assignment.name === 'flowVersion'
);
if (flowVersion) flowVersion.value = 'V18.2.1';

workflow.name = String(workflow.name || 'ATENDENTE EDUCALIZANDO V18.2').replace(/V18\.2(?:\.1)?/i, 'V18.2.1');
workflow.updatedAt = new Date().toISOString();

fs.writeFileSync(outputPath, JSON.stringify(workflow, null, 2) + '\n');
console.log(`Arquivo gerado: ${outputPath}`);
console.log(`Nós preservados: ${workflow.nodes.length}`);
