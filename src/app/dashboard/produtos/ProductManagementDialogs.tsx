'use client';
import CategoryManagerModal from '@/components/dashboard/CategoryManagerModal';
import { AnimatePresence,motion } from 'framer-motion';
import { AlertCircle,AlertTriangle,Loader2,Sparkles,Trash2,X } from 'lucide-react';
export default function ProductManagementDialogs(state: any) { const { deletingProduct, setDeletingProduct, actionError, setActionError, deleteTriggerRef, isDeletingLoading, confirmDeleteProduct, isCategoryManagerOpen, setIsCategoryManagerOpen, store, loadData, marketingProduct, setMarketingProduct, setCampaignData, marketingTriggerRef, campaignData, isGeneratingCampaign, handleGenerateCampaign } = state; return <>
      {/* Styled AlertDialog Modal for Delete Confirmation */}
      <AnimatePresence>
        {deletingProduct && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" role="presentation">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-2xl relative"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-product-title"
              aria-describedby="delete-product-description"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-2">
                <h3 id="delete-product-title" className="text-xl font-bold text-slate-900">Excluir Produto Didático?</h3>
                <p id="delete-product-description" className="text-xs text-slate-500 leading-relaxed">
                  Tem certeza que deseja remover <strong>&quot;{deletingProduct.titulo}&quot;</strong>? Esta ação é definitiva para materiais sem vendas.
                </p>
              </div>

              {actionError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-start gap-2.5 text-left font-medium" role="alert">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{actionError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeletingProduct(null);
                    setActionError(null);
                    window.requestAnimationFrame(() => deleteTriggerRef.current?.focus());
                  }}
                  disabled={isDeletingLoading}
                  className="min-h-11 w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600 focus-visible:ring-offset-2"
                >
                  {actionError ? 'Fechar' : 'Cancelar'}
                </button>
                {!actionError && (
                  <button
                    type="button"
                    onClick={confirmDeleteProduct}
                    disabled={isDeletingLoading}
                    className="min-h-11 w-full py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
                  >
                    {isDeletingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    <span>Excluir Produto</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        storeId={store?.id || ''}
        onCategoriesUpdated={loadData}
      />
      {/* Marketing AI Modal */}
      <AnimatePresence>
        {marketingProduct && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" role="presentation">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[calc(100vh-2rem)]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="campaign-dialog-title"
            >
              <div className="px-4 sm:px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-purple-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 id="campaign-dialog-title" className="text-lg font-black text-slate-900 leading-tight">
                      Campanha de Vendas (IA)
                    </h2>
                    <p className="text-xs text-slate-600 font-medium line-clamp-1">
                      {marketingProduct.titulo}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMarketingProduct(null);
                    setCampaignData('');
                    setActionError(null);
                    window.requestAnimationFrame(() => marketingTriggerRef.current?.focus());
                  }}
                  className="min-h-11 min-w-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2"
                  aria-label="Fechar campanha de vendas"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
                {actionError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-start gap-2.5 font-medium mb-4" role="alert">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span>{actionError}</span>
                  </div>
                )}

                {!campaignData && !isGeneratingCampaign ? (
                  <div className="text-center py-10 space-y-4">
                    <Sparkles className="w-12 h-12 text-purple-200 mx-auto" />
                    <p className="text-sm text-slate-600">
                      Clique no botão abaixo para gerar roteiros persuasivos de WhatsApp e Instagram baseados no título deste produto.
                    </p>
                    <button
                      onClick={handleGenerateCampaign}
                      className="min-h-11 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-md inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2"
                    >
                      <Sparkles className="w-4 h-4" /> Gerar Campanha Agora
                    </button>
                  </div>
                ) : isGeneratingCampaign ? (
                  <div className="text-center py-12 flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                    <p className="text-sm text-slate-600 font-medium">A Inteligência Artificial está escrevendo sua campanha...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="whitespace-pre-wrap text-sm text-slate-700 bg-slate-50 p-5 rounded-2xl border border-slate-200 font-medium leading-relaxed">
                      {campaignData}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
</>; }
