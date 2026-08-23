import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-4xl font-black text-slate-900 mb-4">Educalizando Marketplace</h1>
      <p className="text-lg text-slate-600 mb-8 max-w-lg">
        Estamos construindo a maior vitrine de materiais didáticos do Brasil. Em breve você poderá explorar e adquirir os melhores infoprodutos.
      </p>
      
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-sm w-full">
        <h3 className="font-bold text-slate-800 mb-2">Você é um criador de conteúdo?</h3>
        <p className="text-sm text-slate-500 mb-4">
          Comece a vender suas apostilas, e-books e cursos hoje mesmo.
        </p>
        <Link 
          href="/vender" 
          className="inline-block w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
        >
          Seja um Produtor
        </Link>
      </div>
    </div>
  );
}
