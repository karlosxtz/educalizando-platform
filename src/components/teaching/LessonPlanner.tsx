'use client';
import { useEffect,useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight,BookOpen,CalendarDays,Check,FileText,Heart,LockKeyhole,Plus,Printer,Save,Search,Trash2 } from 'lucide-react';
import { customerApi } from '@/lib/customer-api';
import { supabase } from '@/lib/supabase';
import { getStudentPurchases } from '@/lib/student-service';
import { TOOL_UUID,type TeachingPlan,type PlanMaterial } from '@/lib/teaching-tools';
import PrintingCalculator from './PrintingCalculator';
import { StudioHero,StudioStep,StudioEmpty,StudioNotice,StudioLoading,studioStyles as s } from './TeachingStudio';
const empty=():TeachingPlan=>({id:'',title:'',class_name:'',subject:'',lesson_date:null,notes:'',materials:[]});
export default function LessonPlanner(){
  const params=useSearchParams(),incoming=params.get('material')||'',plr=params.get('licenca')==='plr';
  const [plans,setPlans]=useState<TeachingPlan[]>([]),[draft,setDraft]=useState<TeachingPlan>(empty),[resources,setResources]=useState<PlanMaterial[]>([]),[selected,setSelected]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[ready,setReady]=useState(false),[resourceError,setResourceError]=useState('');
  async function refresh(){const data=await customerApi('/api/customer/teaching-plans');setPlans(data.plans);}
  useEffect(()=>{let alive=true;void (async()=>{try{const data=await customerApi('/api/customer/teaching-plans');if(!alive)return;setPlans(data.plans);const {data:session}=await supabase.auth.getSession();if(!session.session)return;
    try{const [purchases,favorites]=await Promise.all([getStudentPurchases(session.session.user.id),supabase.from('product_favorites').select('product_id').eq('user_id',session.session.user.id).limit(300)]);if(favorites.error)throw favorites.error;
      const ids=(favorites.data||[]).map(r=>r.product_id);if(TOOL_UUID.test(incoming))ids.push(incoming);
      const products=ids.length?await supabase.from('products').select('id,titulo').in('id',[...new Set(ids)]).eq('status','publicado').is('excluido_em',null):{data:[],error:null};if(products.error)throw products.error;
      const all:PlanMaterial[]=[...purchases.filter(p=>p.product&&['pago','liberado'].includes(p.status)).map(p=>({id:p.product_id||p.product!.id,title:p.product!.titulo,plr:Boolean(p.is_plr_purchase)})),...(products.data||[]).map(p=>({id:p.id,title:p.titulo,plr:p.id===incoming&&plr}))];
      if(alive){setResources([...new Map(all.map(p=>[p.id+String(p.plr),p])).values()]);const item=all.find(p=>p.id===incoming&&p.plr===plr);if(item)setDraft(d=>({...d,materials:[item]}));}
    }catch{if(alive)setResourceError('Não foi possível carregar todos os favoritos e compras. Você pode continuar editando seus planos e tentar recarregar a página.');}
  }catch(e){if(alive)setError(e instanceof Error?e.message:'Não foi possível carregar.');}finally{if(alive)setReady(true);}})();return()=>{alive=false;};},[incoming,plr]);
  async function save(){setBusy(true);setError('');try{const data=await customerApi('/api/customer/teaching-plans',{method:draft.id?'PUT':'POST',body:JSON.stringify(draft)});setDraft(data.plan);await refresh();}catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar.');}finally{setBusy(false);}}
  async function remove(id:string){if(!window.confirm('Excluir este planejamento? Esta ação remove apenas suas anotações.'))return;setBusy(true);try{await customerApi(`/api/customer/teaching-plans?id=${id}`,{method:'DELETE'});if(draft.id===id)setDraft(empty());await refresh();}catch(e){setError(e instanceof Error?e.message:'Não foi possível excluir.');}finally{setBusy(false);}}
  return <div className={`${s.studio} planning-workspace`}>
    <StudioHero eyebrow="Seu espaço de organização" title="Boas aulas começam com boas ideias." description="Transforme seus materiais favoritos em um planejamento com a sua cara. Organize a aula, reúna os recursos e leve tudo com você." icon={CalendarDays} tag="Feito para a sua rotina"/>
    <nav aria-label="Ferramentas do professor" className={`${s.nav} workspace-controls`}>
      <Link href="/cliente/dashboard"><BookOpen/>Minha biblioteca</Link>
      <Link href="/cliente/planejamento" aria-current="page"><CalendarDays/>Planejamento de aulas</Link>
      <Link href="/cliente/favoritos"><Heart/>Favoritos</Link>
      <Link href="/cliente/buscas-salvas"><Search/>Buscas salvas</Link>
    </nav>
    {error&&<StudioNotice>{error} <Link href="/cliente/login" className="underline">Entrar na conta</Link></StudioNotice>}
    {!ready&&<StudioLoading>Organizando seus planejamentos…</StudioLoading>}
    <div className={s.planner}>
      <aside className={`${s.stack} ${s.sideSticky} workspace-controls`}>
        <div className={s.card}>
          <div className={s.cardHeader}><div><h2>Meus planos</h2><p>Um espaço para cada nova aula.</p></div><span className={s.badge}>{plans.length}/100</span></div>
          <button disabled={busy||!ready} onClick={()=>setDraft(empty())} className={s.primary+' w-full'}><Plus/>Novo planejamento</button>
          <div className={s.stack+' mt-4'}>{plans.map(p=><div key={p.id} className={s.planItem} data-active={draft.id===p.id}>
            <button onClick={()=>setDraft(p)} aria-pressed={draft.id===p.id}>{p.title}</button>
            <div className={s.planMeta}><CalendarDays/>{p.lesson_date?p.lesson_date.split('-').reverse().join('/'):'Sem data definida'}</div>
            {p.class_name&&<div className={s.planMeta}>{p.class_name}</div>}
            <button aria-label={`Excluir ${p.title}`} disabled={busy} onClick={()=>void remove(p.id)} className={s.danger}><Trash2/>Excluir plano</button>
          </div>)}</div>
          {ready&&!plans.length&&!error&&<StudioEmpty compact icon={FileText} title="Sua próxima aula começa aqui" description="Dê um nome ao seu primeiro plano. Depois de salvar, ele aparece nesta lista."/>}
        </div>
        <div className={s.help}><strong>Da biblioteca para a aula</strong>Adicione os recursos que você comprou ou favoritou. Também dá para começar pelo botão de planejamento na página de qualquer material.<Link href="/buscar" className="mt-3 flex items-center gap-2 font-bold">Encontrar materiais <ArrowRight size={14}/></Link></div>
      </aside>
      <section className={s.card}>
        <div className={`${s.cardHeader} workspace-controls`}><div><span className={s.eyebrow}>Seu roteiro de aula</span><h2>{draft.id?'Vamos aperfeiçoar este plano?':'Uma nova ideia para ensinar'}</h2></div><span className={`${s.badge} ${s.badgeGreen}`}><LockKeyhole/>Privado</span></div>
        <div className="plan-editor">
          <StudioStep number="01" title="Dê um contexto à sua aula" description="Um título claro e a turma ajudam você a encontrar o plano depois."/>
          <label className={s.field}>Título do planejamento<input maxLength={120} className={s.input} placeholder="Ex.: Uma semana de descobertas na leitura" value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label>
          <div className={s.formGridThree+' mt-5'}>
            <label className={s.field}>Turma<input maxLength={100} className={s.input} placeholder="Ex.: 1º ano A" value={draft.class_name} onChange={e=>setDraft({...draft,class_name:e.target.value})}/></label>
            <label className={s.field}>Disciplina<input maxLength={100} className={s.input} placeholder="Ex.: Português" value={draft.subject} onChange={e=>setDraft({...draft,subject:e.target.value})}/></label>
            <label className={s.field}>Data da aula<input type="date" className={s.input} value={draft.lesson_date||''} onChange={e=>setDraft({...draft,lesson_date:e.target.value||null})}/></label>
          </div>
          <hr className={s.divider}/>
          <StudioStep number="02" title="Conte como a aula vai acontecer" description="Registre o objetivo, a sequência de atividades e as adaptações que você quer fazer."/>
          <label className={s.field}>Objetivos, sequência da aula e observações<textarea rows={6} maxLength={6000} className={s.input} placeholder={'Objetivo: o que a turma vai aprender?\n\nNa prática: como começa, se desenvolve e termina a aula?\n\nAdaptações: o que você vai ajustar para a sua turma?'} value={draft.notes} onChange={e=>setDraft({...draft,notes:e.target.value})}/><span className={s.fieldHint}>Este espaço é seu. Evite incluir dados pessoais dos alunos.</span></label>
          <hr className={s.divider}/>
          <StudioStep number="03" title="Separe os materiais da aula" description="Reúna os links dos recursos que você quer usar. Os arquivos continuam na sua biblioteca."/>
          <div className={`${s.card} ${s.cardTint} workspace-controls`}>
            <label className={s.field}>Adicionar dos meus favoritos ou compras<select className={s.input} value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Escolha um material para esta aula</option>{resources.map((p,i)=><option key={p.id+String(p.plr)} value={i}>{p.title}{p.plr?' (PLR)':''}</option>)}</select></label>
            <div className={s.actionRow+' mt-4'}><button disabled={selected===''||draft.materials.length>=30} onClick={()=>{const item=resources[Number(selected)];if(item&&!draft.materials.some(m=>m.id===item.id&&m.plr===item.plr))setDraft({...draft,materials:[...draft.materials,item]});setSelected('');}} className={s.soft}><Plus/>Adicionar ao planejamento</button><Link href="/buscar" className={s.note+' underline'}>Explorar o catálogo</Link></div>
            {resourceError&&<p role="alert" className="mt-3 text-xs text-rose-800">{resourceError}</p>}
          </div>
        </div>
        <div className="print-plan hidden"><h1 className="text-2xl font-bold">{draft.title||'Planejamento de aula'}</h1><p>{draft.class_name} · {draft.subject} · {draft.lesson_date?.split('-').reverse().join('/')}</p><p className="mt-5 whitespace-pre-wrap">{draft.notes}</p></div>
        <div className={s.sectionHeading+' mt-6'}><h2>Materiais selecionados</h2><span className={s.badge}>{draft.materials.length}/30</span></div>
        {!draft.materials.length&&<p className={s.note}>Nenhum material adicionado ainda. Você também pode salvar o plano só com suas anotações.</p>}
        <ul className={s.materials}>{draft.materials.map((m,i)=><li key={m.id+String(m.plr)} className={s.material}>
          <span className={`${s.icon} ${s.mint}`}><BookOpen/></span><div><Link href={`/produto/${m.id}${m.plr?'?licenca=plr':''}`}>{m.title}</Link><p className={s.note}>{m.plr?'Licença PLR':'Referência para a aula'}</p><p className="mt-1 hidden break-all text-xs print:block">https://www.educalizando.com.br/produto/{m.id}{m.plr?'?licenca=plr':''}</p></div>
          <button aria-label={`Remover ${m.title} do plano`} onClick={()=>setDraft({...draft,materials:draft.materials.filter((_,j)=>j!==i)})} className={`${s.danger} workspace-controls`}><Trash2/><span className="sr-only">Remover</span></button>
        </li>)}</ul>
        <div className={`${s.saveBar} workspace-controls`}><p><Check className="mr-1 inline h-3 w-3"/>Salve para continuar em outro momento. O PDF inclui anotações e links públicos.</p><div className={s.actionRow}><button disabled={busy||!ready} onClick={()=>void save()} className={s.primary}><Save/>{busy?'Salvando…':'Salvar planejamento'}</button><button onClick={()=>window.print()} className={s.secondary}><Printer/>Imprimir / salvar PDF</button></div></div>
        <p className={s.note+' mt-4'}>Os arquivos comprados continuam protegidos na biblioteca. O planejamento não altera a licença de uso nem distribui os materiais pagos.</p>
      </section>
    </div>
    <div className="workspace-controls mt-6"><PrintingCalculator/></div>
    <style>{`@media print { body>*{display:none!important} body>*:has(.planning-workspace){display:block!important} header,footer,nav,.workspace-controls,.plan-editor{display:none!important}.planning-workspace{padding:0!important}.planning-workspace>div{display:block!important}.print-plan{display:block!important} .planning-workspace section{border:0!important;padding:0!important} a{color:#000!important} }`}</style>
  </div>;
}
