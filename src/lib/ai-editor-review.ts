import type { AiEditorialValues } from './ai-workspace';
import { assertMarketingQuantities } from './ai-marketing-grounding';
export type TextChange = { kind: 'equal' | 'removed' | 'added'; text: string };
/** Word comparison bounded in memory; long texts use whole-line comparison. */
export function compareAiText(before: string, after: string): TextChange[] {
  if (before === after) return [{ kind: 'equal', text: before }];
  const words = (text: string) => text.match(/\S+|\s+/g) || [];
  let a = words(before), b = words(after);
  if ((a.length + 1) * (b.length + 1) > 250_000) {
    const lines = (text: string) => text.match(/[^\n]*\n|[^\n]+$/g) || [];
    a = lines(before); b = lines(after);
  }
  if ((a.length + 1) * (b.length + 1) > 250_000) return [{ kind: 'removed', text: before }, { kind: 'added', text: after }];
  const width = b.length + 1, matrix = new Uint16Array((a.length + 1) * width);
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) matrix[i * width + j] = a[i] === b[j] ? 1 + matrix[(i + 1) * width + j + 1] : Math.max(matrix[(i + 1) * width + j], matrix[i * width + j + 1]);
  const result: TextChange[] = [];
  const append = (kind: TextChange['kind'], text: string) => { const last = result.at(-1); if (last?.kind === kind) last.text += text; else result.push({ kind, text }); };
  let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) { append('equal', a[i++]); j++; }
    else if (i < a.length && (j === b.length || matrix[(i + 1) * width + j] >= matrix[i * width + j + 1])) append('removed', a[i++]);
    else append('added', b[j++]);
  }
  return result;
}
export function reviewAiEditorial(source: Record<string, any>, values: AiEditorialValues, target: 'product' | 'plr') {
  const issues: Array<{ title: string; detail: string }> = [];
  const sourceDescription = target === 'plr' ? source.plr_descricao || '' : source.descricao || '';
  const copy = `${target === 'plr' ? '' : values.title}\n${values.description}`;
  const normalize = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
  const facts = normalize(`${source.titulo || ''} ${sourceDescription} ${source.age_range || ''} ${source.format_details || ''}`);
  const written = normalize(copy);
  if (!sourceDescription.trim()) issues.push({ title: 'Fonte incompleta', detail: 'O cadastro original não tem descrição nesta oferta. Confira cada detalhe antes de publicar.' });
  if (!values.description.trim()) issues.push({ title: 'Descrição vazia', detail: 'Preencha uma apresentação baseada nos dados reais do material.' });
  const sentences = values.description.split(/[.!?\n]+/).map(normalize).filter(sentence => sentence.length > 35);
  if (new Set(sentences).size < sentences.length) issues.push({ title: 'Texto repetido', detail: 'Há frases repetidas. Remova as repetições para tornar a leitura mais natural.' });
  if (/aprendizagem garantida|revolucione|imperdivel|transforme sua aula|desperte o potencial/.test(written)) issues.push({ title: 'Linguagem genérica', detail: 'Substitua slogans e promessas por detalhes concretos do cadastro.' });
  for (const [label, expression] of [['editabilidade', /editave[l]|editaveis|word|powerpoint|canva/], ['alinhamento à BNCC', /\bbncc\b/], ['bônus ou certificado', /\bbonus\b|certificad/], ['direitos de revenda', /revenda|revender|direitos ilimitados/]] as const) {
    if (expression.test(written) && !expression.test(facts)) issues.push({ title: 'Afirmação para conferir', detail: `O texto menciona ${label}, mas isso não foi encontrado nos campos consultados do cadastro.` });
  }
  try { assertMarketingQuantities(copy, { ...source, descricao: sourceDescription, plr_descricao: target === 'plr' ? sourceDescription : null }); }
  catch { issues.push({ title: 'Quantidade sem apoio na fonte', detail: 'Há uma quantidade de páginas, atividades ou arquivos que não foi encontrada no cadastro. Confira o número.' }); }
  if (/\b\d+\s*(?:a|-|ate)\s*\d+\s*anos\b/.test(written) && !source.age_range && !/\b\d+\s*(?:a|-|ate)\s*\d+\s*anos\b/.test(facts)) issues.push({ title: 'Faixa etária não informada', detail: 'A idade sugerida não foi encontrada no cadastro. Confira a indicação antes de publicar.' });
  return issues;
}
