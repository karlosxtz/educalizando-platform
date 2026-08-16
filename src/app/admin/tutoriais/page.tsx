'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Loader2, PlaySquare } from 'lucide-react';
import { toast } from 'sonner';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  youtube_id: string;
  duration: string;
  order: number;
  is_active: boolean;
}

export default function AdminTutorialsPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtube_id: '',
    duration: '',
    order: 0,
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTutorials();
  }, []);

  const fetchTutorials = async () => {
    try {
      const res = await fetch('/api/admin/tutorials');
      if (!res.ok) throw new Error('Falha ao carregar tutoriais');
      const data = await res.json();
      setTutorials(data || []);
    } catch (error) {
      toast.error('Erro ao buscar tutoriais');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (tutorial?: Tutorial) => {
    if (tutorial) {
      setEditingTutorial(tutorial);
      setFormData({
        title: tutorial.title,
        description: tutorial.description,
        youtube_id: tutorial.youtube_id,
        duration: tutorial.duration || '',
        order: tutorial.order || 0,
        is_active: tutorial.is_active
      });
    } else {
      setEditingTutorial(null);
      setFormData({
        title: '',
        description: '',
        youtube_id: '',
        duration: '',
        order: tutorials.length + 1,
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const method = editingTutorial ? 'PUT' : 'POST';
      const body = editingTutorial 
        ? { ...formData, id: editingTutorial.id } 
        : formData;
        
      const res = await fetch('/api/admin/tutorials', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao salvar tutorial');
      }
      
      toast.success(editingTutorial ? 'Tutorial atualizado!' : 'Tutorial criado!');
      setShowModal(false);
      fetchTutorials();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este tutorial?')) return;
    
    try {
      const res = await fetch(`/api/admin/tutorials?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir tutorial');
      
      toast.success('Tutorial excluído');
      fetchTutorials();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PlaySquare className="w-6 h-6 text-blue-500" /> 
            Vídeos "Aprenda a Usar"
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Gerencie os tutoriais que aparecem na dashboard dos criadores.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Tutorial
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
            <tr>
              <th className="p-4 font-semibold">Ordem</th>
              <th className="p-4 font-semibold">Vídeo</th>
              <th className="p-4 font-semibold">ID YouTube</th>
              <th className="p-4 font-semibold text-center">Status</th>
              <th className="p-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {tutorials.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  Nenhum tutorial cadastrado.
                </td>
              </tr>
            ) : (
              tutorials.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 text-slate-400 font-mono">#{t.order}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-200">{t.title}</div>
                    <div className="text-xs text-slate-500 line-clamp-1">{t.description}</div>
                  </td>
                  <td className="p-4 text-slate-400 font-mono text-xs">{t.youtube_id}</td>
                  <td className="p-4 text-center">
                    {t.is_active ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-full border border-rose-500/20">
                        Inativo
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(t)}
                        className="p-2 text-slate-400 hover:text-blue-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(t.id)}
                        className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{editingTutorial ? 'Editar Tutorial' : 'Novo Tutorial'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Título</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" 
                  placeholder="Ex: Como Cadastrar Produto"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Descrição Curta</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" 
                  placeholder="Descreva sobre o que é este vídeo..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">ID do YouTube</label>
                  <input 
                    type="text" 
                    value={formData.youtube_id} 
                    onChange={(e) => setFormData({...formData, youtube_id: e.target.value})}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm font-mono focus:border-blue-500 focus:outline-none" 
                    placeholder="dQw4w9WgXcQ"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">O código no final do link do YouTube.</p>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Duração (Opcional)</label>
                  <input 
                    type="text" 
                    value={formData.duration} 
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm font-mono focus:border-blue-500 focus:outline-none" 
                    placeholder="05:20"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ordem (Exibição)</label>
                  <input 
                    type="number" 
                    value={formData.order} 
                    onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" 
                  />
                </div>
                
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.is_active} 
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold">Ativo (Visível)</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
