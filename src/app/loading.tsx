import Image from 'next/image';

export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Carregando conteúdo da Educalizando"
      className="grid min-h-screen place-items-center bg-slate-50 px-4"
    >
      <section className="w-full max-w-md rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-sm">
        <Image
          src="/branding/logo-educalizando-icon-192.png"
          alt=""
          width={96}
          height={96}
          className="mx-auto h-20 w-20 object-contain"
          priority
        />
        <p className="mt-3 text-xl font-black text-blue-950">Educalizando</p>
        <div className="mx-auto mt-7 h-2 w-48 overflow-hidden rounded-full bg-blue-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-600" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-600">Preparando os materiais para você…</p>
      </section>
    </main>
  );
}
