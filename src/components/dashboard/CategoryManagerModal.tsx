'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Tags, Plus, Edit3, Trash2, X, Check, Loader2, 
  AlertTriangle, AlertCircle, ShieldAlert 
} from 'lucide-react';
import { Category } from '@/lib/types';
import { 
  getCategories, 
  createCustomCategory, 
  updateCustomCategory, 
  deleteCustomCategory 
} from '@/lib/category-service';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
}

export default function CategoryManagerModal({
  isOpen,
  onClose,
  storeId
}: CategoryManagerModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // New Category Input
  const [newCatName, setNewCatName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Editing State
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Delete State
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);

  // Error State
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const all = await getCategories(storeId);
      // Filter ONLY custom categories created for this store
      setCategories(all.filter(c => c.store_id === storeId));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, storeId]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!newCatName.trim()) return;
    setActionError(null);
    setIsCreating(true);
    try {
      const created = await createCustomCategory(storeId, newCatName.trim());
      setCategories(prev => [...prev, created]);
      setNewCatName('');
    } catch (err: any) {
      setActionError(err.message || 'Erro ao criar categoria.');
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
      setCategories(prev => prev.map(c => (c.id === catId ? updated : c)));
      setEditingCatId(null);
    } catch (err: any) {
      setActionError(err.message || 'Erro ao editar categoria.');
    }
  };

  const confirmDelete = async () => {
    if (!deletingCat) return;
    setIsDeletingLoading(true);
    setActionError(null);
    try {
      await deleteCustomCategory(deletingCat.id);
      setCategories(prev => prev.filter(c => c.id !== deletingCat.id));
      setDeletingCat(null);
    } catch (err: any) {
      setActionError(err.message || 'Esta categoria está em uso por produtos. Altere os produtos antes de excluir.');
      setDeletingCat(null);
    } finally {
      setIsDeletingLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Gerenciar Minhas Categorias</h2>
              <p className="text-xs text-slate-500 font-medium">Categorias exclusivas criadas para a sua loja</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {actionError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-center gap-3 font-semibold">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Create Form */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Nome da nova categoria..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-slate-900 text-xs focus:outline-none"
          />
          <button
            onClick={handleCreate}
            disabled={isCreating || !newCatName.trim()}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
          >
            {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Criar</span>
          </button>
        </div>

        {/* Categories List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 space-y-2 bg-slate-50 rounded-2xl border border-slate-200 p-4">
            <Tags className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-bold text-slate-700">Sua loja ainda não possui categorias customizadas.</p>
            <p className="text-[11px]">Categorias globais como "Matemática" e "Redação" continuam disponíveis no formulário de cadastro.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {categories.map(cat => (
              <div
                key={cat.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs font-bold text-slate-900"
              >
                {editingCatId === cat.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 px-3 py-1 bg-white border border-blue-600 rounded-lg text-slate-900 text-xs"
                    />
                    <button
                      onClick={() => handleSaveEdit(cat.id)}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingCatId(null)}
                      className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="truncate">{cat.nome}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg"
                        title="Editar nome"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingCat(cat)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                        title="Excluir categoria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation AlertDialog */}
        <AnimatePresence>
          {deletingCat && (
            <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
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
                  Esta categoria será removida das opções da sua loja. Apenas categorias que não estejam associadas a nenhum produto podem ser excluídas.
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
                    onClick={confirmDelete}
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
      </motion.div>
    </div>
  );
}
