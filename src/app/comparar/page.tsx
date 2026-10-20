import MarketplaceHeader from '@/components/MarketplaceHeader';
import Footer from '@/components/Footer';
import CatalogImage from '@/components/ui/CatalogImage';
import ComparisonRemoveButton from '@/components/ComparisonRemoveButton';
import Link from 'next/link';
import { ArrowLeftRight,ArrowRight,BookOpen,MoveHorizontal,Plus,ShieldCheck } from 'lucide-react';
import { StudioHero,StudioEmpty,StudioNotice,studioStyles as s } from '@/components/teaching/TeachingStudio';
import c from '@/components/teaching/CommerceExperience.module.css';
import { supabase } from '@/lib/supabase';
import { parseComparison,comparisonFacts } from '@/lib/material-comparison';
import type { Product } from '@/lib/types';
export const revalidate=0;
export const metadata={title:'Comparar materiais | Educalizando',robots:{index:false,follow:true},alternates:{canonical:'https://www.educalizando.com.br/comparar'}};
export default async function ComparePage({searchParams}:{searchParams:Promise<{itens?:string}>}) {
  const choices=parseComparison(String((await searchParams).itens||'').slice(0,200));let unavailable=false;let rows:{choice:typeof choices[number];product:Product}[]=[];
  if(choices.length){const {data,error}=await supabase.from('products').select('id,store_id,titulo,slug,descricao,tipo,preco,is_free,is_plr,preco_plr,has_plr_delivery,capa_url,page_count,age_range,format_details,status').in('id',choices.map(c=>c.id)).eq('status','publicado').is('excluido_em',null);unavailable=Boolean(error);rows=choices.flatMap(choice=>{const product=(data||[]).find(p=>p.id===choice.id);return product&&(choice.mode!=='plr'||product.is_plr&&product.has_plr_delivery&&Number(product.preco_plr)>0)?[{choice,product:product as Product}]:[];});}
  return <div className={`${c.surface} ${s.studio}`}><MarketplaceHeader/><main className={c.content}>
    <StudioHero eyebrow="Escolha com mais clareza" title="Lado a lado, fica mais fácil decidir." description="Compare até três materiais e veja o que faz sentido para a sua turma. Conteúdo, formato e condições de uso organizados no mesmo lugar." icon={ArrowLeftRight} tag="O melhor é o que atende à sua aula"/>
    <div className={s.actionRow+' mb-6'}><Link href="/encontrar-material" className={s.primary}><Plus/>Encontrar materiais</Link><span className={s.note}>Nos produtos, toque em “Comparar material” para montar sua seleção.</span></div>
    {unavailable?<StudioNotice>Não foi possível consultar os materiais. Tente novamente.</StudioNotice>:!rows.length?<div className={s.card}><StudioEmpty icon={ArrowLeftRight} title="Sua escolha começa com uma seleção" description="Encontre dois ou três materiais no catálogo, marque “Comparar material” e volte para ver os detalhes lado a lado."><Link href="/buscar" className={s.primary}>Explorar o catálogo<ArrowRight/></Link></StudioEmpty></div>:<>
      {rows.length<choices.length&&<StudioNotice>Um ou mais materiais ou modalidades estão indisponíveis e foram retirados desta comparação.</StudioNotice>}
      <div className={c.resultHeader}><div><h2>{rows.length} {rows.length===1?'material na sua seleção':'materiais na sua seleção'}</h2><p>Informações reais dos cadastros. Campo ausente aparece como “Não informado”.</p></div><span className={s.badge}><MoveHorizontal size={12}/>Deslize para comparar</span></div>
      <div className={c.compareScroll} tabIndex={0} role="region" aria-label="Tabela de comparação, deslize horizontalmente para ver todos os materiais"><table className={c.compareTable}>
        <caption className="sr-only">Comparação de conteúdo, formato, páginas, público, licença e preço</caption>
        <thead><tr><th scope="col"><ArrowLeftRight className={c.tableIcon}/><span className="font-bold">O que comparar?</span><p className={c.tableIntro}>Comece pelos detalhes que mais importam para a sua aula.</p></th>{rows.map(({choice,product})=>{const facts=comparisonFacts(product,choice.mode);return <th key={choice.id+choice.mode} scope="col">
          {product.capa_url?<CatalogImage src={product.capa_url} alt={`Capa de ${product.titulo}`} width={240} height={240} className={c.compareCover}/>:<div className={c.compareCover+' grid place-items-center text-slate-300'}><BookOpen size={35}/></div>}
          <h2>{product.titulo}</h2><span className={`${s.badge} ${choice.mode==='plr'?'':s.badgeGreen}`}>{choice.mode==='plr'?'Licença PLR':'Produto final'}</span>
          <p className={c.comparePrice}>{facts[5][1]}</p><Link href={`/produto/${product.slug||product.id}${choice.mode==='plr'?'?licenca=plr':''}`} className={s.primary+' w-full'}>Conhecer material<ArrowRight/></Link><div className="mt-2"><ComparisonRemoveButton item={choice} choices={choices}/></div>
        </th>})}</tr></thead>
        <tbody>{[1,2,3,4,0].map(index=><tr key={index}><th scope="row">{comparisonFacts(rows[0].product,rows[0].choice.mode)[index][0]}</th>{rows.map(({choice,product})=>{const value=comparisonFacts(product,choice.mode)[index][1];return <td key={choice.id+choice.mode}>{index===0?<><p>{value.length>150?value.slice(0,150)+'…':value}</p>{value.length>150&&<details className={c.compareDetail}><summary>Expandir resumo do conteúdo</summary><p>{value}</p><Link href={`/produto/${product.slug||product.id}${choice.mode==='plr'?'?licenca=plr':''}`} className="underline">Ler a descrição completa no produto</Link></details>}</>:<span className={index===2&&value!=='Não informado'?'font-semibold text-slate-800':''}>{value}</span>}</td>})}</tr>)}</tbody>
      </table></div>
      <div className={s.help+' mt-5'}><ShieldCheck className="mb-2 h-5 w-5"/><strong>Confira também as condições de uso</strong>Produto final e licença PLR são modalidades diferentes. Os preços são os do cadastro, sem aplicar cupons. Confirme a descrição, as prévias e o checkout antes de comprar.</div>
    </>}
  </main><Footer/></div>;
}
