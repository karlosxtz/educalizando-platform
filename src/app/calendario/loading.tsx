export default function CalendarLoading() {
  return <main aria-busy="true" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12"><p role="status" className="sr-only">Carregando calendário escolar…</p><div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse"><div className="h-56 rounded-[2rem] bg-blue-100" /><div className="h-20 rounded-3xl bg-slate-100" /><div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]"><div className="h-[30rem] rounded-[2rem] bg-slate-100" /><div className="h-[30rem] rounded-[2rem] bg-slate-100" /></div></div></main>;
}
