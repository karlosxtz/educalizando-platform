'use client';
import { Camera, Copy, Loader2, MessageSquare, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';

export function AIToolButton({ icon: Icon, label, description, loading, disabled, onClick }: { icon: LucideIcon; label: string; description: string; loading: boolean; disabled?: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} disabled={loading || disabled} className="group min-h-24 rounded-xl border border-violet-100 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md disabled:opacity-60"><div className="flex items-center gap-2"><span className="rounded-lg bg-violet-100 p-1.5 text-violet-700">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}</span><span className="text-sm font-black text-slate-900">{label}</span></div><p className="mt-2 text-xs leading-5 text-slate-500">{loading ? 'A IA está preparando...' : description}</p></button>;
}

export function CopyCard({ title, description, text }: { title: string; description: string; text?: string }) {
  const isWhatsapp = title.includes('WhatsApp');
  const Icon = isWhatsapp ? MessageSquare : Camera;
  const theme = isWhatsapp
    ? { header: 'border-emerald-100 bg-emerald-50', icon: 'bg-emerald-500 text-white', title: 'text-emerald-950', button: 'bg-emerald-600 hover:bg-emerald-700' }
    : { header: 'border-pink-100 bg-gradient-to-r from-pink-50 via-fuchsia-50 to-violet-50', icon: 'bg-gradient-to-br from-amber-400 via-pink-500 to-violet-600 text-white', title: 'text-fuchsia-950', button: 'bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700' };
  return <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white"><div className={`border-b px-5 py-4 ${theme.header}`}><div className="flex items-center gap-3"><span className={`rounded-xl p-2 ${theme.icon}`}><Icon className="h-5 w-5" /></span><div><h3 className={`font-black ${theme.title}`}>{title}</h3><p className="mt-1 text-sm text-slate-500">{description}</p></div></div></div><p className="min-h-48 whitespace-pre-line p-5 text-sm leading-7 text-slate-700">{text || 'A IA não retornou este conteúdo. Gere novamente.'}</p><div className="border-t border-slate-100 px-5 py-3"><button type="button" onClick={() => text && navigator.clipboard.writeText(text).then(() => toast.success(`${title} copiada.`))} disabled={!text} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black text-white disabled:opacity-50 ${theme.button}`}><Copy className="h-3.5 w-3.5" /> Copiar</button></div></div>;
}

export function LessonBlock({ title, items }: { title: string; items?: string[] }) {
  const validItems = (items || []).filter(Boolean);
  return <section className="rounded-xl bg-slate-50 p-4"><h4 className="text-sm font-black text-violet-800">{title}</h4>{validItems.length ? <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">{validItems.map((item, index) => <li key={`${index}-${item}`}>• {item}</li>)}</ul> : <p className="mt-2 text-sm text-slate-500">Não informado.</p>}</section>;
}
