'use client';
import { useCallback,useEffect,useState } from 'react';
import Link from 'next/link';
import { ArrowRight,BarChart3,Check,Clock3,Eye,Plus,Radio,Sparkles,Users } from 'lucide-react';
import { StudioHero,StudioStep,StudioEmpty,StudioNotice,StudioLoading,studioStyles as s } from '@/components/teaching/TeachingStudio';
import { customerApi } from '@/lib/customer-api';
import { PollResults,type CreatorPoll,type PollCount } from '@/components/teaching/StorePolls';
export default function Page(){
  const [polls,setPolls]=useState<CreatorPoll[]>([]),[counts,setCounts]=useState<PollCount[]>([]),[slug,setSlug]=useState(''),[question,setQuestion]=useState(''),[options,setOptions]=useState(['','']),[days,setDays]=useState('7'),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[ready,setReady]=useState(false);
  const load=useCallback(async()=>{const data=await customerApi('/api/creator/polls');setPolls(data.polls);setCounts(data.counts);setSlug(data.store.slug);},[]);
  useEffect(()=>{void load().catch(e=>setError(e.message)).finally(()=>setReady(true));},[load]);
  async function create(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');setMessage('');try{await customerApi('/api/creator/polls',{method:'POST',body:JSON.stringify({question,options,days:Number(days)})});setQuestion('');setOptions(['','']);await load();setMessage('Enquete publicada na sua loja. Compartilhe o link da loja para convidar compradores a participar.');}catch(e){setError(e instanceof Error?e.message:'Não foi possível publicar.');}finally{setBusy(false);}}
  async function close(id:string){if(!window.confirm('Encerrar esta enquete? Os votos já registrados continuam visíveis.'))return;setBusy(true);setError('');try{await customerApi('/api/creator/polls',{method:'PUT',body:JSON.stringify({id})});await load();}catch(e){setError(e instanceof Error?e.message:'Não foi possível encerrar.');}finally{setBusy(false);}}
  const totalVotes=counts.reduce((sum,c)=>sum+Number(c.votes),0);
  return <main className={`${s.studio} ${s.creator}`}>
    <StudioHero eyebrow="Comunidade que inspira" title="Sua próxima criação começa com uma conversa." description="Descubra o que os professores querem encontrar na sua loja. Faça uma pergunta, acompanhe as escolhas e crie mais perto de quem compra." icon={BarChart3} tag="Ideias construídas juntos"/>
    <div className={s.summary} aria-label="Resumo das enquetes nesta lista"><div><span className={s.icon}><BarChart3/></span><div><strong>{polls.length}</strong><span>Enquetes nesta lista</span></div></div><div><span className={`${s.icon} ${s.mint}`}><Users/></span><div><strong>{totalVotes}</strong><span>Votos nesta lista</span></div></div><div><span className={`${s.icon} ${s.peach}`}><Sparkles/></span><div><strong>2–5</strong><span>Opções por enquete</span></div></div></div>
    {error&&<StudioNotice>{error}</StudioNotice>}{message&&<StudioNotice success>{message}</StudioNotice>}
    <div className={s.split}>
      <form onSubmit={create} className={s.card}>
        <div className={s.cardHeader}><div><span className={s.eyebrow}>Uma ideia, várias possibilidades</span><h2>Monte sua enquete</h2></div><span className={s.badge}><Radio/>Nova enquete</span></div>
        <StudioStep number="01" title="Comece com uma boa pergunta" description="Seja direto. Pergunte sobre temas, tipos de atividade ou formatos que você pode criar."/>
        <label className={s.field}>O que você quer perguntar?<input required minLength={10} maxLength={240} value={question} onChange={e=>setQuestion(e.target.value)} className={s.input} placeholder="Qual atividade você gostaria de ver na minha loja?"/><span className={s.fieldHint}>Ex.: “Qual tema devo preparar para as próximas aulas?”</span></label>
        <hr className={s.divider}/>
        <StudioStep number="02" title="Dê opções fáceis de escolher" description="Cada pessoa poderá escolher uma única resposta. Use de duas a cinco alternativas diferentes."/>
        <div className={s.formGrid}>{options.map((option,i)=><label key={i} className={s.field}>Opção {i+1}<input required maxLength={100} className={s.input} value={option} placeholder={['Ex.: Jogos de alfabetização','Ex.: Atividades de matemática','Mais uma ideia…'][Math.min(i,2)]} onChange={e=>setOptions(values=>values.map((v,j)=>j===i?e.target.value:v))}/></label>)}</div>
        <div className={s.actionRow+' mt-4'}>{options.length<5&&<button type="button" onClick={()=>setOptions([...options,''])} className={s.soft}><Plus/>Adicionar opção</button>}{options.length>2&&<button type="button" onClick={()=>setOptions(options.slice(0,-1))} className={s.danger}>Remover última opção</button>}</div>
        <hr className={s.divider}/>
        <StudioStep number="03" title="Escolha o tempo de participação" description="Quando o prazo terminar, a enquete para de receber votos. Os resultados continuam disponíveis."/>
        <label className={s.field+' max-w-xs'}>Fica aberta por<select value={days} onChange={e=>setDays(e.target.value)} className={s.input}>{[1,3,7,14,30].map(day=><option key={day} value={day}>{day} {day===1?'dia':'dias'}</option>)}</select></label>
        <div className={s.saveBar}><p>A pergunta e as opções ficam fixas depois de publicar. Confira sua prévia antes de continuar.</p><button disabled={busy||!ready} className={s.primary}><Check/>{busy?'Publicando…':'Publicar enquete'}</button></div>
      </form>
      <aside className={s.stack}>
        <div className={s.preview}><p className={s.previewLabel}><Eye/>Prévia da sua enquete</p><div className={s.previewPaper}><span className={`${s.badge} ${s.badgeGreen}`}><Radio/>Participação aberta</span><h3>{question.trim()||'Sua pergunta vai aparecer aqui'}</h3>{options.map((option,i)=><div key={i} className={`${s.option} ${s.optionPreview}`}><span className={s.optionDot}/>{option.trim()||`Sua opção ${i+1}`}</div>)}<p className={s.note+' mt-4'}><Clock3 className="mr-1 inline h-3 w-3"/>{days} {days==='1'?'dia':'dias'} para participar · Uma escolha por conta</p></div><p className={s.note+' mt-4'}>Esta é uma prévia. A enquete só aparece na loja depois que você publicar.</p></div>
        <div className={s.help}><strong>Convide sua comunidade</strong>Depois de publicar, compartilhe o link da sua loja com os professores. A votação acontece na Educalizando, com um voto por conta.{slug&&<Link href={`/loja/${slug}`} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-2 font-bold">Ver minha loja<ArrowRight size={14}/></Link>}</div>
      </aside>
    </div>
    <section className="mt-8"><div className={s.sectionHeading}><div><h2>O que a sua comunidade está dizendo</h2><p>Acompanhe suas enquetes e as escolhas dos participantes.</p></div></div>
      {!ready&&<StudioLoading>Buscando suas enquetes…</StudioLoading>}
      {ready&&!error&&!polls.length&&<div className={s.card}><StudioEmpty icon={Users} title="Vamos ouvir os professores?" description="Sua primeira enquete aparece aqui depois da publicação. Comece com uma pergunta simples sobre a próxima atividade que você quer criar."/></div>}
      <div className={s.columns}>{polls.map(p=>{const closed=p.closed||new Date(p.closes_at)<=new Date();return <article key={p.id} className={s.card}><div className={s.cardHeader}><span className={`${s.badge} ${closed?s.badgeNeutral:s.badgeGreen}`}>{closed?'Encerrada':'Recebendo votos'}</span><span className={s.note}><Clock3 className="mr-1 inline h-3 w-3"/>{new Date(p.closes_at).toLocaleDateString('pt-BR')}</span></div><h3 className="break-words text-lg font-bold">{p.question}</h3><PollResults poll={p} counts={counts}/>{!closed&&<button disabled={busy} onClick={()=>void close(p.id)} className={s.danger+' mt-4'}>Encerrar participação</button>}</article>})}</div>
      <p className={s.note+' mt-5'}>Até 5 enquetes abertas por loja. A enquete orienta suas ideias, mas não representa uma promessa de vendas ou uma pesquisa de todo o público.</p>
    </section>
  </main>;
}