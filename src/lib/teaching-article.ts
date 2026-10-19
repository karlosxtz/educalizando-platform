export function teachingArticleSection(input:{goal:string;steps:string;adaptations:string;product?:{title:string;slug:string}|null}) {
  if(input.goal.trim().length<20||input.steps.trim().length<40)throw new Error('Explique o objetivo em pelo menos 20 caracteres e a aplicação em pelo menos 40.');
  return ['## Objetivo pedagógico',input.goal.trim(),'## Como aplicar na aula',input.steps.trim(),...(input.adaptations.trim()?['## Adaptações para a turma',input.adaptations.trim()]:[]),...(input.product?['## Material citado',input.product.title,`https://www.educalizando.com.br/produto/${encodeURIComponent(input.product.slug)}`]:[])].join('\n\n');
}
export function articleProductReferences(content:string){
  const refs=new Set<string>();
  for(const raw of content.match(/https:\/\/[^\s<>]+/g)||[])try{const url=new URL(raw.replace(/[),.;!?]+$/,''));if(!['www.educalizando.com.br','educalizando.com.br'].includes(url.hostname)||url.username||url.password)continue;const match=/^\/produto\/([a-z0-9-]+)\/?$/.exec(url.pathname);if(match&&url.searchParams.get('licenca')!=='plr')refs.add(match[1]);if(refs.size===8)break;}catch{/* Ignore invalid links. */}
  return [...refs];
}
