import Link from 'next/link';
import { ArrowLeft, Clock3, ShieldCheck } from 'lucide-react';
import InstagramWorkspace from '@/components/creator/InstagramWorkspace';
import { getRequestUser } from '@/lib/api-auth';
import { instagramReviewEmail } from '@/lib/instagram-review-access';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-dynamic';

// All other creators keep the review notice until general access is approved.
export default async function InstagramPage() {
  const reviewEmail = instagramReviewEmail();
  if (reviewEmail) {
    const user = await getRequestUser(new Request(SITE_URL + '/dashboard/instagram')).catch(() => null);
    if (user?.email_confirmed_at && user.email?.toLowerCase() === reviewEmail) return <InstagramWorkspace />;
  }
  return <section aria-labelledby="instagram-review-title" className="mx-auto max-w-4xl overflow-hidden rounded-[28px] border border-rose-200 bg-white shadow-sm">
    <div aria-hidden="true" className="h-1.5 bg-gradient-to-r from-orange-400 via-pink-500 to-violet-600" />
    <div className="bg-gradient-to-br from-orange-50 via-pink-50 to-violet-50 px-6 py-10 sm:px-10 sm:py-14">
      <Link href="/dashboard/produtos" className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-slate-600 hover:text-violet-800"><ArrowLeft className="h-4 w-4" />Voltar aos meus produtos</Link>
      <div aria-hidden="true" className="mt-6 flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-violet-600 via-pink-600 to-orange-500 text-white shadow-lg shadow-pink-500/20"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-9 w-9"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg></div>
      <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.22em] text-violet-800">Turbine seu Instagram</p>
      <h1 id="instagram-review-title" className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Estamos em análise.<br />Voltaremos em breve!</h1>
      <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">A integração com o Instagram está temporariamente indisponível enquanto aguardamos a análise da Meta para liberar o acesso aos criadores.</p>
      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-4 py-2 text-xs font-bold text-amber-900"><Clock3 aria-hidden="true" className="h-4 w-4" />Aguardando análise da Meta</div>
    </div>
    <div className="space-y-5 px-6 py-7 sm:px-10">
      <div className="flex items-start gap-3"><ShieldCheck aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-violet-700" /><p className="text-sm leading-7 text-slate-600">Essa etapa faz parte da liberação oficial da integração. Por enquanto, não é necessário tentar conectar sua conta novamente. Seus produtos e sua loja continuam disponíveis normalmente.</p></div>
      <p className="text-sm leading-7 text-slate-600">Assim que a análise for concluída e o recurso estiver liberado, atualizaremos este aviso. Obrigado pela paciência e por fazer parte da Educalizando! 💜</p>
      <Link href="/dashboard/produtos" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-violet-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500">Continuar gerenciando meus materiais</Link>
    </div>
  </section>;
}
