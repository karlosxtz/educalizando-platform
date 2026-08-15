"use client";

import { useEffect, useState } from 'react';
import { Megaphone, Trash2, Plus, Power, Link as LinkIcon } from 'lucide-react';

interface BannerData {
  id: string;
  title: string | null;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_active: boolean;
  link_url: string | null;
  link_text: string | null;
  created_at: string;
}

export default function SuperAdminAvisos() {
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [novoTitle, setNovoTitle] = useState('');
  const [novoMessage, setNovoMessage] = useState('');
  const [novoType, setNovoType] = useState<'info' | 'warning' | 'error' | 'success'>('info');
  const [novoLinkUrl, setNovoLinkUrl] = useState('');
  const [novoLinkText, setNovoLinkText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  async function fetchBanners() {
    try {
      const res = await fetch('/api/admin/banners');
      const data = await res.json();
      if (data.success) {
        setBanners(data.banners);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoMessage) return;
    
    setSaving(true);
    try {
      const payload = {
        title: novoTitle || null,
        message: novoMessage,
        type: novoType,
        is_active: true,
        link_url: novoLinkUrl || null,
        link_text: novoLinkText || null,
      };

      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setNovoTitle('');
        setNovoMessage('');
        setNovoType('info');
        setNovoLinkUrl('');
        setNovoLinkText('');
        fetchBanners();
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
    if (!confirm('Deseja excluir este aviso permanentemente?')) return;
    
    try {
      const res = await fetch(`/api/admin/banners?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchBanners();
      } else {
        alert('Erro ao excluir: ' + data.error);
      }
    } catch (e) {
      alert('Erro inesperado.');
    }
  }

  async function handleToggleStatus(banner: BannerData) {
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...banner, is_active: !banner.is_active })
      });
      const data = await res.json();
      if (data.success) {
        fetchBanners();
      } else {
        alert('Erro ao atualizar: ' + data.error);
      }
    } catch (error) {
      alert('Erro inesperado');
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'success': return 'bg-green-500/20 text-green-400 border-green-500/50';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'info': return 'Informativo';
      case 'warning': return 'Aviso';
      case 'error': return 'Crítico';
      case 'success': return 'Sucesso';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Avisos Globais (Banners)</h1>
        <p className="text-slate-400 mt-1">Dispare mensagens importantes que aparecerão no painel de todos os criadores.</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-500" />
          Criar Novo Aviso
        </h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm text-slate-400">Título (Opcional)</label>
              <input
                type="text"
                value={novoTitle}
                onChange={(e) => setNovoTitle(e.target.value)}
                placeholder="Ex: Manutenção Programada"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="w-full md:w-48 space-y-2">
              <label className="text-sm text-slate-400">Tipo (Cor)</label>
              <select
                value={novoType}
                onChange={(e) => setNovoType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none"
              >
                <option value="info">Informativo (Azul)</option>
                <option value="success">Sucesso (Verde)</option>
                <option value="warning">Aviso (Amarelo)</option>
                <option value="error">Crítico (Vermelho)</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Mensagem (Obrigatório)</label>
            <textarea
              required
              value={novoMessage}
              onChange={(e) => setNovoMessage(e.target.value)}
              placeholder="Digite o conteúdo do aviso..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[80px]"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm text-slate-400">URL do Link (Opcional)</label>
              <input
                type="text"
                value={novoLinkUrl}
                onChange={(e) => setNovoLinkUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm text-slate-400">Texto do Link (Opcional)</label>
              <input
                type="text"
                value={novoLinkText}
                onChange={(e) => setNovoLinkText(e.target.value)}
                placeholder="Saiba mais"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button 
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Megaphone className="w-4 h-4" />
              {saving ? 'Publicando...' : 'Publicar Aviso'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs uppercase bg-slate-900 text-slate-500 border-b border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4">Status / Tipo</th>
                <th scope="col" className="px-6 py-4">Conteúdo</th>
                <th scope="col" className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                    Carregando avisos...
                  </td>
                </tr>
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                    Nenhum aviso global criado.
                  </td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner.id} className="border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border w-fit ${getTypeColor(banner.type)}`}>
                          {getTypeText(banner.type)}
                        </span>
                        <span className={`text-xs font-bold ${banner.is_active ? 'text-green-500' : 'text-slate-500'}`}>
                          {banner.is_active ? '● Ativo' : '○ Inativo'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-200">
                      {banner.title && <p className="font-bold mb-1">{banner.title}</p>}
                      <p className="text-slate-400 text-sm">{banner.message}</p>
                      {banner.link_url && (
                        <a href={banner.link_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2">
                          <LinkIcon className="w-3 h-3" />
                          {banner.link_text || 'Link'}
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleToggleStatus(banner)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            banner.is_active 
                              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                              : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          {banner.is_active ? 'Desativar' : 'Ativar'}
                        </button>
                        <button 
                          onClick={() => handleDelete(banner.id)}
                          className="text-red-500 hover:text-red-400 inline-flex items-center gap-1 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Excluir Permanentemente"
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
      </div>
    </div>
  );
}
