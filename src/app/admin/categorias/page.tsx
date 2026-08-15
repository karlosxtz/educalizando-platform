"use client";

import { useEffect, useState } from 'react';
import { Tags, Trash2, Plus } from 'lucide-react';

interface CategoryData {
  id: string;
  nome: string;
  slug: string;
}

export default function SuperAdminCategorias() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoNome, setNovoNome] = useState('');
  const [novoSlug, setNovoSlug] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome || !novoSlug) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novoNome, slug: novoSlug })
      });
      const data = await res.json();
      if (data.success) {
        setNovoNome('');
        setNovoSlug('');
        fetchCategories();
      } else {
        alert('Erro ao criar: ' + data.error);
      }
    } catch (error) {
      alert('Erro inesperado');
    } finally {
      setSaving(false);
    }
  };

  async function handleDelete(id: string) {
    if (!confirm('Deseja excluir esta categoria global?')) return;
    
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchCategories();
      } else {
        alert('Erro ao excluir: ' + data.error);
      }
    } catch (e) {
      alert('Erro inesperado.');
    }
  }

  // Gera slug automatico baseado no nome
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNovoNome(val);
    setNovoSlug(
      val.toLowerCase()
         .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
         .replace(/[^a-z0-9]+/g, '-')
         .replace(/^-+|-+$/g, '')
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Categorias Globais</h1>
        <p className="text-slate-400 mt-1">Gerencie a taxonomia padrão oferecida aos criadores.</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-500" />
          Adicionar Nova Categoria
        </h2>
        <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2 w-full">
            <label className="text-sm text-slate-400">Nome</label>
            <input
              type="text"
              required
              value={novoNome}
              onChange={handleNameChange}
              placeholder="Ex: Física Quântica"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 space-y-2 w-full">
            <label className="text-sm text-slate-400">Slug URL</label>
            <input
              type="text"
              required
              value={novoSlug}
              onChange={(e) => setNovoSlug(e.target.value)}
              placeholder="fisica-quantica"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm"
            />
          </div>
          <button 
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 whitespace-nowrap h-[42px]"
          >
            {saving ? 'Adicionando...' : 'Adicionar'}
          </button>
        </form>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs uppercase bg-slate-900 text-slate-500 border-b border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4">Nome</th>
                <th scope="col" className="px-6 py-4">Slug</th>
                <th scope="col" className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                    Carregando categorias...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                    Nenhuma categoria global cadastrada.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                          <Tags className="w-4 h-4" />
                        </div>
                        {cat.nome}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {cat.slug}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(cat.id)}
                        className="text-red-500 hover:text-red-400 inline-flex items-center gap-1 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Excluir Categoria"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
