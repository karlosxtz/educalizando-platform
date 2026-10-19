import type { Product } from './types';
import { normalizeSearchText } from './search-matching';
export type PedagogicalCriteria={goal:string;stage:string;age:string;subject:string};
const noise=new Set(['estou','trabalhando','trabalhar','preciso','quero','minha','meu','turma','material','materiais','atividade','atividades','para','com','uma','uns','ano','anos','de','do','da','no','na','em','ensinar']);
export function pedagogicalMatch(product:Product&{pedagogicalLabels?:string[]},criteria:PedagogicalCriteria):{score:number;reasons:string[]}|null {
  if(product.status!=='publicado'||product.excluido_em)return null;
  const facts=normalizeSearchText([product.titulo,product.descricao,product.age_range,product.format_details,product.education_level?.nome,product.category?.nome,...(product.tags||[]),...(product.pedagogicalLabels||[])].filter(Boolean).join(' '));
  const reasons:string[]=[];
  const requestedGrade=normalizeSearchText(criteria.goal).match(/\b(\d{1,2})\s+(?:o\s+)?ano\b/)?.[1];
  const goal=normalizeSearchText(criteria.goal).replace(/\b\d{1,2}\s+(?:o\s+)?ano\b/g,' ');
  const terms=[...new Set(goal.split(' ').filter(t=>t.length>2&&!noise.has(t)))];
  const matched=terms.filter(term=>facts.includes(term));
  if(terms.length&&!matched.length)return null;
  if(matched.length)reasons.push(`Objetivo: termos encontrados no cadastro (${matched.join(', ')}).`);
  if(requestedGrade&&!criteria.stage){if(!new RegExp(`\\b${requestedGrade}\\s+(?:o\\s+)?ano\\b`).test(facts))return null;reasons.push(`${requestedGrade}º ano mencionado no cadastro.`);}
  if(criteria.stage){const stage=normalizeSearchText(criteria.stage);if(!facts.includes(stage))return null;reasons.push(`Etapa mencionada: ${criteria.stage}.`);}
  if(criteria.subject){if(!facts.includes(normalizeSearchText(criteria.subject)))return null;reasons.push(`Disciplina mencionada: ${criteria.subject}.`);}
  if(criteria.age){const age=Number(criteria.age);if(!Number.isInteger(age)||age<1||age>18)return null;const range=(product.age_range||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const match=range.match(/\b(\d{1,2})\s*(?:a|ate|-)\s*(\d{1,2})\s*anos?\b/);const exact=range.match(/\b(\d{1,2})\s+anos?\b/);if(match?age<Number(match[1])||age>Number(match[2]):!exact||age!==Number(exact[1]))return null;reasons.push(`Idade compatível com a faixa cadastrada: ${product.age_range}.`);}
  return {score:matched.length*3+reasons.length,reasons:reasons.length?reasons:['Material publicado. Confira a indicação na descrição.']};
}
