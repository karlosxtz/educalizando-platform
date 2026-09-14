'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  CheckCircle2, ShieldCheck, ArrowRight, Loader2, AlertCircle, BookOpen
} from 'lucide-react';
import { Store } from '@/lib/types';
import { OrderRecord } from '@/lib/order-service';

interface OrderSuccessClientViewProps {
  store: Store;
  orderId: string;
  initialOrder: OrderRecord | null;
}

export default function OrderSuccessClientView({ store, orderId, initialOrder }: OrderSuccessClientViewProps) {
  const [status, setStatus] = useState<string>(initialOrder?.status || 'pending');
  const searchParams = useSearchParams();

  const primaryColor = store.cor_primaria || '#093b6c';

  // Polling em tempo real a cada 3 segundos enquanto estiver pendente
  useEffect(() => {
    let intervalId: any = null;

    async function checkStatus() {
      try {
        const params = new URLSearchParams({ orderId });
        const transactionNsu = searchParams.get('transaction_nsu');
        const slug = searchParams.get('slug');
        if (transactionNsu) params.set('transaction_nsu', transactionNsu);
        if (slug) params.set('slug', slug);
        const res = await fetch(`/api/checkout/status?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setStatus(data.status);
            if (data.status === 'paid' && intervalId) {
              clearInterval(intervalId);
            }
          }
        }
      } catch (err) {
        console.error('Erro ao verificar status do pedido:', err);
      }
    }

    if (status === 'pending') {
      checkStatus();
      intervalId = setInterval(checkStatus, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [orderId, searchParams, status]);

  return (
    <div 
      className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white"
      style={{ '--store-primary': primaryColor } as React.CSSProperties}
    >
      {/* Top Security Bar */}
      <div className="bg-slate-900 text-white py-2 px-4 text-center text-xs font-medium flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>Ambiente Seguro Educalizando • Pedido #{orderId.substring(4, 10).toUpperCase()}</span>
      </div>

      <header className="bg-white border-b border-slate-200 py-4 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href={`/loja/${store.slug}`} className="text-xs font-bold text-slate-600 hover:text-blue-600">
            Voltar para {store.nome_loja}
          </Link>
          <span className="font-black text-sm text-slate-900 tracking-tight">{store.nome_loja}</span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10">
        
        {/* State A: PAGAMENTO PAGO / CONFIRMADO */}
        {status === 'paid' ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-6 shadow-xl">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-50 shadow-md">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold uppercase">
                Pagamento Aprovado
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Parabéns! Sua compra foi confirmada!
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto">
                O seu acesso ao material didático digital já foi liberado automaticamente na sua Área do Aluno.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl max-w-md mx-auto text-xs text-slate-700 space-y-1">
              <div className="font-bold text-slate-900">Pedido #{orderId.substring(4, 10).toUpperCase()}</div>
              <div>E-mail de confirmação enviado para o comprador.</div>
            </div>

            <div className="pt-4">
              <Link
                href="/aluno/dashboard"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-brand-navy hover:bg-brand-navy/90 text-white font-black text-sm shadow-xl shadow-brand-navy/20 inline-flex items-center justify-center gap-2 transition-all"
              >
                <BookOpen className="w-5 h-5 text-brand-teal" />
                <span>Acessar Meus Materiais na Área do Aluno</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : status === 'failed' ? (
          /* State B: FALHA / EXPIRADO */
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-6 shadow-xl">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto border-4 border-rose-50">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900">O pagamento não foi confirmado</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                A cobrança expirou ou foi recusada. Você pode tentar realizar um novo pagamento.
              </p>
            </div>
            <Link
              href={`/loja/${store.slug}`}
              className="px-6 py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs inline-block"
            >
              Voltar para a Loja
            </Link>
          </div>
        ) : (
          /* State C: confirmação ainda em processamento */
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xl space-y-6 text-center">
            
            {/* Status Pulse Header */}
            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-900 border border-amber-200 px-4 py-2 rounded-full text-xs font-bold">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
              <span>Confirmando seu pagamento na InfinitePay...</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900">Pagamento em processamento</h1>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Aguarde alguns instantes enquanto confirmamos a transação. O acesso será liberado automaticamente após a confirmação.
              </p>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
