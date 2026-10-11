import Link from 'next/link';
import { ArrowUpRight, ShieldCheck, LockKeyhole, Mail, Smartphone } from 'lucide-react';

export default function SecurityAccessCard() {
  return <Link href="/seguranca" className="group flex flex-wrap items-center justify-between gap-5 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:border-blue-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 sm:p-6">
    <div className="flex items-center gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#103e75] text-white"><ShieldCheck className="h-6 w-6" /></div><div><h2 className="text-base font-bold text-slate-900">Segurança e acesso</h2><p className="mt-1 text-xs leading-5 text-slate-500">Gerencie sua senha, e-mail e verificação em duas etapas.</p><div className="mt-3 flex flex-wrap gap-3 text-[11px] font-semibold text-slate-500"><span className="inline-flex items-center gap-1"><LockKeyhole className="h-3 w-3" />Senha</span><span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />E-mail</span><span className="inline-flex items-center gap-1"><Smartphone className="h-3 w-3" />Duas etapas</span></div></div></div>
    <span className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs font-bold text-[#103e75] transition group-hover:bg-blue-50">Gerenciar acesso<ArrowUpRight className="h-4 w-4" /></span>
  </Link>;
}
