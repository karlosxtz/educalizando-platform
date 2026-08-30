'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Boxes, Plus, Edit3, Trash2, Eye, EyeOff, 
  Package, Loader2, AlertTriangle, AlertCircle, Sparkles, Tag, Layers 
} from 'lucide-react';

import { getCurrentCreatorStore } from '@/lib/store-service';
import { getKitsByStoreId, createKit, updateKit, deleteKit } from '@/lib/kit-service';
import { Kit, Store, Product } from '@/lib/types';

export default function KitsManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<Store | null>(null);
  const [kits, setKits] = useState<Kit[]>([]);

  // Modals State
  const [actionError, setActionError] = useState<string | null>(null);

  // Styled AlertDialog Delete Confirmation State
  const [deletingKit, setDeletingKit] = useState<Kit | null>(null);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);

  const loadData = async () => {
    try {
      const currentStore = await getCurrentCreatorStore();
      setStore(currentStore);
      const storeKits = await getKitsByStoreId(currentStore.id);
      setKits(storeKits);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateWizard = () => {
    router.push('/dashboard/kits/novo');
  };

  const confirmDeleteKit = async () => {
    if (!deletingKit) return;
    setIsDeletingLoading(true);
    setActionError(null);
    try {
      await deleteKit(deletingKit.id);
      setKits(prev => prev.filter(k => k.id !== deletingKit.id));
      setDeletingKit(null);
      await loadData();
      router.refresh();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao excluir kit.');
    } finally {
      setIsDeletingLoading(false);
    }
  };

  const handleToggleStatus = async (kit: Kit) => {
    const newStatus = kit.status === 'publicado' ? 'rascunho' : 'publicado';
    try {
      const updated = await updateKit(kit.id, { status: newStatus });
      setKits(prev => prev.map(k => (k.id === kit.id ? updated : k)));
    } catch (err: any) {
      setActionError(err.message || 'Erro ao alterar status do kit.');
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
      {/* Page Title & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
            <Boxes className="w-7 h-7 text-blue-600" /> Kits e Combos de Produtos ({kits.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Agrupe vários de seus materiais didáticos em pacotes especiais vendidos com preço promocional.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/kits/novo"
            className="px-5 py-2.5 rounded-xl font-extrabold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Criar Novo Kit</span>
          </Link>
        </div>
      </div>

      {actionError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-center gap-3 font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Kits Cards Grid */}
      {kits.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs text-center max-w-lg mx-auto space-y-4">
          <Boxes className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">
            Você ainda não criou nenhum Kit ou Combo
          </h3>
          <p className="text-sm text-slate-500">
            Combos de produtos vendem até 3x mais! Agrupe seus e-books e apostilas e ofereça um desconto atrativo.
          </p>
          <Link
            href="/dashboard/kits/novo"
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 text-white inline-flex items-center gap-2 shadow-md hover:bg-blue-700 transition-all"
          >
            <Plus className="w-4 h-4" /> Criar Meu Primeiro Kit
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {kits.map(kit => {
            const includedProducts = kit.products || [];
            const somaPrecos = includedProducts.reduce((acc, p) => acc + p.preco, 0);
            const economia = Math.max(0, somaPrecos - kit.preco_kit);
            const percentualOff = somaPrecos > 0 && kit.preco_kit < somaPrecos
              ? Math.round((economia / somaPrecos) * 100)
              : 0;

            return (
              <div
                key={kit.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-all relative overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Kit Cover & Badges */}
                  <div className="h-44 rounded-xl overflow-hidden bg-slate-100 relative">
                    {kit.capa_url ? (
                      <img src={kit.capa_url} alt={kit.titulo} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs font-semibold p-4 text-center bg-slate-200/60">
                        <Boxes className="w-10 h-10 mb-1 text-slate-400" />
                        <span>Capa do Combo</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <button
                      onClick={() => handleToggleStatus(kit)}
                      className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-xs ${
                        kit.status === 'publicado'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {kit.status === 'publicado' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{kit.status}</span>
                    </button>

                    {/* Discount Badge */}
                    {percentualOff > 0 && (
                      <span className="absolute bottom-2 left-2 bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase shadow-md flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> {percentualOff}% OFF
                      </span>
                    )}

                    {/* Products Count Badge */}
                    <span className="absolute top-2 left-2 bg-slate-900/90 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-xs">
                      <Package className="w-3 h-3 text-blue-400" /> {includedProducts.length} Materiais
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-base line-clamp-2 leading-tight">
                      {kit.titulo}
                    </h3>
                    {kit.descricao && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {kit.descricao}
                      </p>
                    )}
                  </div>

                  {/* Included Items Preview */}
                  {includedProducts.length > 0 && (
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        Incluso no Combo:
                      </span>
                      <ul className="text-xs text-slate-700 font-semibold space-y-0.5">
                        {includedProducts.slice(0, 3).map((p, idx) => (
                          <li key={idx} className="truncate flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                            <span className="truncate">{p.titulo}</span>
                          </li>
                        ))}
                        {includedProducts.length > 3 && (
                          <li className="text-[10px] text-blue-600 font-bold pl-3">
                            + {includedProducts.length - 3} outro(s) material(is)
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Pricing & Savings Footer */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Preço do Combo</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-slate-900">
                          R$ {kit.preco_kit.toFixed(2).replace('.', ',')}
                        </span>
                        {somaPrecos > 0 && somaPrecos > kit.preco_kit && (
                          <span className="text-xs text-slate-400 line-through">
                            R$ {somaPrecos.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/dashboard/kits/novo?edit=${kit.id}`}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        title="Editar kit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeletingKit(kit)}
                        className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                        title="Excluir kit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Economy Highlight */}
                  {economia > 0 && (
                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold px-2.5 py-1 rounded-lg text-center">
                      Economia de R$ {economia.toFixed(2).replace('.', ',')} ({percentualOff}% off)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Styled AlertDialog Modal for Delete Confirmation */}
      <AnimatePresence>
        {deletingKit && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-5 shadow-2xl relative"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Excluir Kit / Combo?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tem certeza que deseja remover <strong>"{deletingKit.titulo}"</strong>? Esta ação não afetará os produtos individuais da sua loja.
                </p>
              </div>

              {actionError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-start gap-2.5 text-left font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{actionError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeletingKit(null);
                    setActionError(null);
                  }}
                  disabled={isDeletingLoading}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
                >
                  {actionError ? 'Fechar' : 'Cancelar'}
                </button>
                {!actionError && (
                  <button
                    type="button"
                    onClick={confirmDeleteKit}
                    disabled={isDeletingLoading}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md flex items-center justify-center gap-2 transition-all"
                  >
                    {isDeletingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    <span>Excluir Kit</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
