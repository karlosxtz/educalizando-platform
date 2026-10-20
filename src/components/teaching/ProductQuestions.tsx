'use client';
import { useEffect,useState } from 'react';
import { MessageCircle,MessageSquareReply,Send,ShieldCheck } from 'lucide-react';
import { StudioNotice,studioStyles as s } from './TeachingStudio';
import { customerApi } from '@/lib/customer-api';
import { readApiJson } from '@/lib/api-response';
type Question={id:string;question:string;answer:string};
export default function ProductQuestions({productId}:{productId:string}){
  const [rows,setRows]=useState<Question[]>([]),[question,setQuestion]=useState(''),[message,setMessage]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{const controller=new AbortController();setRows([]);setError('');void fetch(`/api/material-questions?product=${productId}`,{cache:'no-store',signal:controller.signal}).then(async r=>{const data=await readApiJson(r);if(!r.ok)throw new Error(data.error);setRows(data.questions||[]);}).catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Não foi possível carregar as perguntas.');});return()=>controller.abort();},[productId]);
  async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');setMessage('');try{await customerApi('/api/material-questions',{method:'POST',body:JSON.stringify({product_id:productId,question})});setQuestion('');setMessage('Pergunta enviada ao criador. Ela aparecerá aqui quando for respondida.');}catch(e){setError(e instanceof Error?e.message:'Não foi possível enviar.');}finally{setBusy(false);}}
  return <section className={`${s.studio} ${s.card} ${s.embed}`}>
    <div className={s.cardHeader}><div className="flex items-start gap-3"><span className={`${s.icon} ${s.blue}`}><MessageCircle/></span><div><h2>Dúvidas sobre este material</h2><p>Uma conversa com quem criou ajuda você a escolher com confiança.</p></div></div></div>
    <div className={s.split}>
      <div>
        <div className={s.stack}>{rows.map(row=><article key={row.id}><div className={s.question}><span className={s.eyebrow}>Pergunta de um professor</span><h3 className="break-words font-semibold">{row.question}</h3></div><div className={s.answer}><span className="mb-2 flex items-center gap-2 text-xs font-bold"><MessageSquareReply size={15}/>Resposta do criador</span>{row.answer}</div></article>)}</div>
        {!rows.length&&!error&&<div className={`${s.card} ${s.cardTint}`}><MessageCircle className="mb-3 h-6 w-6 text-violet-400"/><h3 className="text-base font-bold">Sua dúvida pode ajudar outros professores</h3><p className={s.note+' mt-2'}>Ainda não há perguntas respondidas. Pergunte sobre o conteúdo, a faixa etária ou como usar a atividade na sua turma.</p></div>}
        <p className={s.note+' mt-4'}>Precisa de ajuda com um pedido? Use o atendimento da loja para tratar de pagamento e entrega.</p>
      </div>
      <form onSubmit={submit} className={`${s.card} ${s.cardTint}`}>
        <label className={s.field}>Sua pergunta<textarea required minLength={10} maxLength={1000} rows={4} className={s.input} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ex.: esta atividade pode ser usada no 1º ano?"/></label>
        <p className={s.note+' mt-3'}><ShieldCheck className="mr-1 inline h-3.5 w-3.5"/>Sua pergunta pode ficar pública após a resposta. Não inclua telefone, e-mail ou dados de alunos.</p>
        <button disabled={busy} className={s.primary+' mt-4 w-full'}><Send/>{busy?'Enviando pergunta…':'Perguntar ao criador'}</button>
        <p className={s.note+' mt-3'}>Entre na sua conta para enviar. Seu e-mail não aparece na página.</p>
      </form>
    </div>
    {error&&<div className="mt-4"><StudioNotice>{error}</StudioNotice></div>}{message&&<div className="mt-4"><StudioNotice success>{message}</StudioNotice></div>}
  </section>;
}