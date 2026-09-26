import Link from 'next/link';
import { ArrowLeft, BookOpen, CheckCircle2, PenLine, Sparkles } from 'lucide-react';
import SignupForm from '@/components/SignupForm';

export default function ProducerSignupPage() {
  return (
    <div className="signup-scene min-h-screen overflow-hidden bg-slate-50 px-4 py-7 font-sans sm:px-6 sm:py-10 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="signup-orb signup-orb-one" /><div className="signup-orb signup-orb-two" />
        <BookOpen className="signup-notebook signup-notebook-one" /><BookOpen className="signup-notebook signup-notebook-two" /><PenLine className="signup-pen" />
      </div>
      <main className="relative z-10 mx-auto w-full max-w-6xl">
        <header className="mx-auto max-w-2xl text-center">
          <Link href="/" className="inline-flex items-center justify-center rounded-2xl bg-white/80 px-4 py-2 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"><img src="/branding/logo-educalizando.png?v=3" alt="Educalizando" className="h-10 w-auto sm:h-12" /></Link>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/85 px-4 py-2 text-xs font-black text-violet-800 shadow-sm"><Sparkles className="h-4 w-4" /> Seu espaço para criar, ensinar e vender</div>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">Sua próxima aula pode virar uma grande ideia.</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">Abra sua loja gratuitamente, publique materiais didáticos e alcance educadores de todo o Brasil.</p>
          <div className="mx-auto mt-6 grid max-w-2xl grid-cols-1 gap-2 text-left sm:grid-cols-3"><p className="flex items-center gap-2 rounded-xl bg-white/85 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Cadastro gratuito</p><p className="flex items-center gap-2 rounded-xl bg-white/85 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Loja personalizada</p><p className="flex items-center gap-2 rounded-xl bg-white/85 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Venda com segurança</p></div>
        </header>
        <div className="mx-auto mt-5 w-full max-w-5xl"><SignupForm /></div>
        <footer className="mt-4 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center sm:gap-6"><p className="text-sm font-medium text-slate-600">Já tem uma loja? <Link href="/login" className="font-black text-violet-700 hover:underline">Entrar no painel</Link></p><Link href="/cadastro" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Opções de cadastro</Link></footer>
      </main>
      <style>{`@keyframes signupFloat{0%,100%{transform:translate3d(0,0,0) rotate(-10deg)}50%{transform:translate3d(0,-18px,0) rotate(6deg)}}@keyframes signupDrift{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(34px,18px,0)}}.signup-scene{position:relative;background:linear-gradient(140deg,#f8faff 0%,#eff6ff 48%,#f5f3ff 100%)}.signup-orb{position:absolute;border-radius:999px;filter:blur(38px);opacity:.65}.signup-orb-one{top:8%;left:-9%;width:26rem;height:26rem;background:#bfdbfe;animation:signupDrift 9s ease-in-out infinite}.signup-orb-two{right:-10%;top:35%;width:28rem;height:28rem;background:#ddd6fe;animation:signupDrift 11s ease-in-out infinite reverse}.signup-notebook,.signup-pen{position:absolute;color:#7c3aed;opacity:.16;animation:signupFloat 7s ease-in-out infinite}.signup-notebook-one{top:17rem;left:5%;width:6.5rem;height:6.5rem}.signup-notebook-two{right:5%;top:31rem;width:8rem;height:8rem;animation-delay:-3s}.signup-pen{right:14%;top:13rem;width:4.5rem;height:4.5rem;animation-delay:-1s}@media(max-width:640px){.signup-notebook-one{left:-2.5rem;top:24rem}.signup-notebook-two{right:-3.5rem;top:45rem}.signup-pen{right:1rem;top:15rem;width:3rem;height:3rem}}`}</style>
    </div>
  );
}
