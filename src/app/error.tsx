'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // É recomendado o log da exceção
    console.error('[App Error Boundary]', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 bg-slate-50 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md w-full">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Ops! Algo deu errado.</h1>
        <p className="text-slate-600 mb-8">
          Encontramos uma instabilidade temporária ao tentar processar esta solicitação. Fique tranquilo, tente carregar a página novamente.
        </p>
        <button
          onClick={() => reset()}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors duration-200 shadow-sm"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
