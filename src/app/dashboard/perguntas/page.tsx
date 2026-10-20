'use client';
import { useCallback,useEffect,useState } from 'react';
import { Check,EyeOff,MessageCircle,MessageSquareReply,Save,ShieldCheck } from 'lucide-react';
import { customerApi } from '@/lib/customer-api';
import { StudioHero,StudioEmpty,StudioNotice,StudioLoading,StudioToggle,studioStyles as s } from '@/components/teaching/TeachingStudio';
type Row={id:string;question:string;answer:string|null;hidden:boolean;created_at:string;product:{id:string;titulo:string}|{id:string;titulo:string}[]};
function QuestionEditor({row,refresh}:{row:Row;refresh:()=>Promise<void>}){
  const [answer,setAnswer]=useState(row.answer||''),[hidden,setHidden]=useState(row.hidden),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const product=Array.isArray(row.product)?row.product[0]:row.product;
  async function save(){setBusy(true);setError('');try{await customerApi('/api/creator/material-questions',{method:'PUT',body:JSON.stringify({id:row.id,answer:answer.trim()||null,hidden})});await refresh();}catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar.');}finally{setBusy(false);}}
  return <article className={s.card}>
    <div className={s.cardHeader}><div className="flex min-w-0 items-start gap-3"><span className={`${s.icon} ${s.blue}`}><MessageCircle/></span><div className="min-w-0"><p className="!mt-0 break-words !font-semibold !text-slate-700">{product?.titulo}</p><p>{new Date(row.created_at).toLocaleDateString('pt-BR')}</p></div></div><span className={`${s.badge} ${row.hidden?s.badgeNeutral:row.answer?s.badgeGreen:s.badgeAmber}`}>{row.hidden?<EyeOff/>:row.answer?<Check/>:<MessageCircle/>}{row.hidden?'Oculta':row.answer?'Respondida':'Aguardando você'}</span></div>
    <div className={s.question}><span className={s.eyebrow}>Pergunta do comprador</span><p>{row.question}</p></div>
    <label className={s.field}>Sua resposta<textarea rows={4} maxLength={2000} value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Responda com clareza sobre o que o material oferece e como ele pode ser usado." className={s.input}/><span className={s.fieldHint}>A resposta aparece junto da pergunta na página do material, se ela não estiver oculta.</span></label>
    <hr className={s.divider}/>
    <StudioToggle checked={hidden} onChange={setHidden} label="Ocultar da página pública" description="Use para perguntas com dados pessoais, conteúdo inadequado ou atendimento de pedido."/>
    <div className={s.saveBar}><p>Sem resposta, a pergunta continua privada no seu painel.</p><button disabled={busy} onClick={()=>void save()} className={s.primary}><Save/>{busy?'Salvando…':'Salvar resposta'}</button></div>
    {error&&<div className="mt-4"><StudioNotice>{error}</StudioNotice></div>}
  </article>;
}
export default function Page(){
  const [rows,setRows]=useState<Row[]>([]),[error,setError]=useState(''),[page,setPage]=useState(1),[total,setTotal]=useState(0),[ready,setReady]=useState(false),[filter,setFilter]=useState<'all'|'pending'|'answered'|'hidden'>('all');
  const load=useCallback(async()=>{const data=await customerApi(`/api/creator/material-questions?page=${page}`);setRows(data.questions);setTotal(data.total);},[page]);
  useEffect(()=>{setReady(false);setError('');void load().catch(e=>setError(e.message)).finally(()=>setReady(true));},[load]);
  const pending=rows.filter(r=>!r.answer&&!r.hidden).length;
  const visible=rows.filter(r=>filter==='all'||filter==='pending'&&!r.answer&&!r.hidden||filter==='answered'&&r.answer&&!r.hidden||filter==='hidden'&&r.hidden);
  return <main className={`${s.studio} ${s.creator}`}>
    <StudioHero eyebrow="Conversa que traz confiança" title="Uma boa resposta aproxima a próxima compra." description="Ajude os professores a conhecer seus materiais. Responda uma vez e deixe a informação disponível para quem chegar depois." icon={MessageSquareReply} tag="Mais clareza para escolher"/>
    {error&&<StudioNotice>{error}</StudioNotice>}
    <div className={s.split}>
      <section aria-label="Perguntas dos compradores">
        <div className={s.sectionHeading}><div><h2>Sua caixa de perguntas</h2><p>{total} {total===1?'pergunta recebida':'perguntas recebidas'} · {pending} aguardando resposta nesta página.</p></div><span className={`${s.icon} ${s.blue}`}><MessageCircle/></span></div>
        <div className={s.filterTabs} role="group" aria-label="Filtrar perguntas desta página">{([['all','Todas'],['pending','Para responder'],['answered','Respondidas'],['hidden','Ocultas']] as const).map(([value,label])=><button key={value} onClick={()=>setFilter(value)} aria-pressed={filter===value}>{label}</button>)}</div>
        {!ready&&<StudioLoading>Organizando suas conversas…</StudioLoading>}
        {ready&&!error&&!visible.length&&<div className={s.card}><StudioEmpty icon={MessageSquareReply} title={rows.length?'Tudo em ordem por aqui':'As boas conversas começam com uma dúvida'} description={rows.length?'Não há perguntas com esse filtro nesta página. Escolha outra opção para continuar.':'Quando alguém perguntar sobre um dos seus materiais, a conversa aparece aqui. Você responde pelo painel e ajuda outros professores a escolher.'}/></div>}
        <div className={s.stack}>{visible.map(row=><QuestionEditor key={row.id+row.answer+String(row.hidden)} row={row} refresh={load}/>)}</div>
        {total>30&&<nav aria-label="Páginas de perguntas" className={s.pagination}><button disabled={page===1} onClick={()=>setPage(p=>p-1)} className={s.secondary}>Anterior</button><span>Página {page} de {Math.ceil(total/30)}</span><button disabled={page*30>=total} onClick={()=>setPage(p=>p+1)} className={s.secondary}>Próxima</button></nav>}
      </section>
      <aside className={`${s.stack} ${s.sideSticky}`}>
        <div className={`${s.card} ${s.cardTint}`}><span className={s.icon}><MessageSquareReply/></span><h2 className="mt-4 text-lg font-extrabold">Respostas que ajudam</h2><p className={s.note+' mt-2'}>Seja específico sobre o material. Uma resposta útil costuma esclarecer:</p><ul className="mt-4 space-y-3 text-xs text-slate-600">{['O que está incluído no arquivo.','Para qual turma ou objetivo foi pensado.','Como imprimir, montar ou aplicar.'].map(text=><li key={text} className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"/>{text}</li>)}</ul></div>
        <div className={s.help}><ShieldCheck className="mb-2 h-5 w-5"/><strong>Você decide o que aparece</strong>A pergunta só fica pública depois de respondida e se não estiver oculta. O e-mail do comprador não aparece na página do produto.</div>
        <p className={s.note}>Os filtros organizam as perguntas da página atual. Para problemas de pagamento ou entrega, oriente o comprador a usar o atendimento da loja.</p>
      </aside>
    </div>
  </main>;
}