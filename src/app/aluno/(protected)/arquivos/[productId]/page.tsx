'use client';

import { ArrowLeft, Download, FileText, Loader2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import StudentHeader from '@/components/aluno/StudentHeader';

type AvailableFile = { id: string; name: string; size?: number | null; mimeType?: string | null; downloadUrl: string };

function formatSize(size?: number | null) {
  if (!size) return 'Arquivo digital';
  return size >= 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(size / 1024)} KB`;
}

export default function ProductFilesPage() {
  const { productId } = useParams<{ productId: string }>();
  const searchParams = useSearchParams();
  const isPlr = searchParams.get('type') === 'plr';
  const [files, setFiles] = useState<AvailableFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const query = isPlr ? '?type=plr&list=1' : '?list=1';
    fetch(`/api/aluno/materiais/${productId}/download${query}`, { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Não foi possível carregar seus arquivos.');
        setFiles(payload.files || []);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Não foi possível carregar seus arquivos.'))
      .finally(() => setLoading(false));
  }, [isPlr, productId]);

  return <div className="min-h-screen bg-slate-50"><StudentHeader />
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/cliente/dashboard" className="inline-flex items-center gap-2 text-sm font-black text-blue-700"><ArrowLeft className="h-4 w-4" />Voltar para meus materiais</Link>
      <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <header className="bg-blue-950 p-7 text-white"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600"><ShieldCheck className="h-6 w-6" /></span><div><p className="text-xs font-black uppercase tracking-widest text-blue-200">Entrega protegida</p><h1 className="mt-1 text-2xl font-black">{isPlr ? 'Arquivos da licença PLR' : 'Arquivos do material'}</h1></div></div><p className="mt-4 text-sm text-blue-100">Baixe cada arquivo disponibilizado pelo criador. Todos aparecem aqui após a confirmação do pagamento.</p></header>
        <div className="p-5 sm:p-7">
          {loading && <div className="flex min-h-48 items-center justify-center gap-2 font-bold text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />Carregando arquivos...</div>}
          {!loading && error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-bold text-rose-800">{error}</div>}
          {!loading && !error && files.length === 0 && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-900">Nenhum arquivo está disponível para esta compra.</div>}
          {!loading && !error && files.length > 0 && <div className="space-y-3">{files.map((file, index) => <article key={file.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700"><FileText className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h2 className="truncate text-sm font-black text-slate-950">{file.name || `Arquivo ${index + 1}`}</h2><p className="mt-1 text-xs font-medium text-slate-500">{formatSize(file.size)}</p></div><a href={file.downloadUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-black text-white hover:bg-blue-700"><Download className="h-4 w-4" />Baixar arquivo</a></article>)}</div>}
        </div>
      </section>
    </main>
  </div>;
}
