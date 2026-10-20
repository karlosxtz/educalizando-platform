import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { ArrowRight,BookOpen,Compass,Search,SlidersHorizontal,Sparkles } from 'lucide-react';
import { StudioHero,StudioEmpty,StudioNotice,studioStyles as s } from '@/components/teaching/TeachingStudio';
import c from '@/components/teaching/CommerceExperience.module.css';
import { readPedagogicalCatalog } from '@/lib/pedagogical-catalog';
import { pedagogicalMatch,type PedagogicalCriteria } from '@/lib/pedagogical-discovery';
export const revalidate=0;
export const metadata={title:'Encontre seu material por objetivo | Educalizando',robots:{index:false,follow:true},alternates:{canonical:'https://www.educalizando.com.br/encontrar-material'}};
export default async function PedagogicalFinder({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const params=await searchParams;const text=(key:string)=>typeof params[key]==='string'?(params[key] as string).trim().slice(0,160):'';
  const criteria:PedagogicalCriteria={goal:text('objetivo'),stage:text('etapa'),age:text('idade'),subject:text('disciplina')};
  const searched=Object.values(criteria).some(Boolean);let unavailable=false;let matches:{product:Awaited<ReturnType<typeof readPedagogicalCatalog>>[number];score:number;reasons:string[]}[]=[];
  if(searched)try{matches=(await readPedagogicalCatalog()).flatMap(product=>{const match=pedagogicalMatch(product,criteria);return match?[{product,...match}]:[];}).sort((a,b)=>b.score-a.score||a.product.titulo.localeCompare(b.product.titulo,'pt-BR'));}catch{unavailable=true;}
  return <div className={`${c.surface} ${s.studio}`}><MarketplaceHeader/><main className={c.content}>
    <StudioHero eyebrow="Da sua ideia à próxima descoberta" title="Encontre o material que combina com a sua aula." description="Conte o que quer trabalhar e descubra recursos dos nossos criadores. Uma forma mais simples de transformar seu objetivo em possibilidades para ensinar." icon={Compass} tag="Comece pelo que quer ensinar"/>
    <div className={c.finderLayout}>
      <form action="/encontrar-material" className={c.finderForm}>
        <div className={s.cardHeader}><div><h2>O que a sua turma vai descobrir?</h2><p>Comece pelo objetivo. Os demais filtros são opcionais.</p></div><span className={`${s.icon} ${s.mint}`}><Search/></span></div>
        <label className={s.field}>Objetivo da aula<input name="objetivo" defaultValue={criteria.goal} maxLength={160} placeholder="Ex.: trabalhar leitura no 1º ano" className={s.input}/></label>
        <div className={c.examples} aria-label="Exemplos de objetivos"><Link href="/encontrar-material?objetivo=leitura"><BookOpen size={12}/>Leitura</Link><Link href="/encontrar-material?objetivo=jogos%20de%20matem%C3%A1tica">Jogos de matemática</Link><Link href="/encontrar-material?objetivo=coordena%C3%A7%C3%A3o%20motora">Coordenação motora</Link></div>
        <hr className={s.divider}/>
        <div className={s.formGridThree}><label className={s.field}>Etapa<select name="etapa" defaultValue={criteria.stage} className={s.input}><option value="">Qualquer etapa</option>{['Educação infantil','Ensino fundamental','Alfabetização',...Array.from({length:9},(_,i)=>`${i+1} ano`)].map(item=><option key={item}>{item}</option>)}</select></label><label className={s.field}>Idade (opcional)<input name="idade" type="number" min={1} max={18} defaultValue={criteria.age} placeholder="Ex.: 7 anos" className={s.input}/></label><label className={s.field}>Disciplina<select name="disciplina" defaultValue={criteria.subject} className={s.input}><option value="">Todas as disciplinas</option>{['Português','Matemática','Ciências','História','Geografia','Inglês','Artes'].map(item=><option key={item}>{item}</option>)}</select></label></div>
        <div className={s.saveBar}><p><SlidersHorizontal className="mr-1 inline h-3.5 w-3.5"/>Quanto mais critérios, mais específica fica a seleção.</p><button className={s.primary}><Search/>Encontrar materiais<ArrowRight/></button></div>
      </form>
      <aside className={c.guide}><Sparkles size={28}/><h2>Uma ideia já é um ótimo começo.</h2><p>Experimente “leitura”, “frações” ou “coordenação motora”. Se quiser, refine pela etapa da turma.</p><hr className={s.divider}/><p>As sugestões usam informações do cadastro dos materiais. Confira a descrição e as prévias para decidir o que atende à sua aula.</p><details className="mt-4"><summary className={s.note+' cursor-pointer font-semibold'}>Como os critérios são usados?</summary><p className="mt-2">Idade e etapa só são consideradas quando há informações no cadastro. Não analisamos automaticamente os arquivos pagos. Se não houver resultado, experimente menos filtros.</p></details></aside>
    </div>
    {searched&&<section aria-label="Materiais encontrados"><div className={c.resultHeader}><div><span className={s.eyebrow}>Sua seleção de possibilidades</span><h2>{unavailable?'Vamos tentar novamente?':`${matches.length} ${matches.length===1?'material com correspondência':'materiais com correspondências'} no cadastro`}</h2><p>Até 24 sugestões por correspondência com seus critérios, sem prioridade paga por loja.</p></div><Link href="/encontrar-material" className={s.secondary}>Limpar critérios</Link></div>
      {unavailable?<StudioNotice>Não foi possível consultar o catálogo agora. Tente novamente.</StudioNotice>:!matches.length?<div className={s.card}><StudioEmpty icon={Search} title="Vamos ampliar as possibilidades?" description="Não encontramos materiais com todos esses critérios. Experimente somente o objetivo ou escolha outra etapa."><Link href={`/encontrar-material?objetivo=${encodeURIComponent(criteria.goal)}`} className={s.primary}>Buscar só pelo objetivo<ArrowRight/></Link></StudioEmpty></div>:<div className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{matches.slice(0,24).map(({product,reasons},index)=><div key={product.id} className="min-w-0"><ProductCard product={product} priority={index<4}/><details className={c.reason}><summary>Por que este material apareceu?</summary><ul>{reasons.map(reason=><li key={reason}>{reason}</li>)}</ul></details></div>)}</div>}
    </section>}
  </main><Footer/></div>;
}