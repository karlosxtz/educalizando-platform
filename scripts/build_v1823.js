const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'ATENDENTE EDUCALIZANDO V18.2.2.json');
const outputPath = path.join(root, 'ATENDENTE EDUCALIZANDO V18.2.3.json');
const workflow = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

function node(name) {
  const found = workflow.nodes.find((item) => item.name === name);
  if (!found) throw new Error(`Nó não encontrado: ${name}`);
  return found;
}

function replaceOnce(source, before, after, label) {
  if (!source.includes(before)) throw new Error(`Trecho não encontrado: ${label}`);
  return source.replace(before, after);
}

// Detecta a escolha localmente, sem consumir uma chamada de IA.
const router = node('Roteamento instantâneo');
let routerCode = router.parameters.jsCode;
routerCode = replaceOnce(
  routerCode,
  "const frustration=/\\b(nao funciona|parou|travou|sacanagem|porra|pqp|raiva|irritado|irritada|cansado|cansada|demora|demorando)\\b/.test(text);\n\nlet intencao='',reply='';\nif(reset||asksNewMaterial){intencao='solicitar_filtros';reply=''}",
  "const frustration=/\\b(nao funciona|parou|travou|sacanagem|porra|pqp|raiva|irritado|irritada|cansado|cansada|demora|demorando)\\b/.test(text);\nconst savedResults=Array.isArray(old.lastResults)?old.lastResults:[];\nconst choiceNumber=(()=>{const m=text.match(/(?:^|\\b)(?:o+p+c?a+o\\s*)?(?:numero\\s*)?([1-4])(?:\\b|$)/);if(m)return Number(m[1]);if(/\\bprimeir[oa]\\b/.test(text))return 1;if(/\\bsegund[oa]\\b/.test(text))return 2;if(/\\bterceir[oa]\\b/.test(text))return 3;return 0})();\nconst quickChoice=choiceNumber>0&&choiceNumber<=savedResults.length?savedResults[choiceNumber-1]:null;\n\nlet intencao='',reply='';\nif(quickChoice){intencao='selecionar_produto';filters.produtoMencionado=quickChoice.title||quickChoice.name||''}\nelse if(reset||asksNewMaterial){intencao='solicitar_filtros';reply=''}",
  'atalho local de escolha'
);
router.parameters.jsCode = routerCode;

const validator = node('Validar e mesclar filtros');
let code = validator.parameters.jsCode;

code = replaceOnce(
  code,
  "function optionsText(){if(!results.length)return 'Não tenho opções salvas nesta conversa. Posso iniciar uma nova busca para você.';const lines=['Estas são as opções que você já recebeu:'];results.slice(0,3).forEach((p,i)=>lines.push('Opção '+(i+1)+': '+p.title+(p.price!==''?' — '+money(p.price):'')));lines.push('Responda com o número ou com o nome do material.');return lines.join('\\n')}",
  "function optionLabels(list){return list.map((_,i)=>'“Opção '+(i+1)+'”')}function joinLabels(labels){if(labels.length<=1)return labels[0]||'';return labels.slice(0,-1).join(', ')+' ou '+labels[labels.length-1]}function selectionPrompt(prefix){const visible=results.slice(0,3),labels=optionLabels(visible);return (prefix?prefix+' ':'')+'Responda '+joinLabels(labels)+' ou escreva o nome do material.'}function optionsText(){if(!results.length)return 'Não tenho opções salvas nesta conversa. Posso iniciar uma nova busca para você.';const lines=['Estas são as opções que você já recebeu:'];results.slice(0,3).forEach((p,i)=>lines.push('Opção '+(i+1)+': '+p.title+(p.price!==''?' — '+money(p.price):'')));lines.push(selectionPrompt(''));return lines.join('\\n')}",
  'texto dinâmico das opções'
);

