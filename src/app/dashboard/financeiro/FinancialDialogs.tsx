'use client';
import { AlertCircle,ArrowUpRight,CheckCircle2,Loader2,X } from 'lucide-react';
import Link from 'next/link';

// O estado permanece na página para preservar a atualização do extrato.
export default function FinancialDialogs(state: any) {
  const { showWithdrawModal, setShowWithdrawModal, withdrawTriggerRef, withdrawError, withdrawSuccess, handleExecuteWithdrawal, summary, activePixKey, withdrawAmountInput, setWithdrawAmountInput, minimumWithdrawalAmount, withdrawalFee, withdrawSubmitting, selectedTx, setSelectedTx, selectedWithdrawal, setSelectedWithdrawal, formatCurrency } = state;
  return <>
      {/* MODAL 1: Solicitar Saque PIX (Item 10, 11, 12, 13 & 16) */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4" role="presentation">
          <div className="max-h-[calc(100vh-1.5rem)] overflow-y-auto bg-white rounded-3xl border border-slate-200 max-w-md w-full p-5 sm:p-8 shadow-2xl space-y-5" role="dialog" aria-modal="true" aria-labelledby="withdraw-modal-title">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block">
                  Solicitação de Saque PIX
                </span>
                <h3 id="withdraw-modal-title" className="text-lg font-black text-slate-900">Solicitar Saque</h3>
              </div>
              <button onClick={() => { setShowWithdrawModal(false); window.requestAnimationFrame(() => withdrawTriggerRef.current?.focus()); }} aria-label="Fechar solicitação de saque" className="min-h-11 min-w-11 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {withdrawError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl text-xs flex items-center gap-2 font-bold" role="alert">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{withdrawError}</span>
              </div>
            )}

            {withdrawSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs flex items-center gap-2 font-bold" role="status" aria-live="polite">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{withdrawSuccess}</span>
              </div>
            )}

            <form onSubmit={handleExecuteWithdrawal} className="space-y-4 text-xs font-sans">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Saldo Disponível:</span>
                  <strong className="text-slate-900 font-mono text-sm">{formatCurrency(summary.saldoDisponivel)}</strong>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Chave PIX (CPF):</span>
                  <strong className="text-slate-900 font-mono">
                    {activePixKey ? activePixKey.pixKeyMasked : 'Nenhuma chave cadastrada'}
                  </strong>
                </div>

                {activePixKey && (
                  <div className="flex justify-between text-slate-600">
                    <span>Titular Confirmado:</span>
                    <strong className="text-slate-900">{activePixKey.holderName}</strong>
                  </div>
                )}
              </div>

              {!activePixKey ? (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl space-y-2">
                  <p className="font-bold">Chave PIX não cadastrada!</p>
                  <p className="text-[11px]">Você precisa cadastrar e validar sua chave PIX CPF em Configurações da Conta antes de solicitar um saque.</p>
                  <Link
                    href="/dashboard/conta"
                    className="inline-block mt-2 px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-[11px]"
                  >
                    Cadastrar Chave PIX Agora
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Valor do Saque (R$) *
                    </label>
                    <input
                      type="text"
                      value={withdrawAmountInput}
                      onChange={(e) => setWithdrawAmountInput(e.target.value)}
                      placeholder="0.00"
                      className="min-h-12 w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-600 rounded-xl text-slate-900 text-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                    <span className="text-[10px] text-slate-500 block font-medium">
                      Valor mínimo: {formatCurrency(minimumWithdrawalAmount)}. {withdrawalFee > 0 ? `Taxa de saque: ${formatCurrency(withdrawalFee)}. Reserva total: ${formatCurrency(Math.max(0, Number(withdrawAmountInput.replace(',', '.')) || 0) + withdrawalFee)}.` : 'Sem taxa adicional de saque.'}
                    </span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={withdrawSubmitting || summary.saldoDisponivel < minimumWithdrawalAmount}
                      className="min-h-12 w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                    >
                      {withdrawSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Enviando solicitação...</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-4 h-4" />
                          <span>Solicitar Saque PIX</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Detalhes da Venda no Extrato */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-navy block">
                  Detalhamento da Venda
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {selectedTx.orderId ? `Pedido #${selectedTx.orderId.substring(4, 10).toUpperCase()}` : 'Lançamento Financeiro'}
                </h3>
              </div>
              <button onClick={() => setSelectedTx(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Produto:</span>
                  <strong className="text-slate-900">{selectedTx.productTitle || 'Infoproduto Digital'}</strong>
                </div>
                {selectedTx.buyerName && (
                  <div className="flex justify-between text-slate-600">
                    <span>Comprador:</span>
                    <strong className="text-slate-900">{selectedTx.buyerName}</strong>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Data da Transação:</span>
                  <strong className="text-slate-900">{new Date(selectedTx.createdAt).toLocaleString('pt-BR')}</strong>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-slate-700 font-bold">
                  <span>Valor Bruto da Venda:</span>
                  <span className="font-mono text-sm">{formatCurrency(selectedTx.grossAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-500 pl-3 border-l-2 border-slate-200">
                  <span>Taxa fixa Educalizando (não aplicada):</span>
                  <span className="font-mono">- {formatCurrency(selectedTx.platformFixedFeeAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-500 pl-3 border-l-2 border-slate-200">
                  <span>Taxa Educalizando (conforme o meio de pagamento):</span>
                  <span className="font-mono">- {formatCurrency(selectedTx.platformPercentageFeeAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-700 font-bold pl-3 border-l-2 border-slate-300">
                  <span>Total Taxas Educalizando:</span>
                  <span className="font-mono text-rose-600">- {formatCurrency(selectedTx.platformFeeAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-700 font-bold pl-3 border-l-2 border-slate-300">
                  <span>Taxa do meio de pagamento:</span>
                  <span className="font-mono text-rose-600">- {formatCurrency(selectedTx.asaasFeeAmount)}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 text-base pt-3 border-t border-slate-200">
                  <span>Valor Líquido do Criador:</span>
                  <span className="font-mono text-emerald-600">{formatCurrency(selectedTx.netAmount)}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedTx(null)}
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Detalhes do Saque (Item 27 da Especificação) */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block">
                  Detalhes da Transferência PIX
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Saque #{selectedWithdrawal.id.substring(4, 10).toUpperCase()}
                </h3>
              </div>
              <button onClick={() => setSelectedWithdrawal(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Valor do Saque:</span>
                  <strong className="text-slate-900 font-mono text-sm">{formatCurrency(selectedWithdrawal.amount)}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Chave PIX:</span>
                  <strong className="text-slate-900 font-mono">{selectedWithdrawal.pixKeyMasked}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Solicitado em:</span>
                  <strong className="text-slate-900">{new Date(selectedWithdrawal.requestedAt).toLocaleString('pt-BR')}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Status:</span>
                  <strong className="text-emerald-700">{selectedWithdrawal.status}</strong>
                </div>
                {(selectedWithdrawal.paymentReference || selectedWithdrawal.asaasTransferId) && (
                  <div className="flex justify-between text-slate-600">
                    <span>Referência da transferência:</span>
                    <strong className="text-slate-900 font-mono">{selectedWithdrawal.paymentReference || selectedWithdrawal.asaasTransferId}</strong>
                  </div>
                )}
                {selectedWithdrawal.failureReason && (
                  <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-[11px] font-medium mt-2">
                    Motivo da falha: {selectedWithdrawal.failureReason}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedWithdrawal(null)}
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}


  </>;
}
