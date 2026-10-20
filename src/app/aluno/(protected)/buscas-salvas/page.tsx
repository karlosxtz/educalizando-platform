'use client';
import { useCallback,useEffect,useState } from 'react';
import Link from 'next/link';
import { ArrowRight,Bell,BookmarkCheck,CalendarDays,Compass,Search,Trash2 } from 'lucide-react';
import { StudioHero,StudioEmpty,StudioNotice,StudioLoading,StudioToggle,studioStyles as s } from '@/components/teaching/TeachingStudio';
import { customerApi } from '@/lib/customer-api';
type Saved={id:string;name:string;filters:Record<string,string>;notifications_enabled:boolean;created_at:string};
type Result={products:{id:string;titulo:string;slug:string}[];checkedAt:string;partial:boolean};
export default function Page(){
  const [rows,setRows]=useState<Saved[]>([]),[results,setResults]=useState<Record<string,Result>>({}),[busy,setBusy]=useState(''),[error,setError]=useState(''),[ready,setReady]=useState(false);
  const load=useCallback(async()=>{const data=await customerApi('/api/customer/saved-searches');setRows(data.searches);},[]);
  useEffect(()=>{void load().catch(e=>setError(e.message)).finally(()=>setReady(true));},[load]);
  useEffect(()=>{let alive=true,index=0;const enabled=rows.filter(r=>r.notifications_enabled);async function worker(){while(alive&&index<enabled.length){const row=enabled[index++];try{const data=await customerApi(`/api/customer/saved-searches?check=${row.id}`);if(alive)setResults(r=>({...r,[row.id]:data}));}catch(e){if(alive)setError(e instanceof Error?e.message:'Não foi possível consultar as novidades.');}}}void worker();void worker();return()=>{alive=false;};},[rows]);
  async function act(id:string,action:'check'|'toggle'|'delete',enabled?:boolean){setBusy(id);setError('');try{if(action==='check'){const data=await customerApi(`/api/customer/saved-searches?check=${id}`);setResults(r=>({...r,[id]:data}));}else{await customerApi(`/api/customer/saved-searches${action==='delete'?`?id=${id}`:''}`,{method:action==='delete'?'DELETE':'PUT',...(action==='toggle'?{body:JSON.stringify({id,notifications_enabled:enabled})}:{})});setResults(r=>{const copy={...r};delete copy[id];return copy;});await load();}}catch(e){setError(e instanceof Error?e.message:'Não foi possível concluir.');}finally{setBusy('');}}
  const labels:Record<string,string>={q:'Tema',categoria:'Categoria',preco:'Preço',ano_escolar:'Etapa',idade:'Idade',disciplina:'Disciplina',tema:'Tema',bncc:'BNCC',formato:'Formato',cor:'Impressão',filter:'Modalidade',data:'Data comemorativa'};
  const labelValue=(key:string,value:string)=>key==='idade'?`${value} anos`:({gratis:'Gratuito',pago:'Pago',plr:'PLR',preto_e_branco:'Preto e branco',colorido:'Colorido'}[value]||value);
  return <main className={`${s.page} ${s.studio}`}><div className={s.container}>
    <StudioHero eyebrow="Descobertas que ficam" title="Guarde a busca. Encontre novas ideias." description="Seus temas e filtros favoritos, sempre à mão. Volte quando quiser e confira o que chegou de novo para a sua turma." icon={BookmarkCheck} tag="Suas próximas descobertas"/>
    <nav aria-label="Ferramentas do professor" className={s.nav}><Link href="/cliente/dashboard"><Compass/>Minha biblioteca</Link><Link href="/cliente/planejamento"><CalendarDays/>Planejamento de aulas</Link><Link href="/cliente/buscas-salvas" aria-current="page"><BookmarkCheck/>Buscas salvas</Link></nav>
    {error&&<StudioNotice>{error} <Link href="/cliente/login" className="underline">Entrar na conta</Link></StudioNotice>}
    <div className={s.split}>
      <section className={s.stack} aria-label="Suas buscas salvas">
        <div className={s.sectionHeading}><div><h2>Suas seleções</h2><p>Os mesmos filtros, com a facilidade de um atalho.</p></div><span className={s.badge}>{rows.length}/20 buscas</span></div>
        {!ready&&<StudioLoading>Preparando suas buscas…</StudioLoading>}
        {ready&&!error&&!rows.length&&<div className={s.card}><StudioEmpty icon={Search} title="Uma boa busca merece ser guardada" description="Encontre um tema no catálogo, ajuste os filtros e toque em “Salvar esta busca”. Na próxima visita, sua seleção já está pronta."><Link href="/buscar" className={s.primary}>Explorar materiais<ArrowRight/></Link></StudioEmpty></div>}
        {rows.map(row=><article key={row.id} className={s.card}>
          <div className={s.cardHeader}><div className="flex min-w-0 items-start gap-3"><span className={s.icon}><BookmarkCheck/></span><div className="min-w-0"><h2 className="break-words">{row.name}</h2><p>Salva em {new Date(row.created_at).toLocaleDateString('pt-BR')}</p></div></div><button disabled={busy===row.id} onClick={()=>void act(row.id,'delete')} aria-label={`Excluir busca ${row.name}`} className={s.danger}><Trash2/></button></div>
          <div className={s.chips}>{Object.entries(row.filters).map(([key,value])=><span key={key} className={s.chip}><strong>{labels[key]||'Filtro'}: </strong>{labelValue(key,value)}</span>)}</div>
          <div className={s.actionRow+' mt-5'}><Link href={`/buscar?${new URLSearchParams(row.filters)}`} className={s.primary}>Abrir minha seleção<ArrowRight/></Link>{row.notifications_enabled&&<button disabled={busy===row.id} onClick={()=>void act(row.id,'check')} className={s.secondary}><Bell/>{busy===row.id?'Consultando…':'Conferir novidades'}</button>}</div>
          <hr className={s.divider}/>
          <StudioToggle disabled={busy===row.id} checked={row.notifications_enabled} onChange={enabled=>void act(row.id,'toggle',enabled)} label="Quero ver novidades desta busca" description="Ao abrir esta página, consultamos os materiais publicados depois que você salvou."/>
          {results[row.id]&&<div role="status" className={s.results}><p className="font-bold">{results[row.id].products.length?`${results[row.id].products.length} novas ideias para você conhecer`:'Sua seleção está em dia'}</p>{!results[row.id].products.length&&<p className="mt-1">Ainda não encontramos materiais novos com estes filtros nesta consulta.</p>}<ul>{results[row.id].products.map(p=><li key={p.id}><Link href={`/produto/${p.slug||p.id}`}><ArrowRight/>{p.titulo}</Link></li>)}</ul><p className={s.note}>Consulta em {new Date(results[row.id].checkedAt).toLocaleString('pt-BR')}. {results[row.id].partial?'Exibimos até 24 resultados recentes. Abra a seleção para ver os demais.':'Resultados de acordo com os filtros e o cadastro dos materiais.'}</p></div>}
        </article>)}
      </section>
      <aside className={`${s.stack} ${s.sideSticky}`}>
        <div className={`${s.card} ${s.cardTint}`}><span className={`${s.icon} ${s.mint}`}><Compass/></span><h2 className="mt-4 text-lg font-extrabold">Como começar?</h2><ol className="mt-4 space-y-4"><li className="flex gap-3"><span className={s.stepNumber}>01</span><div><strong className="text-xs">Busque um tema</strong><p className={s.note}>Por exemplo, leitura para o 1º ano.</p></div></li><li className="flex gap-3"><span className={s.stepNumber}>02</span><div><strong className="text-xs">Escolha seus filtros</strong><p className={s.note}>Etapa, idade ou formato do material.</p></div></li><li className="flex gap-3"><span className={s.stepNumber}>03</span><div><strong className="text-xs">Salve para voltar depois</strong><p className={s.note}>Dê um nome fácil de reconhecer.</p></div></li></ol><Link href="/buscar" className={s.secondary+' mt-5 w-full'}><Search/>Criar uma nova busca</Link></div>
        <div className={s.help}><strong>Avisos do seu jeito</strong>As novidades são consultadas aqui na plataforma. Sem mensagens por e-mail ou WhatsApp. Ative ou desative cada busca quando quiser.</div>
      </aside>
    </div>
  </div></main>;
}