export default function Loading() {
  return <main aria-busy="true" className="mx-auto w-full max-w-7xl p-4 sm:p-8"><p role="status" className="py-6 text-lg font-semibold text-slate-700">Carregando materiais e filtros…</p><div aria-hidden="true" className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="aspect-[4/5] rounded-2xl bg-slate-100 motion-safe:animate-pulse" />)}</div></main>;
}
