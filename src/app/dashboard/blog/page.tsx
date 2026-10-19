'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Eye, PenLine, Plus, Save, Send } from 'lucide-react';
import { authenticatedFetch } from '@/lib/client-api';
import { readApiJson } from '@/lib/api-response';
import { BLOG_TOPICS } from '@/lib/creator-blog-input';
import type { BlogPost } from '@/lib/blog-service';
import FileUpload from '@/components/dashboard/FileUpload';
import BlogArticleBody from '@/components/blog/BlogArticleBody';
import CatalogImage from '@/components/ui/CatalogImage';

const empty={title:'',excerpt:'',content:'',cover_url:'',topic:String(BLOG_TOPICS[0])};
const field='mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100';
export default function CreatorBlogPage() {
  const [posts,setPosts]=useState<BlogPost[]>([]),[total,setTotal]=useState(0),[page,setPage]=useState(1);
  const [store,setStore]=useState<{nome_loja:string;slug:string}|null>(null);
  const [editing,setEditing]=useState<BlogPost|null>(null),[form,setForm]=useState(empty);
  const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[preview,setPreview]=useState(false);
  const [error,setError]=useState(''),[notice,setNotice]=useState('');
  const dirty=useRef(false);
  const refresh=useCallback(async()=>{
    setLoading(true);
    try {const response=await authenticatedFetch('/api/creator/blog?pagina='+page);const data=await readApiJson(response);if(!response.ok)throw new Error(data.error || 'Não foi possível carregar os artigos.');setPosts(data.posts);setTotal(data.total);setStore(data.store);}
    catch(err){setError(err instanceof Error?err.message:'Não foi possível carregar os artigos.');}
    finally{setLoading(false);}
  },[page]);
  useEffect(()=>{void refresh();},[refresh]);
  useEffect(()=>{const warn=(event:BeforeUnloadEvent)=>{if(dirty.current){event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[]);
  function open(post:BlogPost|null) {
    if(dirty.current && !window.confirm('Você tem alterações não salvas. Deseja abrir outro artigo sem salvar?'))return;
    setEditing(post);setForm(post?{title:post.title,excerpt:post.excerpt,content:post.content,cover_url:post.cover_url || '',topic:post.topic || BLOG_TOPICS[0]}:empty);setError('');setNotice('');setPreview(false);dirty.current=false;
  }
  function change(key:keyof typeof empty,value:string) {setForm(previous=>({...previous,[key]:value}));dirty.current=true;setNotice('');}
  async function save(status:'draft'|'published') {
    if(saving || !store)return;
    setSaving(true);setError('');setNotice('');
    try {
      const response=await authenticatedFetch('/api/creator/blog',{method:editing?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,id:editing?.id,status})});
      const data=await readApiJson(response);if(!response.ok)throw new Error(data.error || 'Não foi possível salvar.');
      setEditing(data.post);dirty.current=false;
      setNotice(status==='published'?'Artigo publicado! Ele já pode aparecer no blog público.':'Rascunho salvo. Ele não aparece no blog público.');
      if(!data.cacheUpdated)setNotice('Artigo salvo. A atualização do blog público está pendente e pode levar alguns instantes.');
      await refresh();
    }catch(err){setError(err instanceof Error?err.message:'Não foi possível salvar. Seu texto continua no editor.');}
    finally{setSaving(false);}
  }
  return <div className="space-y-6 pb-12">
    <header className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-950 via-indigo-900 to-blue-800 p-6 text-white sm:p-9"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-200"><PenLine className="h-4 w-4"/>Vozes de quem ensina</p><h1 className="mt-3 text-3xl font-bold sm:text-4xl">Seu conhecimento merece ser compartilhado.</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-indigo-100">Publique dicas, experiências e ideias no blog da Educalizando. Cada artigo leva o nome da sua loja e ajuda os leitores a conhecerem o seu trabalho.</p><Link href="/blog" target="_blank" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-indigo-900"><BookOpen className="h-4 w-4"/>Ver blog público</Link></header>
    {error && <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}{notice && <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}{editing?.status==='published' && <Link href={'/blog/'+editing.slug} target="_blank" className="ml-2 font-bold underline">Abrir artigo</Link>}</p>}
    <div className="grid items-start gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-3xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between gap-2"><h2 className="font-bold">Meus artigos ({total})</h2><button type="button" disabled={saving} onClick={()=>open(null)} aria-label="Criar novo artigo" className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-800"><Plus className="h-5 w-5"/></button></div>{loading?<p role="status" className="mt-4 text-sm text-slate-500">Carregando seus artigos…</p>:!posts.length?<p className="mt-4 text-sm leading-6 text-slate-500">Seu primeiro artigo começa no editor ao lado. No celular, continue abaixo.</p>:<ul className="mt-4 space-y-2">{posts.map(post=><li key={post.id}><button type="button" disabled={saving} onClick={()=>open(post)} aria-current={editing?.id===post.id?'true':undefined} className={`w-full rounded-xl border p-3 text-left text-sm ${editing?.id===post.id?'border-violet-300 bg-violet-50':'border-slate-100 hover:bg-slate-50'}`}><span className="block break-words font-semibold">{post.title}</span><span className={`mt-2 block text-xs ${post.status==='published'?'text-emerald-700':'text-slate-500'}`}>{post.status==='published'?'Publicado':'Rascunho'}</span></button></li>)}</ul>}<nav aria-label="Páginas dos meus artigos" className="mt-4 flex gap-2">{page>1 && <button disabled={saving} onClick={()=>setPage(page-1)} className="min-h-11 text-sm font-bold text-violet-800">Anterior</button>}{page*20<total && <button disabled={saving} onClick={()=>setPage(page+1)} className="ml-auto min-h-11 text-sm font-bold text-violet-800">Próxima</button>}</nav></aside>
      <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 sm:p-7" aria-label="Editor de artigo"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">{editing?'Editar artigo':'Escrever um artigo'}</h2><p className="mt-1 text-xs text-slate-500">Autoria: {store?.nome_loja || 'sua loja'}</p></div><button type="button" onClick={()=>setPreview(!preview)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold"><Eye className="h-4 w-4"/>{preview?'Voltar ao editor':'Prévia'}</button></div>
      {preview?<article className="mt-7 space-y-5"><p className="text-xs font-bold text-violet-700">PRÉVIA · {form.topic}</p><h2 className="break-words text-3xl font-bold">{form.title || 'Título do artigo'}</h2><p className="text-slate-600">{form.excerpt}</p>{form.cover_url && <CatalogImage src={form.cover_url} alt={'Capa: '+form.title} width={1000} height={600} className="max-h-96 w-full rounded-2xl object-contain"/>}<BlogArticleBody content={form.content || 'Seu texto vai aparecer aqui.'}/></article>:<fieldset disabled={saving || loading || !store} className="mt-6 space-y-5 disabled:opacity-60"><label className="block text-sm font-semibold">Título<input value={form.title} onChange={event=>change('title',event.target.value)} maxLength={180} className={field} placeholder="Ex.: 5 ideias para trabalhar leitura com jogos"/></label><div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-semibold">Tema<select className={field} value={form.topic} onChange={event=>change('topic',event.target.value)}>{BLOG_TOPICS.map(topic=><option key={topic}>{topic}</option>)}</select></label><p className="self-center text-xs leading-6 text-slate-500">Escolha um tema próximo do assunto. Escreva com suas palavras e use somente imagens que você tem direito de publicar.</p></div><label className="block text-sm font-semibold">Resumo<textarea value={form.excerpt} onChange={event=>change('excerpt',event.target.value)} rows={3} maxLength={360} className={field} placeholder="Conte em 40 a 360 caracteres o que o leitor vai aprender."/></label><FileUpload label="Capa do artigo (opcional)" helperText="Uma imagem clara que represente sua dica. Não inclua dados pessoais de alunos." bucket="product-covers" accept="image/jpeg,image/png,image/webp" isImage value={form.cover_url} onChange={value=>change('cover_url',value || '')}/><label className="block text-sm font-semibold">Texto do artigo<textarea value={form.content} onChange={event=>change('content',event.target.value)} rows={17} maxLength={30000} className={field+' leading-7'} placeholder={'Comece pelo objetivo da sua dica. Depois, explique como colocar em prática.\n\n## Como aplicar na aula\n\n- Materiais necessários\n- Passo a passo\n- Adaptações para a turma'}/></label><p className="text-xs leading-6 text-slate-500">Separe parágrafos com uma linha em branco. Use ## para subtítulos e - para listas. Links https ficam clicáveis. HTML não é executado. {form.content.length.toLocaleString('pt-BR')} / 30.000 caracteres.</p></fieldset>}
      <footer className="mt-7 border-t border-slate-100 pt-5"><p className="mb-4 text-xs leading-6 text-slate-500">Ao publicar, o artigo fica público no blog. Revise informações e direitos de uso. Não publique dados pessoais de alunos, conteúdo copiado ou promessas sem comprovação.</p><div className="flex flex-wrap gap-3"><button disabled={saving || loading || !store} onClick={()=>void save('draft')} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold disabled:opacity-50"><Save className="h-4 w-4"/>{editing?.status==='published'?'Retirar do ar e salvar rascunho':'Salvar rascunho'}</button><button disabled={saving || loading || !store} onClick={()=>void save('published')} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-bold text-white disabled:opacity-50"><Send className="h-4 w-4"/>{saving?'Salvando…':editing?.status==='published'?'Salvar artigo publicado':'Publicar no blog'}</button></div></footer></section>
    </div>
  </div>;
}
