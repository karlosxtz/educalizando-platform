'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Crown, ExternalLink, ImagePlus, Loader2, Save, Search } from 'lucide-react';

type Product = { id: string; titulo: string; capa_url: string | null; status: string };
type Club = { id: string; name: string; slug: string; description: string; cover_url: string | null; monthly_price: number; status: 'draft' | 'published' };

export default function CreatorClubPage() {
  const [club, setClub] = useState<Club | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [published, setPublished] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const response = await fetch('/api/creator-clubs', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao carregar.');
      setClub(data.club || null); setProducts(data.products || []); setSelected(data.selectedProductIds || []);
      if (data.club) { setName(data.club.name); setDescription(data.club.description || ''); setPrice(String(data.club.monthly_price)); setCoverUrl(data.club.cover_url || ''); setPublished(data.club.status === 'published'); }
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Falha ao carregar.'); }
    finally { setLoading(false); }
  }
  // A carga inicial preenche o formulário com o clube persistido.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => products.filter((product) => product.titulo.toLowerCase().includes(search.trim().toLowerCase())), [products, search]);
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  async function uploadCover(file?: File) {
    if (!file) return;
    setUploading(true); setError('');
    try {
      const form = new FormData(); form.set('bucket', 'store-assets'); form.set('file', file);
      const response = await fetch('/api/storage/upload-image', { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível enviar a capa.');
      setCoverUrl(data.value);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Não foi possível enviar a capa.'); }
    finally { setUploading(false); }
  }

  async function save() {
    setSaving(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/creator-clubs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description, monthlyPrice: Number(price.replace(',', '.')), coverUrl, status: published ? 'published' : 'draft', productIds: selected }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível salvar.');
      setClub(data.club); setMessage(published ? 'Clube publicado e pronto para receber assinantes.' : 'Rascunho salvo com sucesso.');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Não foi possível salvar.'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-700" /></div>;

  return <div className="space-y-6 pb-16">
    <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-blue-800 to-violet-700 p-6 text-white shadow-xl sm:p-8">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.2em] text-blue-200"><Crown className="h-4 w-4"/> Clube do Criador</p><h1 className="mt-3 text-3xl font-black">Sua assinatura, seus materiais, seu preço</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">Monte um acervo sem limite de materiais. O cliente recebe acesso por 30 dias somente após o pagamento ser confirmado.</p></div>{club?.slug && <Link href={`/clube/${club.slug}`} target="_blank" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-blue-900"><ExternalLink className="h-4 w-4"/> Ver página pública</Link>}</div>
    </header>
    {(error || message) && <div role="status" className={`rounded-2xl border p-4 text-sm font-bold ${error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || message}</div>}
    <section className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
      <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div><h2 className="text-xl font-black text-slate-950">Informações do clube</h2><p className="mt-1 text-sm text-slate-500">O valor abaixo é a mensalidade final definida por você.</p></div>
        <label className="block text-sm font-bold text-slate-800">Nome<input value={name} onChange={(e)=>setName(e.target.value)} maxLength={100} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4" placeholder="Ex.: Clube da Alfabetização"/></label>
        <label className="block text-sm font-bold text-slate-800">Descrição<textarea value={description} onChange={(e)=>setDescription(e.target.value)} rows={6} className="mt-2 w-full rounded-xl border border-slate-300 p-4" placeholder="Explique o que o assinante encontra no clube."/></label>
        <label className="block text-sm font-bold text-slate-800">Mensalidade por 30 dias (R$)<input value={price} onChange={(e)=>setPrice(e.target.value)} inputMode="decimal" className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-lg font-black" placeholder="29,90"/><span className="mt-2 block text-xs font-medium text-slate-500">Este preço é independente dos valores individuais dos produtos.</span></label>
        <div><p className="text-sm font-bold text-slate-800">Capa do clube</p><div className="mt-2 flex items-center gap-3">{coverUrl ? <img src={coverUrl} alt="Capa do clube" className="h-20 w-28 rounded-xl object-cover"/> : <div className="flex h-20 w-28 items-center justify-center rounded-xl bg-slate-100 text-slate-400"><ImagePlus/></div>}<label className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-black text-blue-800">{uploading ? 'Enviando…' : 'Escolher imagem'}<input type="file" accept="image/*" disabled={uploading} onChange={(e)=>void uploadCover(e.target.files?.[0])} className="hidden"/></label></div></div>
        <label className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4"><input type="checkbox" checked={published} onChange={(e)=>setPublished(e.target.checked)} className="mt-1 h-5 w-5"/><span><strong className="block text-sm text-blue-950">Publicar clube</strong><span className="text-xs text-blue-700">A página ficará disponível para assinatura. É necessário selecionar pelo menos um material.</span></span></label>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-xl font-black text-slate-950">Materiais do clube</h2><p className="mt-1 text-sm text-slate-500"><strong>{selected.length}</strong> selecionado(s). Não existe limite.</p></div><div className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400"/><input value={search} onChange={(e)=>setSearch(e.target.value)} className="min-h-11 rounded-xl border border-slate-300 pl-10 pr-3 text-sm" placeholder="Buscar material"/></div></div>
        <div className="mt-5 max-h-[660px] space-y-2 overflow-y-auto pr-1">{visible.map((product)=>{const active=selected.includes(product.id);return <button type="button" onClick={()=>toggle(product.id)} key={product.id} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${active?'border-blue-500 bg-blue-50':'border-slate-200 hover:bg-slate-50'}`}>{product.capa_url?<img src={product.capa_url} alt="" className="h-14 w-14 rounded-lg object-cover"/>:<div className="h-14 w-14 rounded-lg bg-slate-100"/>}<span className="min-w-0 flex-1"><strong className="line-clamp-2 text-sm text-slate-900">{product.titulo}</strong><span className="mt-1 block text-xs text-slate-500">{product.status==='publicado'?'Publicado':'Não publicado'}</span></span><span className={`flex h-7 w-7 items-center justify-center rounded-full ${active?'bg-blue-600 text-white':'border border-slate-300 text-transparent'}`}><Check className="h-4 w-4"/></span></button>})}{visible.length===0&&<p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">Nenhum material encontrado.</p>}</div>
      </div>
    </section>
    <div className="sticky bottom-4 flex justify-end"><button onClick={()=>void save()} disabled={saving||uploading} className="inline-flex min-h-14 items-center gap-2 rounded-2xl bg-blue-700 px-7 text-sm font-black text-white shadow-xl disabled:opacity-60">{saving?<Loader2 className="h-5 w-5 animate-spin"/>:<Save className="h-5 w-5"/>}{saving?'Salvando…':'Salvar Clube do Criador'}</button></div>
  </div>;
}

