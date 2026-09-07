'use client';

import { useState, useEffect } from 'react';
import { MainBanner, getAllBanners, createBanner, updateBanner, deleteBanner } from '@/lib/banners-service';
import FileUpload from '@/components/dashboard/FileUpload';
import { MonitorPlay, Plus, Save, Trash2, Edit2, CheckCircle2, XCircle } from 'lucide-react';

export default function BannersAdminPage() {
  const [banners, setBanners] = useState<MainBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Partial<MainBanner> | null>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const data = await getAllBanners();
      setBanners(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingBanner?.image_desktop_url) {
      alert('A imagem para Desktop é obrigatória!');
      return;
    }

    try {
      if (editingBanner.id) {
        await updateBanner(editingBanner.id, editingBanner);
      } else {
        await createBanner({
          ...editingBanner,
          is_active: editingBanner.is_active ?? true,
          order_index: editingBanner.order_index ?? banners.length
        });
      }
      setIsModalOpen(false);
      setEditingBanner(null);
      fetchBanners();
    } catch (err) {
      console.error('Erro ao salvar banner:', err);
      alert('Ocorreu um erro ao salvar o banner.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este banner?')) return;
    try {
      await deleteBanner(id);
      fetchBanners();
    } catch (err) {
      console.error('Erro ao deletar banner:', err);
      alert('Ocorreu um erro ao deletar.');
    }
  };

  const toggleActive = async (banner: MainBanner) => {
    try {
      await updateBanner(banner.id, { is_active: !banner.is_active });
      fetchBanners();
    } catch (err) {
      console.error('Erro ao alterar status:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <MonitorPlay className="w-7 h-7 text-blue-500" />
            Banners Principais
          </h1>
          <p className="text-slate-400 mt-1">Gerencie o carrossel exibido na página inicial.</p>
        </div>
        <button
          onClick={() => {
            setEditingBanner({});
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Banner
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando banners...</div>
        ) : banners.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhum banner cadastrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Banner / Desktop</th>
                  <th className="px-6 py-4 font-bold text-center">Mobile</th>
                  <th className="px-6 py-4 font-bold text-center">Status</th>
                  <th className="px-6 py-4 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {banners.map(banner => (
                  <tr key={banner.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-32 h-16 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                          <img src={banner.image_desktop_url} alt="Desktop" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-200">{banner.title || 'Sem título'}</p>
                          {banner.link_url && (
                            <p className="text-xs text-blue-400 mt-1 truncate max-w-xs">{banner.link_url}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {banner.image_mobile_url ? (
                        <div className="w-10 h-16 rounded bg-slate-800 overflow-hidden mx-auto border border-slate-700">
                          <img src={banner.image_mobile_url} alt="Mobile" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">Não possui</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => toggleActive(banner)}>
                        {banner.is_active ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-slate-600 mx-auto" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingBanner(banner);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900/90 backdrop-blur">
              <h2 className="text-xl font-bold text-white">
                {editingBanner?.id ? 'Editar Banner' : 'Novo Banner'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <Trash2 className="w-5 h-5" /> {/* Use close icon later if needed */}
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Título do Banner (Interno)</label>
                <input
                  type="text"
                  value={editingBanner?.title || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="Ex: Campanha Dia dos Professores"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Link de Destino (Opcional)</label>
                <input
                  type="url"
                  value={editingBanner?.link_url || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, link_url: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="Ex: https://educalizando.com/buscar?q=diadosprofessores"
                />
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <FileUpload
                  label="Imagem Principal (Desktop)"
                  helperText="Formato recomendado: 1920x600px. Será exibida em telas grandes."
                  bucket="main-banners"
                  accept="image/*"
                  isImage={true}
                  aspectRatio="3:1"
                  value={editingBanner?.image_desktop_url}
                  onChange={(url) => setEditingBanner({ ...editingBanner, image_desktop_url: url || '' })}
                />
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <FileUpload
                  label="Imagem Mobile (Opcional)"
                  helperText="Formato recomendado: 800x800px ou quadrado. Usada em celulares."
                  bucket="main-banners"
                  accept="image/*"
                  isImage={true}
                  aspectRatio="1:1"
                  value={editingBanner?.image_mobile_url}
                  onChange={(url) => setEditingBanner({ ...editingBanner, image_mobile_url: url })}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingBanner?.is_active ?? true}
                  onChange={(e) => setEditingBanner({ ...editingBanner, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-slate-300">
                  Banner Ativo (Exibir na Home)
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 flex justify-end gap-4 sticky bottom-0 bg-slate-900">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 font-bold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2"
              >
                <Save className="w-5 h-5" /> Salvar Banner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
