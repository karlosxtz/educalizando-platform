'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Check, Crown, ExternalLink, Eye, ImagePlus, Info, Loader2, Package, Pencil, Plus, Save, Search, Trash2, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Product = { id: string; titulo: string; capa_url: string | null; status: string };
type Club = { id: string; name: string; slug: string; description: string; cover_url: string | null; monthly_price: number; status: 'draft' | 'published' | 'archived'; material_count: number; paid_sales_count: number };
const blankForm = { id: '', name: '', description: '', price: '', coverUrl: '', published: false };

function CoverFrame({ src, alt, compact = false }: { src: string | null; alt: string; compact?: boolean }) {
  const size = compact ? 'aspect-[16/9]' : 'aspect-[16/9] min-h-[220px]';
  if (!src) return <div className={`flex ${size} items-center justify-center bg-gradient-to-br from-blue-950 via-blue-700 to-violet-700 text-white`}><Crown className="h-14 w-14" /></div>;
  return <div className={`relative ${size} overflow-hidden bg-slate-100`}><img src={src} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-xl" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/10 to-white/5" /><img src={src} alt={alt} className="relative z-10 h-full w-full object-contain" /></div>;
}

export default function CreatorClubPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [form, setForm] = useState(blankForm);
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const response = await fetch('/api/creator-clubs', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao carregar.');
      setClubs(data.clubs || []); setProducts(data.products || []); setSelections(data.selectedProductIdsByClub || {});
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Falha ao carregar.'); }
    finally { setLoading(false); }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []);
  const visible = useMemo(() => products.filter((product) => product.titulo.toLowerCase().includes(search.trim().toLowerCase())), [products, search]);
  const selectedProducts = useMemo(() => products.filter((product) => selected.includes(product.id)), [products, selected]);
  const totals = useMemo(() => ({ published: clubs.filter((club) => club.status === 'published').length, materials: clubs.reduce((sum, club) => sum + club.material_count, 0), sales: clubs.reduce((sum, club) => sum + club.paid_sales_count, 0) }), [clubs]);
  const stats: Array<{ label: string; value: number; icon: LucideIcon }> = [
    { label: 'Clubes criados', value: clubs.length, icon: Crown },
    { label: 'Publicados', value: totals.published, icon: Eye },
    { label: 'Materiais vinculados', value: totals.materials, icon: Package },
    { label: 'Vendas confirmadas', value: totals.sales, icon: BarChart3 },
  ];
  const update = (key: keyof typeof blankForm, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const startNew = () => { setForm(blankForm); setSelected([]); setSearch(''); setEditing(true); setError(''); setMessage(''); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const editClub = (club: Club) => { setForm({ id: club.id, name: club.name, description: club.description || '', price: String(club.monthly_price), coverUrl: club.cover_url || '', published: club.status === 'published' }); setSelected(selections[club.id] || []); setSearch(''); setEditing(true); setError(''); setMessage(''); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  async function uploadCover(file?: File) {
    if (!file) return;
    setUploading(true); setError('');
    try {
      const payload = new FormData(); payload.set('bucket', 'store-assets'); payload.set('file', file);
      const response = await fetch('/api/storage/upload-image', { method: 'POST', body: payload }); const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível enviar a capa.');
      update('coverUrl', data.value);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Não foi possível enviar a capa.'); }
    finally { setUploading(false); }
  }

  async function save() {
    setSaving(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/creator-clubs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: form.id || undefined, name: form.name, description: form.description, monthlyPrice: Number(form.price.replace(',', '.')), coverUrl: form.coverUrl, status: form.published ? 'published' : 'draft', productIds: selected }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Não foi possível salvar.');
      setMessage(form.id ? 'Clube atualizado com sucesso.' : 'Novo clube criado com sucesso.'); setEditing(false); setForm(blankForm); setSelected([]); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Não foi possível salvar.'); }
    finally { setSaving(false); }
  }

  async function remove(club: Club) {
    if (!window.confirm(club.paid_sales_count > 0 ? 'Este clube possui vendas e será arquivado, preservando os acessos ativos. Continuar?' : 'Excluir este clube e todas as configurações dele?')) return;
    setRemoving(club.id); setError('');
    try {
      const response = await fetch(`/api/creator-clubs?id=${encodeURIComponent(club.id)}`, { method: 'DELETE' }); const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível excluir.');
      setMessage(data.message); if (form.id === club.id) { setEditing(false); setForm(blankForm); setSelected([]); } await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Não foi possível excluir.'); }
    finally { setRemoving(''); }
  }

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-700" /></div>;

  return <div className="space-y-7 pb-20">
    <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-950 via-blue-800 to-violet-700 p-6 text-white shadow-xl sm:p-9"><div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-cyan-300/15 blur-3xl" /><div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.22em] text-blue-200"><Crown className="h-4 w-4" /> Clube do Criador</p><h1 className="mt-3 text-3xl font-black sm:text-4xl">Seus clubes, sua comunidade</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">Monte assinaturas com identidade própria, escolha os materiais e defina o valor. O acesso é liberado somente após o pagamento confirmado.</p></div><button onClick={startNew} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-black text-blue-900 shadow-lg transition hover:-translate-y-0.5"><Plus className="h-5 w-5" />Novo clube</button></div></header>
    {(error || message) && <div role="status" className={`rounded-2xl border p-4 text-sm font-bold ${error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || message}</div>}

    {!editing && <><section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Icon className="h-5 w-5" /></div><p className="mt-4 text-2xl font-black text-slate-950">{value}</p><p className="text-xs font-bold text-slate-500">{label}</p></div>)}
    </section><section><div className="mb-5"><p className="text-xs font-black uppercase tracking-[.18em] text-blue-700">Gerenciamento</p><h2 className="mt-1 text-2xl font-black text-slate-950">Clubes cadastrados</h2><p className="text-sm text-slate-500">Edite o acervo, confira a página pública ou crie uma nova assinatura.</p></div>
      {clubs.length === 0 ? <div className="rounded-[2rem] border border-dashed border-blue-300 bg-blue-50 p-10 text-center"><Crown className="mx-auto h-12 w-12 text-blue-600" /><h3 className="mt-4 text-xl font-black text-blue-950">Crie seu primeiro clube</h3><p className="mt-2 text-sm text-blue-700">Organize um acervo e defina a mensalidade que deseja cobrar.</p><button onClick={startNew} className="mt-5 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white">Criar clube</button></div> : <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{clubs.map((club) => <article key={club.id} className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><CoverFrame src={club.cover_url} alt={club.name} compact /><div className="p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${club.status === 'published' ? 'bg-emerald-100 text-emerald-800' : club.status === 'archived' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-800'}`}>{club.status === 'published' ? 'Publicado' : club.status === 'archived' ? 'Arquivado' : 'Rascunho'}</span><h3 className="mt-3 truncate text-xl font-black text-slate-950">{club.name}</h3></div><div className="shrink-0 text-right"><strong className="text-lg text-blue-800">{Number(club.monthly_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong><p className="text-[10px] font-bold text-slate-400">por 30 dias</p></div></div><p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{club.description || 'Sem descrição.'}</p><div className="mt-4 flex gap-2"><span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600">{club.material_count} materiais</span><span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600">{club.paid_sales_count} vendas</span></div><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={() => editClub(club)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 text-sm font-black text-white"><Pencil className="h-4 w-4" />Editar</button><Link href={`/clube/${club.slug}`} target="_blank" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 text-sm font-black text-blue-800"><ExternalLink className="h-4 w-4" />Ver página</Link><button disabled={removing === club.id} onClick={() => void remove(club)} className="col-span-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl text-xs font-black text-rose-700 hover:bg-rose-50 disabled:opacity-50">{removing === club.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}{club.paid_sales_count > 0 ? 'Arquivar clube' : 'Excluir clube'}</button></div></div></article>)}</div>}
    </section></>}

    {editing && <section className="space-y-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-xs font-black uppercase tracking-widest text-blue-700">{form.id ? 'Editando clube' : 'Novo clube'}</p><h2 className="mt-1 text-3xl font-black text-slate-950">{form.id ? form.name : 'Cadastrar clube'}</h2><p className="mt-1 text-sm text-slate-500">Preencha as informações e monte o acervo que o assinante receberá.</p></div><button onClick={() => setEditing(false)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black"><X className="h-4 w-4" />Fechar</button></div><div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]"><div className="space-y-5">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"><CoverFrame src={form.coverUrl || null} alt="Prévia da capa do clube" /><div className="border-t p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-black text-slate-950">Capa do clube</h3><p className="mt-1 text-xs leading-5 text-slate-500">A imagem inteira será enquadrada, sem cortes. Recomendado: formato horizontal 16:9, como 1600 × 900 px.</p></div><div className="flex gap-2"><label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 text-sm font-black text-blue-800">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}{uploading ? 'Enviando…' : 'Escolher capa'}<input type="file" accept="image/*" disabled={uploading} onChange={(event) => void uploadCover(event.target.files?.[0])} className="hidden" /></label>{form.coverUrl && <button onClick={() => update('coverUrl', '')} className="h-11 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600">Remover</button>}</div></div></div></div>
      <div className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><div><p className="text-xs font-black uppercase tracking-widest text-blue-700">1. Informações</p><h3 className="mt-1 text-xl font-black">Apresentação do clube</h3></div><label className="block text-sm font-bold text-slate-800">Nome do clube<input value={form.name} onChange={(event) => update('name', event.target.value)} maxLength={100} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100" placeholder="Ex.: Clube da Alfabetização" /><span className="mt-1 block text-right text-[11px] text-slate-400">{form.name.length}/100</span></label><label className="block text-sm font-bold text-slate-800">Descrição e benefícios<textarea value={form.description} onChange={(event) => update('description', event.target.value)} rows={6} maxLength={3000} className="mt-2 w-full resize-none rounded-xl border border-slate-300 p-4 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100" placeholder="Explique para quem é o clube, quais materiais estão incluídos e quais benefícios o assinante terá." /><span className="mt-1 block text-right text-[11px] text-slate-400">{form.description.length}/3000</span></label><label className="block text-sm font-bold text-slate-800">Mensalidade por 30 dias (R$)<div className="relative mt-2"><span className="absolute left-4 top-3.5 font-black text-slate-500">R$</span><input value={form.price} onChange={(event) => update('price', event.target.value)} inputMode="decimal" className="min-h-12 w-full rounded-xl border border-slate-300 pl-12 pr-4 text-lg font-black outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100" placeholder="29,90" /></div><span className="mt-2 block text-xs font-medium text-slate-500">Este é o preço do clube. Os valores individuais dos materiais não são somados.</span></label><label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${form.published ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}><input type="checkbox" checked={form.published} onChange={(event) => update('published', event.target.checked)} className="mt-1 h-5 w-5 accent-blue-700" /><span><strong className="block text-sm text-slate-950">Publicar este clube na loja</strong><span className="mt-1 block text-xs leading-5 text-slate-600">Quando ativo, clientes poderão abrir a página detalhada e assinar. Para publicar, selecione pelo menos um material.</span></span></label></div>
    </div><div className="space-y-5"><div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-widest text-blue-700">2. Acervo</p><h3 className="mt-1 text-xl font-black">Materiais do clube</h3><p className="mt-1 text-sm text-slate-500"><strong className="text-blue-700">{selected.length}</strong> selecionado(s), sem limite.</p></div><div className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-blue-600 sm:w-64" placeholder="Buscar material" /></div></div>
      {selectedProducts.length > 0 && <div className="mt-5 rounded-2xl bg-blue-50 p-4"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-black uppercase tracking-wider text-blue-800">Selecionados</p><button onClick={() => setSelected([])} className="text-xs font-bold text-blue-700">Limpar seleção</button></div><div className="flex flex-wrap gap-2">{selectedProducts.slice(0, 8).map((product) => <button key={product.id} onClick={() => toggle(product.id)} title="Remover" className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-blue-200 bg-white py-1.5 pl-3 pr-2 text-xs font-bold text-blue-900"><span className="max-w-44 truncate">{product.titulo}</span><X className="h-3.5 w-3.5" /></button>)}{selectedProducts.length > 8 && <span className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-black text-blue-800">+{selectedProducts.length - 8}</span>}</div></div>}
      <div className="mt-5 max-h-[720px] space-y-2 overflow-y-auto pr-1">{visible.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Nenhum material encontrado.</div> : visible.map((product) => { const active = selected.includes(product.id); return <button type="button" onClick={() => toggle(product.id)} key={product.id} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${active ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50'}`}>{product.capa_url ? <img src={product.capa_url} alt="" className="h-16 w-16 rounded-xl bg-slate-100 object-contain" /> : <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-slate-400"><Package className="h-5 w-5" /></div>}<span className="min-w-0 flex-1"><strong className="line-clamp-2 text-sm text-slate-900">{product.titulo}</strong><span className={`mt-1 block text-xs font-bold ${active ? 'text-blue-700' : 'text-slate-400'}`}>{active ? 'Incluído no clube' : 'Clique para adicionar'}</span></span><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${active ? 'bg-blue-600 text-white' : 'border border-slate-300 text-transparent'}`}><Check className="h-4 w-4" /></span></button>; })}</div></div><div className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-900"><Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" /><p>Você pode adicionar ou remover materiais quando quiser. Assinantes ativos passam a visualizar o acervo atualizado automaticamente.</p></div></div></div>
      <div className="sticky bottom-4 z-20 flex flex-col-reverse justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur sm:flex-row sm:items-center"><p className="px-2 text-xs font-bold text-slate-500">{selected.length} materiais · {form.published ? 'Será publicado na loja' : 'Será salvo como rascunho'}</p><div className="flex gap-2"><button onClick={() => setEditing(false)} className="min-h-12 flex-1 rounded-xl border border-slate-300 px-5 text-sm font-black sm:flex-none">Cancelar</button><button onClick={() => void save()} disabled={saving || uploading} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-700 px-7 text-sm font-black text-white shadow-lg disabled:opacity-60 sm:flex-none">{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}{saving ? 'Salvando…' : form.id ? 'Salvar alterações' : 'Criar clube'}</button></div></div>
    </section>}
  </div>;
}
