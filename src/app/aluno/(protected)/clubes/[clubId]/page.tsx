'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import StudentHeader from '@/components/aluno/StudentHeader';

export default function StudentClubMaterialsPage({ params }: { params: Promise<{ clubId: string }> }) {
  type ClubMaterial = { id:string; titulo:string; capa_url:string|null };
  type ClubData = { club:{ name:string; cover_url:string|null }; subscription:{ expires_at:string }; products:ClubMaterial[] };
  const { clubId }=use(params); const [data,setData]=useState<ClubData|null>(null); const [loading,setLoading]=useState(true); const [error,setError]=useState('');
  useEffect(()=>{fetch(`/api/aluno/clubes/${clubId}/materiais`,{cache:'no-store'}).then(async r=>{const p=await r.json();if(!r.ok)throw new Error(p.error);setData(p)}).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[clubId]);
  return <div className="min-h-screen bg-slate-50"><StudentHeader/><main className="mx-auto max-w-7xl px-4 py-8"><Link href="/cliente/clubes" className="inline-flex items-center gap-2 text-sm font-black text-blue-700"><ArrowLeft className="h-4 w-4"/>Voltar para Meus Clubes</Link>{loading?<div className="flex min-h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-700"/></div>:error||!data?<div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center font-bold text-rose-800">{error||'Clube indisponível.'}</div>:<><header className="mt-5 overflow-hidden rounded-3xl bg-blue-950 text-white sm:flex">{data.club.cover_url&&<img src={data.club.cover_url} alt="" className="h-52 w-full object-cover sm:w-80"/>}<div className="p-7"><p className="text-xs font-black uppercase tracking-widest text-blue-200">Assinatura ativa</p><h1 className="mt-2 text-3xl font-black">{data.club.name}</h1><p className="mt-3 text-sm text-blue-100">Acesso válido até {new Date(data.subscription.expires_at).toLocaleDateString('pt-BR')}.</p></div></header><section className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{data.products.map((product)=><article key={product.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm">{product.capa_url?<img src={product.capa_url} alt="" className="aspect-square w-full object-cover"/>:<div className="aspect-square bg-blue-50"/>}<div className="p-4"><h2 className="line-clamp-2 min-h-10 text-sm font-black text-slate-950">{product.titulo}</h2><a href={`/api/aluno/materiais/${product.id}/download`} className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-3 text-xs font-black text-white"><Download className="h-4 w-4"/>Acessar material</a></div></article>)}</section></>}</main></div>;
}

