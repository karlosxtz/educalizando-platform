'use client';
import { useCallback,useEffect,useState } from 'react';
import { BarChart3,Check,Clock3,Users } from 'lucide-react';
import { StudioNotice,studioStyles as s } from './TeachingStudio';
import { customerApi } from '@/lib/customer-api';
import { readApiJson } from '@/lib/api-response';
export type CreatorPoll={id:string;question:string;options:string[];closes_at:string;closed:boolean};
export type PollCount={poll_id:string;option_index:number;votes:number};
export function PollResults({poll,counts}:{poll:CreatorPoll;counts:PollCount[]}){
  const total=counts.filter(c=>c.poll_id===poll.id).reduce((sum,c)=>sum+Number(c.votes),0);
  return <div className={s.pollResults}>{poll.options.map((option,i)=>{
    const count=Number(counts.find(c=>c.poll_id===poll.id&&c.option_index===i)?.votes||0),percent=total?Math.round(count/total*100):0;
    return <div key={i}><div className={s.resultLabel}><span>{option}</span><span>{count} {count===1?'voto':'votos'} · {percent}%</span></div><div className={s.track}><div style={{width:`${percent}%`}}/></div></div>;
  })}<p className={s.note}><Users className="mr-1 inline h-3.5 w-3.5"/>{total} {total===1?'participação':'participações'} · Resultados das contas que votaram nesta enquete.</p></div>;
}
export default function StorePolls({storeId}:{storeId:string}){
  const [now,setNow]=useState(0),[voted,setVoted]=useState<Set<string>>(new Set());
  const [polls,setPolls]=useState<CreatorPoll[]>([]),[counts,setCounts]=useState<PollCount[]>([]),[chosen,setChosen]=useState<Record<string,number>>({}),[busy,setBusy]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState('');
  const load=useCallback(async(signal?:AbortSignal)=>{const response=await fetch(`/api/store-polls?store=${storeId}`,{cache:'no-store',signal});const data=await readApiJson(response);if(!response.ok)throw new Error(data.error);setNow(Date.now());setPolls(data.polls);setCounts(data.counts);},[storeId]);
  useEffect(()=>{const controller=new AbortController();setPolls([]);void load(controller.signal).catch(()=>{/* Store stays usable while this optional section is unavailable. */});return()=>controller.abort();},[load]);
  async function vote(id:string){setBusy(id);setError('');setMessage('');try{await customerApi('/api/store-polls',{method:'POST',body:JSON.stringify({id,option:chosen[id]})});setVoted(v=>new Set(v).add(id));setMessage('Seu voto foi registrado. Obrigado por participar!');await load();}catch(e){setError(e instanceof Error?e.message:'Não foi possível votar.');}finally{setBusy('');}}
  if(!polls.length)return null;
  return <section aria-label="Enquetes da loja" className={`${s.studio} mx-auto my-8 max-w-7xl px-4 sm:px-6`}>
    <div className={`${s.card} ${s.cardTint}`}>
      <div className={s.cardHeader}><div className="flex items-start gap-3"><span className={s.icon}><BarChart3/></span><div><span className={s.eyebrow}>Juntos, surgem novas ideias</span><h2>O que você gostaria de aprender por aqui?</h2><p>Ajude este criador a escolher os temas das próximas atividades.</p></div></div></div>
      <div className={s.columns}>{polls.map(p=>{const closed=p.closed||new Date(p.closes_at).getTime()<=now;return <article key={p.id} className={s.previewPaper}>
        <div className={s.actionRow}><span className={`${s.badge} ${closed?s.badgeNeutral:s.badgeGreen}`}>{closed?'Participação encerrada':'Vamos escolher juntos'}</span><span className={s.note}><Clock3 className="mr-1 inline h-3 w-3"/>{closed?'Encerrada':'Até '+new Date(p.closes_at).toLocaleDateString('pt-BR')}</span></div>
        <h3>{p.question}</h3>
        {!closed&&!voted.has(p.id)&&<fieldset className={s.stack+' !gap-2'}><legend className="sr-only">Escolha uma opção para {p.question}</legend>{p.options.map((option,i)=><label key={i} className={s.option}><input type="radio" name={`poll-${p.id}`} checked={chosen[p.id]===i} onChange={()=>setChosen({...chosen,[p.id]:i})}/>{option}</label>)}<button disabled={busy===p.id||chosen[p.id]===undefined} onClick={()=>void vote(p.id)} className={s.primary+' mt-2'}><Check/>{busy===p.id?'Registrando…':'Confirmar meu voto'}</button><p className={s.note}>Um voto por conta Educalizando. Sua identidade não aparece nos resultados. O voto não pode ser alterado.</p></fieldset>}
        {voted.has(p.id)&&<div className={s.help}><strong>Obrigado por participar!</strong>Sua escolha ajuda a inspirar as próximas criações.</div>}
        <PollResults poll={p} counts={counts}/>
      </article>})}</div>
      {error&&<div className="mt-4"><StudioNotice>{error}</StudioNotice></div>}{message&&<div className="mt-4"><StudioNotice success>{message}</StudioNotice></div>}
    </div>
  </section>;
}