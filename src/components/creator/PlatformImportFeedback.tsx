'use client';

import { CheckCircle2, CircleAlert, LoaderCircle } from 'lucide-react';

export type ImportNotice = {
  jobId: string;
  text: string;
  tone: 'info' | 'success' | 'error';
  updatedAt: number;
};

export function PlatformImportFeedback({ notice, working, processed, total }: {
  notice: ImportNotice;
  working: boolean;
  processed: number;
  total: number | null;
}) {
  const percent = total && total > 0 ? Math.min(100, Math.floor(processed / total * 100)) : null;
  const Icon = working ? LoaderCircle : notice.tone === 'error' ? CircleAlert : CheckCircle2;
  return <div
    role={notice.tone === 'error' ? 'alert' : 'status'}
    aria-live={notice.tone === 'error' ? 'assertive' : 'polite'}
    aria-atomic="true"
    className={`mt-5 rounded-2xl border p-4 sm:p-5 ${notice.tone === 'error' ? 'border-amber-200 bg-amber-50 text-amber-950' : 'border-indigo-200 bg-indigo-50 text-indigo-950'}`}
  >
    <div className="flex items-start gap-3">
      <Icon aria-hidden="true" className={`mt-0.5 h-5 w-5 shrink-0 ${working ? 'animate-spin motion-reduce:animate-none' : ''}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{notice.text}</p>
        <p className="mt-1 text-xs leading-6 opacity-80">{working ? 'Mantenha esta página aberta. Alguns arquivos podem levar mais tempo; os contadores mudam conforme cada material é processado.' : 'Seu progresso permanece salvo.'}</p>
        <p className="mt-2 text-xs font-semibold">Status atualizado às {new Date(notice.updatedAt).toLocaleTimeString('pt-BR')}</p>
      </div>
    </div>
    {working && <div className="mt-4">
      <div className="flex flex-wrap justify-between gap-2 text-xs font-semibold"><span>{processed} de {total ?? 'total não informado'} materiais processados nesta passagem</span>{percent !== null && <span>{percent}% do catálogo</span>}</div>
      <div role="progressbar" aria-label="Materiais processados nesta passagem pelo catálogo" aria-valuenow={percent ?? undefined} aria-valuemin={0} aria-valuemax={100} className="mt-2 h-2 overflow-hidden rounded-full bg-indigo-100">
        <div className={`h-full rounded-full bg-indigo-600 transition-[width] duration-500 motion-reduce:transition-none ${percent === null ? 'w-1/3 animate-pulse motion-reduce:animate-none' : ''}`} style={percent !== null ? { width: `${percent}%` } : undefined} />
      </div>
    </div>}
  </div>;
}
