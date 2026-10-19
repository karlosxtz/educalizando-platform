import { isUuid } from './conversion-events';
import type { Product } from './types';
export type ComparisonChoice={id:string;mode:'standard'|'plr'};
export const comparisonKey=(item:ComparisonChoice)=>`${item.id}:${item.mode}`;
export function parseComparison(value:string):ComparisonChoice[] {
  const seen=new Set<string>();const rows:ComparisonChoice[]=[];
  for(const part of value.split(',')){const [id,mode]=part.split(':');if(!isUuid(id)||!['standard','plr'].includes(mode))continue;const item={id,mode} as ComparisonChoice;const key=comparisonKey(item);if(!seen.has(key)){seen.add(key);rows.push(item);}if(rows.length===3)break;}
  return rows;
}
export function comparisonFacts(p:Product,mode:'standard'|'plr') {
  const plr=mode==='plr';
  return [
    ['Conteúdo',plr?'Confira a descrição específica da licença PLR.':(p.descricao||'Não informado pelo criador.').replace(/<[^>]*>/g,' ').slice(0,600)],
    ['Formato',plr?'Consulte os arquivos e condições desta licença.':p.format_details||p.tipo?.toUpperCase()||'Não informado'],
    ['Páginas',plr?'Não confirmado para esta licença':p.page_count&&p.page_count>0?String(p.page_count):'Não informado'],
    ['Público indicado',plr?'Consulte a descrição desta licença':p.age_range||'Não informado'],
    ['Licença',plr?'PLR — confira direitos e restrições na página do produto':'Produto final — confira as condições de uso do criador'],
    ['Preço',!plr&&p.is_free?'Grátis':new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(plr?p.preco_plr:p.preco))],
  ] as const;
}
