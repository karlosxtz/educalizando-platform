export default function HomeCatalogSkeleton() {
  return <main aria-busy="true" className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10">
    <p role="status" className="mb-8 text-sm font-semibold text-slate-600">Carregando os materiais da Educalizando…</p>
    <h2 className="text-2xl font-black text-slate-950">Materiais em destaque</h2>
    <div aria-hidden="true" className="mt-6 grid grid-cols-1 gap-6 min-[600px]:grid-cols-2 xl:grid-cols-4">{[0,1,2,3].map(index => <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="aspect-square bg-slate-200 motion-safe:animate-pulse" /><div className="space-y-4 p-5"><div className="h-5 w-4/5 rounded bg-slate-200" /><div className="h-4 w-2/3 rounded bg-slate-100" /><div className="h-11 rounded-xl bg-blue-50" /></div></div>)}</div>
    <h2 className="mt-12 text-2xl font-black text-slate-950">Próximas datas para planejar</h2>
    <div aria-hidden="true" className="mt-6 h-40 rounded-2xl bg-indigo-50 motion-safe:animate-pulse" />
  </main>;
}
