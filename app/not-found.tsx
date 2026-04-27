import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 text-center">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Página não encontrada</h2>
      <p className="text-slate-600 mb-6">Desculpe, não conseguimos encontrar a página que você está procurando.</p>
      <Link 
        href="/" 
        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all"
      >
        Voltar para o Início
      </Link>
    </div>
  );
}
