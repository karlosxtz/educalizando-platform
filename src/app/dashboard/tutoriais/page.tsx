'use client';

import { PlaySquare, Video, ExternalLink } from 'lucide-react';

const tutorials = [
  {
    title: 'Como Cadastrar seu Primeiro Produto',
    description: 'Aprenda o passo a passo para cadastrar um material em PDF ou e-book e deixá-lo pronto para venda imediata.',
    youtubeId: 'dQw4w9WgXcQ', // Default placeholder
    duration: '05:20'
  },
  {
    title: 'Como Criar Kits (Combos) Lucrativos',
    description: 'Descubra como agrupar seus materiais em combos para aumentar o ticket médio da sua loja.',
    youtubeId: 'dQw4w9WgXcQ', // Default placeholder
    duration: '03:45'
  },
  {
    title: 'Configurando sua Vitrine e Chave PIX',
    description: 'Entenda como personalizar o visual da sua loja e garantir que os pagamentos caiam direto na sua conta.',
    youtubeId: 'dQw4w9WgXcQ', // Default placeholder
    duration: '04:10'
  }
];

export default function TutoriaisPage() {
  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
            <PlaySquare className="w-7 h-7 text-blue-600" /> Aprenda a Usar
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Assista aos tutoriais abaixo para dominar a plataforma e maximizar as vendas da sua loja.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutorials.map((tutorial, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <div className="aspect-video bg-slate-900 relative">
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${tutorial.youtubeId}`} 
                title={tutorial.title} 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              ></iframe>
            </div>
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-slate-900 leading-tight">
                  {tutorial.title}
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full shrink-0">
                  <Video className="w-3 h-3" />
                  {tutorial.duration}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4 flex-1">
                {tutorial.description}
              </p>
              <a 
                href={`https://www.youtube.com/watch?v=${tutorial.youtubeId}`}
                target="_blank"
                rel="noreferrer"
                className="mt-auto w-full py-2.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center gap-2 transition-colors"
              >
                <span>Assistir no YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
