'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight,BookmarkPlus,Check,ChevronDown } from 'lucide-react';
import { StudioNotice,StudioToggle,studioStyles as s } from './TeachingStudio';
import { customerApi } from '@/lib/customer-api';
import { SAVED_FILTER_KEYS } from '@/lib/teaching-tools';
export default function SaveSearchControl({query}:{query:string}){
  const params=new URLSearchParams(query),filters=Object.fromEntries(SAVED_FILTER_KEYS.map(key=>[key,params.get(key)]).filter((entry):entry is [string,string]=>Boolean(entry[1])));
  const [open,setOpen]=useState(false),[name,setName]=useState((params.get('q')||'Minha seleção de materiais').slice(0,100)),[notifications,setNotifications]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
  async function save(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{await customerApi('/api/customer/saved-searches',{method:'POST',body:JSON.stringify({name,filters,notifications_enabled:notifications})});setMessage('Busca salva. Você pode consultá-la na sua área de buscas salvas.');setOpen(false);}catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar.');}finally{setBusy(false);}}
  if(!Object.keys(filters).length)return null;
  return <div className={`${s.studio} ${s.searchSave}`}>
    <div className={s.searchSaveHeader}><div><span className={s.icon}><BookmarkPlus/></span><p>Gostou desta seleção?<small>Guarde os filtros e volte a descobrir novos materiais.</small></p></div><button onClick={()=>{setOpen(!open);setMessage('');}} aria-expanded={open} className={s.soft}><BookmarkPlus/>Salvar esta busca<ChevronDown size={14}/></button></div>
    {open&&<form onSubmit={save} className={s.searchSaveForm}>
      <label className={s.field}>Nome da busca<input required minLength={3} maxLength={100} value={name} onChange={e=>setName(e.target.value)} className={s.input}/><span className={s.fieldHint}>Escolha um nome que faça sentido para você, como “Leitura para a minha turma”.</span></label>
      <StudioToggle checked={notifications} onChange={setNotifications} label="Quero consultar as novidades desta busca" description="Avisos opcionais dentro da plataforma. Sem e-mail ou WhatsApp."/>
      <div className={s.actionRow}><button disabled={busy} className={s.primary}><Check/>{busy?'Salvando…':'Confirmar busca salva'}</button><Link href="/cliente/buscas-salvas" className={s.secondary}>Minhas buscas salvas<ArrowRight/></Link></div>
    </form>}
    {error&&<div className="mt-3"><StudioNotice>{error}</StudioNotice></div>}{message&&<div className="mt-3"><StudioNotice success>{message} <Link href="/cliente/buscas-salvas" className="underline">Ver minhas buscas</Link></StudioNotice></div>}
  </div>;
}