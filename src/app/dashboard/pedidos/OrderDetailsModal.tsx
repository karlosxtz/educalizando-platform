'use client';
import { DashboardOrder } from '@/lib/dashboard-order-service';
import { Check, Clock, ShoppingCart, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

function formatCurrency(val: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val); }
function formatDate(isoDate: string, includeTime = false) {
  if (!isoDate) return '-';
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
  if (includeTime) { opts.hour = '2-digit'; opts.minute = '2-digit'; }
  return new Date(isoDate).toLocaleDateString('pt-BR', opts);
}
function getOrderStatus(status: string) {
  const value = (status || '').toLowerCase();
  if (['paid', 'pago', 'liberado', 'aprovado', 'concluido'].includes(value)) return { label: 'Pago', className: 'bg-emerald-100 text-emerald-800', icon: Check };
  if (value === 'pending') return { label: 'Pendente', className: 'bg-amber-100 text-amber-800', icon: Clock };
  return { label: status || 'Não informado', className: 'bg-slate-100 text-slate-700', icon: X };
}

// Order Details Modal Component
export default function OrderDetailsModal({ order, onClose }: { order: DashboardOrder; onClose: () => void }) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  if (!order) return null;

  const status = getOrderStatus(order.status);
  const StatusIcon = status.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm" role="presentation">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[calc(100vh-1.5rem)] sm:max-h-[90vh] flex flex-col font-sans" role="dialog" aria-modal="true" aria-labelledby="order-details-title">

        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50">
          <h3 id="order-details-title" className="min-w-0 text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <span className="truncate">Detalhes do pedido</span>
          </h3>
          <button ref={closeButtonRef} onClick={onClose} aria-label="Fechar detalhes do pedido" className="min-h-11 min-w-11 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 sm:space-y-8">
          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dados do Cliente</h4>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="font-bold text-slate-900">{order.buyer_name}</p>
                <p className="text-sm text-slate-600">{order.buyer_email}</p>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status & Pagamento</h4>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-1 min-[380px]:grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Status</span>
                  <span className={`inline-flex w-fit items-center gap-1 rounded-md px-2 py-1 text-xs font-bold ${status.className}`}>
                    <StatusIcon className="h-3.5 w-3.5" /> {status.label}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Método</span>
                  <span className="font-bold text-slate-900 capitalize">
                    {order.payment_method === 'credit_card' ? 'Cartão' : order.payment_method}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Data</span>
                  <span className="text-sm font-medium text-slate-700">{formatDate(order.created_at, true)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Itens Comprados</h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="divide-y divide-slate-100 sm:hidden">
                {order.items?.map((item, idx) => (
                  <div key={item.id || idx} className="space-y-2 p-4">
                    <p className="font-semibold text-slate-900 break-words">{item.product_title || 'Produto sem título'}</p>
                    <div className="flex items-center justify-between gap-3 text-xs text-slate-600"><span>Quantidade: {item.quantity}</span><strong className="text-slate-900">{formatCurrency(item.total_price)}</strong></div>
                  </div>
                ))}
                {(!order.items || order.items.length === 0) && <p className="px-4 py-6 text-center text-sm text-slate-500">Nenhum item detalhado encontrado.</p>}
              </div>
              <table className="hidden w-full text-left text-sm sm:table">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-bold text-slate-700">Produto</th>
                    <th className="px-4 py-3 font-bold text-slate-700 text-center">Qtd</th>
                    <th className="px-4 py-3 font-bold text-slate-700 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items && order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900">{item.product_title || 'Produto sem título'}</td>
                      <td className="px-4 py-3 text-slate-600 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 font-bold text-slate-900 text-right">{formatCurrency(item.total_price)}</td>
                    </tr>
                  ))}
                  {(!order.items || order.items.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                        Nenhum item detalhado encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financials */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detalhamento Financeiro</h4>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <div className="flex flex-wrap justify-between gap-2 items-center text-sm">
                <span className="text-slate-600">Valor Bruto do Pedido</span>
                <span className="font-bold text-slate-900">{formatCurrency(order.total_amount)}</span>
              </div>
              <div className="flex flex-wrap justify-between gap-2 items-center text-sm">
                <span className="text-slate-600">Taxa da Plataforma</span>
                <span className="font-bold text-rose-600">-{formatCurrency(order.platform_fee_amount)}</span>
              </div>
              <div className="flex flex-wrap justify-between gap-2 items-center text-sm">
                <span className="text-slate-600">Taxa do meio de pagamento</span>
                <span className="font-bold text-rose-600">-{formatCurrency(order.asaas_fee_amount)}</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex flex-wrap justify-between gap-2 items-center">
                <span className="font-bold text-slate-900">Líquido do Criador</span>
                <span className="text-lg font-black text-emerald-600">{formatCurrency(order.creator_net_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="min-h-11 w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
