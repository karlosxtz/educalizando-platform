export default function Loading() {
  return (
    <main aria-busy="true" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <p role="status" className="sr-only">Carregando página…</p>
      <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
        <div className="h-8 w-3/5 rounded-lg bg-slate-200 sm:w-2/5" />
        <div className="h-4 w-full max-w-2xl rounded bg-slate-100" />
        <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="aspect-[4/5] rounded-2xl bg-slate-100" />)}
        </div>
      </div>
    </main>
  );
}
