'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 text-center">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Algo deu errado!</h2>
      <p className="text-slate-600 mb-6">Ocorreu um erro inesperado ao carregar esta página.</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all"
      >
        Tentar novamente
      </button>
    </div>
  );
}
