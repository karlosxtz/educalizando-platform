const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'ATENDENTE EDUCALIZANDO V18.2.1.json');
const outputPath = path.join(root, 'ATENDENTE EDUCALIZANDO V18.2.2.json');
const workflow = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

function node(name) {
  const found = workflow.nodes.find((item) => item.name === name);
  if (!found) throw new Error(`Nó não encontrado: ${name}`);
  return found;
}

// Mensagens iguais podem ser respostas legítimas para perguntas diferentes.
// A identidade antiflood passa a incluir o messageId; a janela de volume continua ativa.
node('Preparar proteção antiflood').parameters.jsCode = String.raw`const d=$('dados').item.json,m=String($json.message||''),messageId=String(d.id||''),sessionId=String(d.instance||'')+':'+String(d.remotejid||'');let h=2166136261;for(const ch of (messageId+'|'+m))h=(h^ch.charCodeAt(0))*16777619>>>0;const hash=(h>>>0).toString(16);return{json:{...$json,sessionId,messageHash:hash,hashKey:'educalizando:hash:v18:'+sessionId+':'+hash,rateKey:'educalizando:rate:v18:'+sessionId}};`;

const validator = node('Validar e mesclar filtros');
let code = validator.parameters.jsCode;

function replaceOnce(before, after, label) {
  if (!code.includes(before)) throw new Error(`Trecho não encontrado: ${label}`);
  code = code.replace(before, after);
}

// Tema + idade/ano já satisfazem a regra oficial de busca. Campos opcionais não
// podem impedir a consulta nem gerar uma sequência desnecessária de perguntas.
replaceOnce(
  "else if(field==='theme'){if(message.length<2)text='Informe um tema, conteúdo ou habilidade. Exemplo: sílabas, emoções, matemática ou coordenação motora.';else{setField('tema',message);state.awaiting='deadline';text=question('deadline')}}",
  "else if(field==='theme'){if(message.length<2)text='Informe um tema, conteúdo ou habilidade. Exemplo: sílabas, emoções, matemática ou coordenação motora.';else{setField('tema',message);if(!state.tipoCompra)setField('tipoCompra','qualquer');if(!state.dataComemorativa)setField('dataComemorativa','não');state.stage='searching';state.awaiting='';state.filterFormSubmitted=true;action='search';query=queryFor(state);metricEvents=['ficha_concluida'];text=''}}",
  'conclusão imediata depois do tema'
);

// Cura sessões que ficaram salvas nas etapas opcionais de versões anteriores.
replaceOnce(
  "else if(field==='deadline'){if(!/^(nao|nenhuma|sem data|nao preciso)$/.test(current)){setField('dataLimite',message);const days=daysUntil(message);state.urgencyDays=days;state.urgent=days!==null&&days>=0&&days<3;if(state.urgent)state.tipoCompra='final';urgencyCaptured=true;captureFields.push({field:'urgencia',value:JSON.stringify({data:message,diasRestantes:days,registradoEm:now})})}state.awaiting='pedagogical_context';text=question('pedagogical_context')}",
  "else if(field==='deadline'){if(!/^(nao|nenhuma|sem data|nao preciso)$/.test(current)){setField('dataLimite',message);const days=daysUntil(message);state.urgencyDays=days;state.urgent=days!==null&&days>=0&&days<3;if(state.urgent)state.tipoCompra='final';urgencyCaptured=true;captureFields.push({field:'urgencia',value:JSON.stringify({data:message,diasRestantes:days,registradoEm:now})})}if(!state.tipoCompra)setField('tipoCompra','qualquer');if(!state.dataComemorativa)setField('dataComemorativa','não');state.stage='searching';state.awaiting='';action='search';query=queryFor(state);metricEvents=['ficha_concluida'];text=''}",
  'recuperação da etapa prazo'
);
replaceOnce(
  "else if(field==='pedagogical_context'){setField('contextoPedagogico',/^(nao sei|qualquer|tanto faz)$/.test(current)?'':message);state.awaiting='date';text=question('date')}",
  "else if(field==='pedagogical_context'){setField('contextoPedagogico',/^(nao sei|qualquer|tanto faz)$/.test(current)?'':message);if(!state.tipoCompra)setField('tipoCompra','qualquer');if(!state.dataComemorativa)setField('dataComemorativa','não');state.stage='searching';state.awaiting='';action='search';query=queryFor(state);metricEvents=['ficha_concluida'];text=''}",
  'recuperação da etapa contexto'
);
replaceOnce(
  "else if(field==='date'){setField('dataComemorativa',/^(nao|nenhuma|nao e)$/.test(current)?'não':message);state.awaiting='version';text=question('version')}",
  "else if(field==='date'){setField('dataComemorativa',/^(nao|nenhuma|nao e)$/.test(current)?'não':message);if(!state.tipoCompra)setField('tipoCompra','qualquer');state.stage='searching';state.awaiting='';action='search';query=queryFor(state);metricEvents=['ficha_concluida'];text=''}",
  'recuperação da etapa data comemorativa'
);
replaceOnce(
  "const version=/\\b(plr|revenda)\\b/.test(current)?'plr':/\\b(final|uso pessoal)\\b/.test(current)?'final':/\\b(qualquer|tanto faz|ambas)\\b/.test(current)?'qualquer':'';",
  "const version=/\\b(plr|revenda)\\b/.test(current)?'plr':/\\b(final|uso pessoal)\\b/.test(current)?'final':/\\b(qualquer|tanto faz|ambas|nao|nenhuma)\\b/.test(current)?'qualquer':'';",
  'não como versão indiferente'
);

