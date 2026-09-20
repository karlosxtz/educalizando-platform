'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, CheckCircle2, Clock, XCircle, ArrowRight, QrCode, Loader2 } from 'lucide-react';
import { RecentOrder } from '@/lib/types';
import { getRecentOrdersFeed } from '@/lib/sales-service';

interface RecentSalesFeedProps {
  storeId?: string;
}

export default function RecentSalesFeed({ storeId }: RecentSalesFeedProps) {
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      try {
        const res = await getRecentOrdersFeed(storeId || '');
        setOrders(res);
      } catch (err) {
        console.error('Erro ao carregar feed de pedidos:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [storeId]);

  const getStatusBadge = (status: RecentOrder['statusPagamento']) => {
    switch (status) {
      case 'pago':
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PIX Confirmado
          </span>
        );
      case 'pendente_pix':
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600 animate-pulse" /> Aguardando PIX
          </span>
        );
      case 'expirado':
        return (
          <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1">
            <XCircle className="w-3 h-3 text-slate-400" /> Expirado
          </span>
        );
    }
  };

  return (
    <div className="min-w-0 overflow-hidden bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 mb-0.5">
            <QrCode className="w-4 h-4" /> Vendas & Entregas PIX
          </span>
          <h3 className="text-lg font-bold text-slate-900">Feed de Pedidos Recentes</h3>
        </div>

        <Link
          href="/dashboard/pedidos"
          aria-label="Ver histórico completo de pedidos"
          className="shrink-0 rounded-lg p-2 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 sm:flex sm:items-center sm:gap-1 sm:p-0"
        >
          <span className="hidden sm:inline">Ver Histórico Completo</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center text-slate-400">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs font-medium">
          Nenhuma transação efetuada recentemente.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {orders.map((ord) => (
            <div key={ord.id} className="min-w-0 py-3.5 first:pt-0 last:pb-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs truncate">
                      {ord.clienteNome}
                    </span>
                    <span className="hidden min-w-0 truncate text-[10px] text-slate-400 font-mono sm:inline">
                      ({ord.id})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate font-medium mt-0.5">
                    {ord.produtoTitulo}
                  </p>
                  <span className="block truncate text-[10px] text-slate-400 mt-0.5">
                    {ord.dataCompra} • {ord.clienteEmail}
                  </span>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2 pl-11 sm:pl-0 sm:mt-0 sm:justify-end sm:text-right sm:space-y-1">
                <span className="text-xs font-black text-slate-900 block">
                  R$ {ord.valorTotal.toFixed(2).replace('.', ',')}
                </span>
                <div>{getStatusBadge(ord.statusPagamento)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
