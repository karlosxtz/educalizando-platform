'use client';
import { useEffect,useMemo,useState } from 'react';
import Link from 'next/link';
import { ArrowRight,BookOpen,FileDown,Search,Star } from 'lucide-react';
import { StudioEmpty,studioStyles as s } from '@/components/teaching/TeachingStudio';
import c from '@/components/teaching/CommerceExperience.module.css';
import type { Purchase } from '@/lib/types';
import { normalizeSearchText } from '@/lib/search-matching';
import { customerApi } from '@/lib/customer-api';
import StudentReviewModal from '@/components/StudentReviewModal';
export default function PurchasedMaterialFinder({purchases,userId}:{purchases:Purchase[];userId:string}) {
  const [query,setQuery]=useState(''),[store,setStore]=useState(''),[limit,setLimit]=useState(8),[eligible,setEligible]=useState<string[]>([]),[dismissed,setDismissed]=useState(true),[target,setTarget]=useState<Purchase|null>(null);
  const preference=`educalizando_review_invite_${userId}`;
  useEffect(()=>{let alive=true;setEligible([]);try{setDismissed(localStorage.getItem(preference)==='hidden');}catch{setDismissed(false);}void customerApi('/api/customer/review-opportunities').then(data=>{if(alive)setEligible(data.productIds);}).catch(()=>{});return()=>{alive=false;};},[preference]);
  const distinct=useMemo(()=>[...new Map(purchases.filter(p=>p.product&&['liberado','pago'].includes(p.status)).map(p=>[`${p.product_id||p.product?.id}:${Boolean(p.is_plr_purchase)}`,p])).values()], [purchases]);
  const results=distinct.filter(p=>(!store||p.store_id===store)&&normalizeSearchText(p.product?.titulo||'').includes(normalizeSearchText(query)));
  const invitation=distinct.find(p=>!p.is_plr_purchase&&eligible.includes(p.product_id||p.product!.id));
  const shops=[...new Map(distinct.filter(p=>p.store).map(p=>[p.store_id,p.store!])).values()];
  return <section className={s.card}>
    <div className={s.cardHeader}><div className="flex items-start gap-3"><span className={`${s.icon} ${s.mint}`}><BookOpen/></span><div><h2>Minha biblioteca de materiais</h2><p>Encontre um arquivo pelo título ou escolha a loja. Os acessos seguem as condições de cada compra.</p></div></div><span className={s.badge}>{distinct.length} {distinct.length===1?'material':'materiais'}</span></div>
    {!distinct.length?<StudioEmpty icon={BookOpen} title="Seu próximo material pode virar uma grande aula" description="Os materiais das suas compras liberadas aparecem aqui. Explore o catálogo, conheça as prévias e guarde suas ideias favoritas."><Link href="/encontrar-material" className={s.primary}>Descobrir materiais<ArrowRight/></Link></StudioEmpty>:<>
      <div className={s.formGrid}><label className={s.field}>Nome do material<input type="search" value={query} onChange={e=>{setQuery(e.target.value);setLimit(8);}} placeholder="Ex.: leitura, alfabeto, Natal" className={s.input}/></label><label className={s.field}>Loja<select value={store} onChange={e=>{setStore(e.target.value);setLimit(8);}} className={s.input}><option value="">Todas as minhas lojas</option>{shops.map(shop=><option key={shop.id} value={shop.id}>{shop.nome_loja}</option>)}</select></label></div>
      <p role="status" className={s.note+' my-4'}>{results.length} {results.length===1?'material encontrado':'materiais encontrados'} na biblioteca carregada.</p>
      <div className={c.libraryGrid}>{results.slice(0,limit).map(p=><article key={p.id+String(p.is_plr_purchase)} className={c.libraryItem}>
        <div className="flex items-start gap-3">{p.product?.capa_url?<img src={p.product.capa_url} alt="" className={c.libraryCover}/>:<span className={s.icon}><BookOpen/></span>}<div className="min-w-0"><h3>{p.product?.titulo}</h3><p>{p.store?.nome_loja} · {p.is_plr_purchase?'Licença PLR':'Produto final'}</p></div></div>
        <div className={s.actionRow+' mt-3'}><Link href={`/cliente/arquivos/${p.product_id||p.product!.id}${p.is_plr_purchase?'?type=plr':''}`} target="_blank" rel="noopener noreferrer" className={s.primary}><FileDown/>Abrir meus arquivos</Link><Link href={`/cliente/loja/${p.store_id}`} className={s.secondary}>Ver na loja<ArrowRight/></Link></div>
      </article>)}</div>
      {!results.length&&<StudioEmpty compact icon={Search} title="Vamos tentar outro termo?" description="Nenhum material corresponde a essa busca. Tente parte do título ou escolha todas as lojas."/>}
      {results.length>limit&&<button onClick={()=>setLimit(n=>n+8)} className={s.secondary+' mt-5'}>Mostrar mais materiais</button>}
    </>}
    {!dismissed&&invitation&&<aside className={s.help+' mt-6'}><strong><Star className="mr-2 inline h-4 w-4"/>Já usou este material?</strong><p>Conte sua experiência com “{invitation.product?.titulo}”. A avaliação é opcional e ajuda outros professores a escolher.</p><div className={s.actionRow+' mt-3'}><button onClick={()=>setTarget(invitation)} className={s.primary}><Star/>Avaliar material</button><button onClick={()=>{setDismissed(true);try{localStorage.setItem(preference,'hidden');}catch{/* Browser-local preference. */}}} className={s.secondary}>Não mostrar este convite</button></div><p className={s.note+' mt-2'}>Preferência deste navegador. Nenhuma mensagem é enviada por e-mail ou WhatsApp.</p></aside>}
    {target?.product&&<StudentReviewModal isOpen onClose={()=>setTarget(null)} productId={target.product_id||target.product.id} storeId={target.store_id} studentId={userId} onSuccess={()=>{setEligible(ids=>ids.filter(id=>id!==(target.product_id||target.product!.id)));setTarget(null);}}/>}
  </section>;
}