// Uma busca nova preserva os filtros realmente informados na própria mensagem.
// Assim "algo sobre emoções" não volta a perguntar o tema depois da idade.
const oldStart = "else if(guidance||principal==='BUSCA'||principal==='COMPRA'){state={...state,idade:'',anoEscolar:'',disciplina:'',tema:'',habilidade:'',objetivo:'',dataComemorativa:'',tipoCompra:'',produtoMencionado:'',startedAt:now};metricEvents=['ficha_iniciada'];if(customerProfile==='EXPLORADOR'){state.stage='exploring_categories';state.awaiting='category';text='Posso mostrar materiais de Português, Matemática, Alfabetização, Emoções, Coordenação Motora, Datas Comemorativas e muito mais. Qual categoria você quer explorar?'}else{state.stage='collecting';state.awaiting='age_or_year';text=question('age_or_year')}intent='iniciar_ficha'}";
const newStart = "else if(guidance||principal==='BUSCA'||principal==='COMPRA'){state={...state,idade:'',anoEscolar:'',disciplina:'',tema:'',habilidade:'',objetivo:'',dataComemorativa:'',tipoCompra:'',produtoMencionado:'',startedAt:now};metricEvents=['ficha_iniciada'];for(const f of ['idade','anoEscolar','disciplina','tema','habilidade','objetivo','dataComemorativa','tipoCompra','produtoMencionado'])if(extracted[f])setField(f,extracted[f]);const initialAge=parseAgeYear(message);for(const[f,v]of Object.entries(initialAge))if(!state[f])setField(f,v);const initialRange=Boolean(state.idade||state.anoEscolar),initialTopic=Boolean(state.disciplina||state.tema||state.habilidade||state.objetivo||(state.dataComemorativa&&!/^(nao|não)$/i.test(norm(state.dataComemorativa))));if(initialRange&&initialTopic){if(!state.tipoCompra)setField('tipoCompra','qualquer');state.stage='searching';state.awaiting='';state.filterFormSubmitted=true;action='search';query=queryFor(state);metricEvents=['ficha_iniciada','ficha_concluida'];text=''}else if(initialTopic){state.stage='collecting';state.awaiting='age_or_year';text=question('age_or_year')}else if(initialRange){state.stage='collecting';state.awaiting='theme';text=question('theme')}else if(customerProfile==='EXPLORADOR'){state.stage='exploring_categories';state.awaiting='category';text='Posso mostrar materiais de Português, Matemática, Alfabetização, Emoções, Coordenação Motora, Datas Comemorativas e muito mais. Qual categoria você quer explorar?'}else{state.stage='collecting';state.awaiting='age_or_year';text=question('age_or_year')}intent='iniciar_ficha'}";
replaceOnce(oldStart, newStart, 'preservação de filtros da mensagem inicial');

validator.parameters.jsCode = code;

const flowVersion = node('dados').parameters.assignments.assignments.find((item) => item.name === 'flowVersion');
if (flowVersion) flowVersion.value = 'V18.2.2';
workflow.name = String(workflow.name || '').replace(/V18\.2\.1/i, 'V18.2.2');
workflow.updatedAt = new Date().toISOString();

fs.writeFileSync(outputPath, JSON.stringify(workflow, null, 2) + '\n');
console.log(`Arquivo gerado: ${outputPath}`);
console.log(`Nós preservados: ${workflow.nodes.length}`);
