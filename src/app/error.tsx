'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // É recomendado o log da exceção
    console.error('[App Error Boundary]', error);
    headingRef.current?.focus();
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 bg-slate-50 font-sans">
      <div role="alert" aria-labelledby="app-error-title" className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md w-full">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 ref={headingRef} id="app-error-title" tabIndex={-1} className="text-2xl font-black text-slate-900 mb-2 outline-none">Ops! Algo deu errado.</h1>
        <p className="text-slate-600 mb-8">
          Encontramos uma instabilidade temporária ao tentar processar esta solicitação. Fique tranquilo, tente carregar a página novamente.
        </p>
        <button
          onClick={() => reset()}
          className="min-h-12 w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white shadow-sm transition-colors duration-200 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
