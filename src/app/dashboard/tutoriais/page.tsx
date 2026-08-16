'use client';

import { useState, useEffect } from 'react';
import { PlaySquare, Loader2, Rocket, CheckCircle2, Trophy, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  youtube_id: string;
  duration: string;
  order: number;
}

export default function TutoriaisPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchedIds, setWatchedIds] = useState<string[]>([]);

  useEffect(() => {
    // Load watched progress from local storage
    const saved = localStorage.getItem('educalizando_watched_tutorials');
    if (saved) {
      try {
        setWatchedIds(JSON.parse(saved));
      } catch (e) {}
    }

    async function loadTutorials() {
      try {
        const res = await fetch('/api/tutorials');
        if (!res.ok) throw new Error('Erro ao carregar tutoriais');
        const data = await res.json();
        setTutorials(data);
      } catch (error) {
        toast.error('Erro ao buscar tutoriais. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    }
    loadTutorials();
  }, []);

  const toggleWatched = (id: string) => {
    setWatchedIds(prev => {
      const isWatched = prev.includes(id);
      const newWatched = isWatched ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('educalizando_watched_tutorials', JSON.stringify(newWatched));
      
      if (!isWatched) {
        toast.success('Aula marcada como assistida!');
      }
      
      return newWatched;
    });
  };

  const progressPercentage = tutorials.length > 0 
    ? Math.round((watchedIds.length / tutorials.length) * 100) 
    : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Banner Superior Verde */}
      <div className="bg-blue-600 rounded-xl p-4 flex items-center gap-4 text-white shadow-sm cursor-pointer hover:bg-blue-700 transition-colors">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
          <Rocket className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2">
            Dicas para cadastrar produtos e aparecer mais no Google e nas pesquisas por IA
          </h2>
          <p className="text-blue-100 text-sm font-medium opacity-90">
            Guia completo de SEO para títulos, descrições, imagens e categorias.
          </p>
        </div>
        <div className="ml-auto">
          <PlaySquare className="w-5 h-5 opacity-50" />
        </div>
      </div>

      {/* Barra de Progresso */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 text-blue-500 p-2 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">Seu progresso</h3>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            <Trophy className="w-4 h-4" />
            {progressPercentage === 100 ? 'Completo!' : `${progressPercentage}%`} <span className="text-blue-600/70 ml-1">{watchedIds.length}/{tutorials.length}</span>
          </div>
        </div>
        
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-blue-500 h-full rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : tutorials.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 p-8 rounded-xl text-center text-slate-500 text-sm font-medium">
          Nenhum tutorial disponível no momento.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {tutorials.map((tutorial, idx) => {
            const isWatched = watchedIds.includes(tutorial.id);
            
            return (
              <div key={tutorial.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col group">
                {/* Video Player Area */}
                <div className="aspect-video bg-black relative">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={`https://www.youtube.com/embed/${tutorial.youtube_id}`} 
                    title={tutorial.title} 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  ></iframe>
                </div>
                
                {/* Bottom Bar Info */}
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleWatched(tutorial.id)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                        isWatched 
                          ? 'border-blue-500 bg-blue-50 text-blue-500' 
                          : 'border-slate-200 text-slate-300 hover:border-blue-200 hover:text-blue-400'
                      }`}
                    >
                      <CheckCircle2 className={`w-6 h-6 ${isWatched ? 'fill-blue-100' : ''}`} />
                    </button>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base leading-tight group-hover:text-blue-600 transition-colors">
                        {tutorial.title}
                      </h3>
                      <p className="text-sm text-slate-500 font-medium">
                        Aula {idx + 1}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleWatched(tutorial.id)}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      isWatched
                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {isWatched ? 'Assistido' : 'Marcar como Assistido'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
