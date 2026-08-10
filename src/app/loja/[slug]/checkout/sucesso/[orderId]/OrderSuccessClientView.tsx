'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, QrCode, Copy, Check, ShieldCheck, 
  ArrowRight, Loader2, RefreshCw, AlertCircle, Sparkles, BookOpen 
} from 'lucide-react';
import { Store } from '@/lib/types';
import { OrderRecord } from '@/lib/order-service';

interface OrderSuccessClientViewProps {
  store: Store;
  orderId: string;
  initialOrder: OrderRecord | null;
}

export default function OrderSuccessClientView({ store, orderId, initialOrder }: OrderSuccessClientViewProps) {
  const [order, setOrder] = useState<OrderRecord | null>(initialOrder);
  const [status, setStatus] = useState<string>(initialOrder?.status || 'pending');
  const [pixCopyPaste, setPixCopyPaste] = useState<string | null>(initialOrder?.pixCopyPaste || null);
  const [pixQrCode, setPixQrCode] = useState<string | null>(initialOrder?.pixQrCodeBase64 || null);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  const primaryColor = store.cor_primaria || '#093b6c';

  // Polling em tempo real a cada 3 segundos enquanto estiver pendente
  useEffect(() => {
    let intervalId: any = null;

    async function checkStatus() {
      setChecking(true);
      try {
        const res = await fetch(`/api/checkout/status?orderId=${orderId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setStatus(data.status);
            if (data.pixCopyPaste) setPixCopyPaste(data.pixCopyPaste);
            if (data.pixQrCodeBase64) setPixQrCode(data.pixQrCodeBase64);

            if (data.status === 'paid' && intervalId) {
              clearInterval(intervalId);
            }
          }
        }
      } catch (err) {
        console.error('Erro ao verificar status do pedido:', err);
      } finally {
        setChecking(false);
      }
    }

    if (status === 'pending') {
      checkStatus();
      intervalId = setInterval(checkStatus, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [orderId, status]);

  const handleCopyPix = () => {
    if (!pixCopyPaste) return;
    navigator.clipboard.writeText(pixCopyPaste);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

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
          /* State C: AGUARDANDO PAGAMENTO (PIX QR Code & Copia e Cola) */
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xl space-y-6 text-center">
            
            {/* Status Pulse Header */}
            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-900 border border-amber-200 px-4 py-2 rounded-full text-xs font-bold">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
              <span>Aguardando confirmação do PIX... (Verificando em tempo real)</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900">Finalize o Pagamento via PIX</h1>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Abra o aplicativo do seu banco, escolha a opção PIX e escaneie o QR Code abaixo ou copie o código.
              </p>
            </div>

            {/* QR Code Container */}
            {pixQrCode ? (
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 max-w-xs mx-auto space-y-3 shadow-inner">
                <img
                  src={pixQrCode}
                  alt="QR Code PIX Asaas"
                  className="w-56 h-56 mx-auto object-contain bg-white p-2 rounded-2xl border border-slate-200 shadow-xs"
                />
                <span className="text-[11px] text-slate-500 font-medium block">
                  Escaneie com a câmera do app do banco
                </span>
              </div>
            ) : (
              <div className="w-56 h-56 bg-slate-100 rounded-2xl mx-auto flex items-center justify-center text-slate-400">
                <QrCode className="w-12 h-12" />
              </div>
            )}

            {/* Copy & Paste Code */}
            {pixCopyPaste && (
              <div className="max-w-md mx-auto space-y-2">
                <label className="text-xs font-bold uppercase text-slate-700 block">
                  Código PIX (Copia e Cola)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pixCopyPaste}
                    className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 truncate"
                  />
                  <button
                    onClick={handleCopyPix}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                      copied 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-brand-navy hover:bg-brand-navy/90 text-white shadow-md'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-brand-teal" />
                        <span>Copiar PIX</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Manual Status Check Button */}
            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => setStatus('pending')}
                disabled={checking}
                className="text-xs font-bold text-slate-600 hover:text-brand-navy inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
                <span>Já fiz o pagamento (Checar Agora)</span>
              </button>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
