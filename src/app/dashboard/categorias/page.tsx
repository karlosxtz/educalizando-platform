'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Tags, Plus, Edit3, Trash2, Check, Loader2, 
  AlertCircle, ShieldAlert, Globe, Layers, Package, X 
} from 'lucide-react';

import { getCurrentCreatorStore, getProductsByStoreId } from '@/lib/store-service';
import { 
  getCategories, 
  createCustomCategory, 
  updateCustomCategory, 
  deleteCustomCategory 
} from '@/lib/category-service';
import { Store, Category, Product } from '@/lib/types';

export default function CategoriesManagementPage() {
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<Store | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Edit State
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Delete State with AlertDialog
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);

  // Error State
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const currentStore = await getCurrentCreatorStore();
      setStore(currentStore);

      const cats = await getCategories(currentStore.id);
      setAllCategories(cats);

      const prods = await getProductsByStoreId(currentStore.id);
      setProducts(prods);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const customCategories = allCategories.filter(c => c.store_id !== null);
  const globalCategories = allCategories.filter(c => c.store_id === null);

  const getProductCountForCategory = (catId: string) => {
    return products.filter(p => p.category_id === catId).length;
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim() || !store) return;
    setActionError(null);
    setIsCreating(true);
    try {
      const created = await createCustomCategory(store.id, newCatName.trim());
      setAllCategories(prev => [...prev, created]);
      setNewCatName('');
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setActionError(err.message || 'Erro ao cadastrar categoria.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartEdit = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditingName(cat.nome);
  };

  const handleSaveEdit = async (catId: string) => {
    if (!editingName.trim()) return;
    setActionError(null);
    try {
      const updated = await updateCustomCategory(catId, editingName.trim());
      setAllCategories(prev => prev.map(c => (c.id === catId ? updated : c)));
      setEditingCatId(null);
    } catch (err: any) {
      setActionError(err.message || 'Erro ao editar categoria.');
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCat) return;
    setIsDeletingLoading(true);
    setActionError(null);

    const count = getProductCountForCategory(deletingCat.id);
    if (count > 0) {
      setActionError(`A categoria "${deletingCat.nome}" está associada a ${count} produto(s). Reatribua os produtos para outra categoria antes de excluir.`);
      setDeletingCat(null);
      setIsDeletingLoading(false);
      return;
    }

    try {
      await deleteCustomCategory(deletingCat.id);
      setAllCategories(prev => prev.filter(c => c.id !== deletingCat.id));
      setDeletingCat(null);
    } catch (err: any) {
      setActionError(err.message || 'Erro ao excluir categoria.');
      setDeletingCat(null);
    } finally {
      setIsDeletingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
            <Tags className="w-7 h-7 text-blue-600" /> Categorias & Temas Didáticos
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Gerencie as categorias customizadas exclusivas da sua loja e consulte o vocabulário padrão da plataforma.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-5 py-3 rounded-xl font-extrabold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Cadastrar Nova Categoria</span>
        </button>
      </div>

      {actionError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-center gap-3 font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Section: Custom Store Categories */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Tags className="w-5 h-5 text-blue-600" />
              Minhas Categorias Customizadas ({customCategories.length})
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Categorias exclusivas criadas por você para organizar a vitrine da sua loja.
            </p>
          </div>
        </div>

        {customCategories.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center space-y-3 max-w-md mx-auto">
            <Tags className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Você ainda não possui categorias próprias</h3>
            <p className="text-xs text-slate-500">
              Você pode usar as categorias globais da plataforma ou criar sua primeira categoria customizada agora.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white inline-flex items-center gap-1.5 shadow-md hover:bg-blue-700 transition-all"
            >
              <Plus className="w-4 h-4" /> Criar Minha Primeira Categoria
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {customCategories.map(cat => {
              const productCount = getProductCountForCategory(cat.id);
              const isEditing = editingCatId === cat.id;

              return (
                <div
                  key={cat.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-xs hover:border-slate-300 transition-all"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-blue-600 rounded-lg text-slate-900 text-xs font-bold"
                      />
                      <button
                        onClick={() => handleSaveEdit(cat.id)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                        title="Salvar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingCatId(null)}
                        className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm truncate">{cat.nome}</span>
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          Customizada
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                        <span className="text-slate-500 flex items-center gap-1 font-medium">
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                          {productCount} {productCount === 1 ? 'produto' : 'produtos'}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEdit(cat)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
                            title="Editar Categoria"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingCat(cat)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition-colors"
                            title="Excluir Categoria"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Secondary Section: Global Platform Categories (Read-Only) */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600" />
              Categorias Globais da Plataforma ({globalCategories.length})
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Categorias padrão disponibilizadas pelo Educalizando para todos os criadores (somente leitura).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {globalCategories.map(cat => (
            <span
              key={cat.id}
              className="bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>{cat.nome}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Modal: Create Custom Category */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Tags className="w-4 h-4 text-blue-600" />
                  Cadastrar Nova Categoria Customizada
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ex: Apostilas de Medicina 2026..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-sm"
                />
                <p className="text-[11px] text-slate-500 font-medium">
                  Esta categoria será exclusiva da sua loja e aparecerá nos filtros dos seus materiais didáticos.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={isCreating || !newCatName.trim()}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 disabled:opacity-50 shadow-md"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Criar Categoria</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Styled AlertDialog Modal for Delete Confirmation */}
      <AnimatePresence>
        {deletingCat && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Excluir Categoria "{deletingCat.nome}"?</h3>
              <p className="text-xs text-slate-500">
                Esta categoria será removida das opções da sua loja. Apenas categorias sem produtos associados podem ser excluídas.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingCat(null)}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteCategory}
                  disabled={isDeletingLoading}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-rose-600 text-white hover:bg-rose-700 shadow-sm flex items-center justify-center gap-1.5"
                >
                  {isDeletingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>Excluir Categoria</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
