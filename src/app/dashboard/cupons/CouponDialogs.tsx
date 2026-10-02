'use client';
import { CouponDiscountType,Kit,Product } from '@/lib/types';
import { AnimatePresence,motion } from 'framer-motion';
import { AlertCircle,Boxes,CheckCircle2,Loader2,Package,Sparkles,Ticket,Trash2,X } from 'lucide-react';

// O formulário compartilha o estado controlado da página; o contrato é mantido
// em um único objeto para que a listagem não volte a concentrar os diálogos.
export default function CouponDialogs(state: any) {
  const { isModalOpen, editingCoupon, setIsModalOpen, formError, handleSaveCoupon, codigo, setCodigo, generateRandomCode, tipoDesconto, setTipoDesconto, valorDesconto, setValorDesconto, dataInicio, setDataInicio, hasExpiration, setHasExpiration, dataExpiracao, setDataExpiracao, hasUsageLimit, setHasUsageLimit, limiteDeUsos, setLimiteDeUsos, scopeType, setScopeType, products, selectedProductIds, setSelectedProductIds, kits, selectedKitIds, setSelectedKitIds, saving, deleteConfirmationId, setDeleteConfirmationId, handleDeleteConfirmed } = state;
  return <>
      {/* CREATE / EDIT COUPON MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-navy text-white flex items-center justify-center font-bold">
                    <Ticket className="w-5 h-5 text-brand-teal" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      {editingCoupon ? 'Editar Cupom de Desconto' : 'Criar Novo Cupom de Desconto'}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Configure as regras de desconto e escopo de utilização.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveCoupon} className="space-y-5">

                {/* Coupon Code Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                    Código do Cupom *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                      placeholder="Ex: PROMO10, BEMVINDO20"
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 font-mono text-sm font-black focus:outline-none uppercase"
                    />
                    <button
                      type="button"
                      onClick={generateRandomCode}
                      className="px-3.5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors flex-shrink-0 min-h-[44px]"
                    >
                      <Sparkles className="w-4 h-4 text-brand-teal" />
                      <span>Gerar Código</span>
                    </button>
                  </div>
                </div>

                {/* Discount Type & Value */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                      Tipo de Desconto *
                    </label>
                    <select
                      value={tipoDesconto}
                      onChange={(e) => setTipoDesconto(e.target.value as CouponDiscountType)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 text-xs font-bold focus:outline-none min-h-[44px]"
                    >
                      <option value="percentual">Percentual (%)</option>
                      <option value="valor_fixo">Valor Fixo (R$)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                      Valor do Desconto *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={tipoDesconto === 'percentual' ? '100' : undefined}
                        value={valorDesconto}
                        onChange={(e) => setValorDesconto(parseFloat(e.target.value) || 0)}
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 font-black text-sm focus:outline-none min-h-[44px]"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                        {tipoDesconto === 'percentual' ? '%' : 'R$'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Start Date & Expiration */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                      Data de Início
                    </label>
                    <input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 text-xs font-bold focus:outline-none min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                        Data de Expiração
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-500 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasExpiration}
                          onChange={(e) => setHasExpiration(e.target.checked)}
                          className="rounded border-slate-300 text-brand-navy focus:ring-brand-navy"
                        />
                        <span>Definir validade</span>
                      </label>
                    </div>

                    {hasExpiration ? (
                      <input
                        type="date"
                        value={dataExpiracao}
                        onChange={(e) => setDataExpiracao(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 text-xs font-bold focus:outline-none min-h-[44px]"
                      />
                    ) : (
                      <div className="w-full px-4 py-3 bg-slate-100 rounded-xl text-slate-400 text-xs font-bold border border-slate-200">
                        Sem Expiração (Validade Vitalícia)
                      </div>
                    )}
                  </div>
                </div>

                {/* Usage Limit */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Limite Máximo de Usos
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-500 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasUsageLimit}
                        onChange={(e) => setHasUsageLimit(e.target.checked)}
                        className="rounded border-slate-300 text-brand-navy focus:ring-brand-navy"
                      />
                      <span>Limitar utilizações</span>
                    </label>
                  </div>

                  {hasUsageLimit ? (
                    <input
                      type="number"
                      min="1"
                      value={limiteDeUsos}
                      onChange={(e) => setLimiteDeUsos(parseInt(e.target.value) || 1)}
                      placeholder="Ex: 50 utilizações"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-navy rounded-xl text-slate-900 text-xs font-bold focus:outline-none min-h-[44px]"
                    />
                  ) : (
                    <div className="w-full px-4 py-3 bg-slate-100 rounded-xl text-slate-400 text-xs font-bold border border-slate-200">
                      Uso Ilimitado por Clientes
                    </div>
                  )}
                </div>

                {/* Scope Selection */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                    Escopo de Aplicação do Cupom
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setScopeType('all')}
                      className={`p-3 rounded-2xl border text-left font-bold text-xs transition-all ${
                        scopeType === 'all'
                          ? 'bg-brand-navy/10 border-brand-navy text-brand-navy shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="block font-black text-sm">Toda a Loja</span>
                      <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                        Vale para todos os produtos e kits
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setScopeType('specific')}
                      className={`p-3 rounded-2xl border text-left font-bold text-xs transition-all ${
                        scopeType === 'specific'
                          ? 'bg-brand-navy/10 border-brand-navy text-brand-navy shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="block font-black text-sm">Itens Específicos</span>
                      <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                        Selecione produtos/kits da lista
                      </span>
                    </button>
                  </div>

                  {scopeType === 'specific' && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4 max-h-48 overflow-y-auto">
                      {products.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                            <Package className="w-3.5 h-3.5" /> Produtos:
                          </span>
                          {products.map((p: Product) => {
                            const checked = selectedProductIds.includes(p.id);
                            return (
                              <label key={p.id} className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedProductIds([...selectedProductIds, p.id]);
                                    } else {
                                      setSelectedProductIds(selectedProductIds.filter((id: string) => id !== p.id));
                                    }
                                  }}
                                  className="rounded border-slate-300 text-brand-navy focus:ring-brand-navy"
                                />
                                <span className="truncate">{p.titulo} — R$ {p.preco.toFixed(2).replace('.', ',')}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {kits.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-200">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                            <Boxes className="w-3.5 h-3.5" /> Kits Promocionais:
                          </span>
                          {kits.map((k: Kit) => {
                            const checked = selectedKitIds.includes(k.id);
                            return (
                              <label key={k.id} className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedKitIds([...selectedKitIds, k.id]);
                                    } else {
                                      setSelectedKitIds(selectedKitIds.filter((id: string) => id !== k.id));
                                    }
                                  }}
                                  className="rounded border-slate-300 text-brand-navy focus:ring-brand-navy"
                                />
                                <span className="truncate">{k.titulo} — R$ {k.preco_kit.toFixed(2).replace('.', ',')}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 min-h-[44px]"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl font-extrabold text-xs bg-brand-navy hover:bg-brand-navy-hover text-white shadow-md flex items-center gap-2 disabled:opacity-50 min-h-[44px]"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-brand-teal" />}
                    <span>{saving ? 'Salvando...' : editingCoupon ? 'Salvar Alterações' : 'Criar Cupom'}</span>
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION DIALOG */}
      <AnimatePresence>
        {deleteConfirmationId && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 w-full max-w-sm p-6 space-y-4 shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Excluir Cupom de Desconto?</h3>
              <p className="text-xs text-slate-500 font-medium">
                Esta ação removerá o código promocional e ele deixará de funcionar na sua loja.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmationId(null)}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirmed}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-rose-600 text-white hover:bg-rose-700 shadow-sm min-h-[44px]"
                >
                  Sim, Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


  </>;
}