code = replaceOnce(
  code,
  "function choiceIndex(t){if(/^\\s*[1-4]\\s*$/.test(t))return Number(t.trim())-1;for(const [re,i] of [[/\\b(opcao 1|primeir[oa])\\b/,0],[/\\b(opcao 2|segund[oa])\\b/,1],[/\\b(opcao 3|terceir[oa])\\b/,2]])if(re.test(t))return i;return-1}",
  "function choiceIndex(t){const m=String(t||'').match(/(?:^|\\b)(?:o+p+c?a+o\\s*)?(?:numero\\s*)?([1-4])(?:\\b|$)/);if(m)return Number(m[1])-1;for(const [re,i] of [[/\\bprimeir[oa]\\b/,0],[/\\bsegund[oa]\\b/,1],[/\\bterceir[oa]\\b/,2]])if(re.test(t))return i;return-1}",
  'escolha tolerante a erros de digitação'
);

code = replaceOnce(
  code,
  "state.stage='awaiting_choice';state.awaiting='product_choice';text='Claro! Qual produto você quer comprar? Responda “Opção 1”, “Opção 2” ou “Opção 3”.';intent='selecionar_produto';",
  "state.stage='awaiting_choice';state.awaiting='product_choice';text=selectionPrompt('Claro! Qual produto você quer comprar?');intent='selecionar_produto';",
  'pergunta de compra dinâmica'
);

// Enquanto aguarda a escolha, uma resposta imperfeita nunca pode iniciar outra ficha.
code = replaceOnce(
  code,
  "} else if(form.submitted){",
  "} else if(state.stage==='awaiting_choice'&&results.length){state.awaiting='product_choice';text=selectionPrompt('Não consegui identificar qual produto você escolheu.');intent='aguardar_escolha';\n  } else if(form.submitted){",
  'proteção do estado aguardando escolha'
);
validator.parameters.jsCode = code;

// O acompanhamento informa somente as opções realmente enviadas.
const formatter = node('Formatar alternativa ampliada');
let formatCode = formatter.parameters.jsCode;
formatCode = replaceOnce(
  formatCode,
  " const followUpText=suggested\n  ?'Não encontrei uma correspondência exata, mas enviei '+total+' opção'+(total===1?' parecida':'s parecidas')+' com o que você pediu. Alguma delas atende ao que você procura? 😊'\n  :'Enviei '+total+' material'+(total===1?'':'s')+' que corresponde'+(total===1?'':'m')+' aos filtros informados. Algum deles é o que você procura? Responda “Opção 1”, “Opção 2”, “Opção 3” ou escreva o nome do material. Para outras sugestões, diga “mais opções” 😊';",
  " const labels=selected.map((_,i)=>'“Opção '+(i+1)+'”'),choices=labels.length<=1?(labels[0]||'o nome do material'):labels.slice(0,-1).join(', ')+' ou '+labels[labels.length-1];\n const followUpText=suggested\n  ?'Não encontrei uma correspondência exata, mas enviei '+total+' opção'+(total===1?' parecida':'s parecidas')+' com o que você pediu. '+(total===1?'Ela atende':'Alguma delas atende')+' ao que você procura? Responda '+choices+' ou escreva o nome do material. 😊'\n  :'Enviei '+total+' material'+(total===1?'':'s')+' que corresponde'+(total===1?'':'m')+' aos filtros informados. '+(total===1?'Ele é':'Algum deles é')+' o que você procura? Responda '+choices+' ou escreva o nome do material. Para outras sugestões, diga “mais opções” 😊';",
  'acompanhamento com quantidade real'
);
formatter.parameters.jsCode = formatCode;

const flowVersion = node('dados').parameters.assignments.assignments.find((item) => item.name === 'flowVersion');
if (flowVersion) flowVersion.value = 'V18.2.3';
workflow.name = String(workflow.name || '').replace(/V18\.2\.2/i, 'V18.2.3');
workflow.updatedAt = new Date().toISOString();

fs.writeFileSync(outputPath, JSON.stringify(workflow, null, 2) + '\n');
console.log(`Arquivo gerado: ${outputPath}`);
console.log(`Nós preservados: ${workflow.nodes.length}`);
