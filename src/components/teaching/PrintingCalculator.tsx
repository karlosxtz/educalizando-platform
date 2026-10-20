'use client';
import { useState } from 'react';
import { Calculator,ChevronDown,Leaf } from 'lucide-react';
import { StudioToggle,studioStyles as s } from './TeachingStudio';
import { printingEstimate } from '@/lib/teaching-tools';
export default function PrintingCalculator({pages}:{pages?:number|null}){
  const [students,setStudents]=useState(''),[pageCount,setPages]=useState(pages&&pages>0?String(pages):''),[copies,setCopies]=useState('1'),[cost,setCost]=useState(''),[duplex,setDuplex]=useState(false);
  const result=students&&pageCount&&copies&&cost?printingEstimate(Number(students),Number(pageCount),Number(copies),Number(cost.replace(',','.')),duplex):null;
  return <details className={`${s.studio} ${s.disclosure}`}>
    <summary><span className={`${s.icon} ${s.mint}`}><Calculator/></span><div>Quanto vou gastar para imprimir?<small>Planeje as cópias e estime o investimento para a sua turma.</small></div><ChevronDown className={s.chevron}/></summary>
    <div className={s.disclosureBody}>
      <div className={s.formGrid}>
        <label className={s.field}>Quantidade de alunos<input className={s.input} type="number" min="1" max="10000" placeholder="Ex.: 25" value={students} onChange={e=>setStudents(e.target.value)}/></label>
        <label className={s.field}>Páginas por exemplar<input className={s.input} type="number" min="1" max="10000" placeholder="Ex.: 10" value={pageCount} onChange={e=>setPages(e.target.value)}/></label>
        <label className={s.field}>Exemplares por aluno<input className={s.input} type="number" min="1" max="100" value={copies} onChange={e=>setCopies(e.target.value)}/></label>
        <label className={s.field}>Custo por lado impresso (R$)<input className={s.input} inputMode="decimal" placeholder="Ex.: 0,20" value={cost} onChange={e=>setCost(e.target.value)}/><span className={s.fieldHint}>Use o custo da sua impressora ou gráfica.</span></label>
      </div>
      <div className="mt-5"><StudioToggle checked={duplex} onChange={setDuplex} label="Impressão frente e verso" description="Menos folhas, com a mesma quantidade de lados impressos."/></div>
      <div role="status" aria-live="polite" className={s.estimate}><div><small>ESTIMATIVA PARA A SUA TURMA</small><strong>{result?result.total.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):'Vamos calcular?'}</strong><p>{result?`${result.impressions.toLocaleString('pt-BR')} lados impressos · ${result.sheets.toLocaleString('pt-BR')} folhas`:'Preencha os campos para ver folhas, impressões e custo.'}</p></div><Leaf className="h-8 w-8 shrink-0 text-emerald-200/70"/></div>
      <details className="mt-4"><summary className={s.note+' cursor-pointer underline'}>O que está incluído nesta estimativa?</summary><p className={s.note+' mt-2'}>O custo por lado deve incluir os insumos que você deseja considerar. Frente e verso reduz folhas, mas não o número de lados impressos. O preço do material não está incluído. O cálculo não altera a licença de uso do produto.</p></details>
    </div>
  </details>;
}