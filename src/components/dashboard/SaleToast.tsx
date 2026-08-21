'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ShoppingBag, Star, CheckCircle2, XCircle, Megaphone } from 'lucide-react';
import {
  subscribeToNotifications,
  formatRelativeTime,
  NOTIFICATION_META,
  type Notification,
  type NotificationType,
} from '@/lib/notification-service';

interface SaleToastProps {
  storeId: string;
}

interface ToastItem extends Notification {
  dismissAt: number; // timestamp de quando será auto-removido
  progress: number;  // 0–100 (barra de progresso)
}

const TOAST_DURATION_MS = 6000;
const ICON_MAP: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  SALE_CONFIRMED:      ShoppingBag,
  WITHDRAWAL_APPROVED: CheckCircle2,
  WITHDRAWAL_FAILED:   XCircle,
  NEW_REVIEW:          Star,
  AFFILIATE_PENDING:   CheckCircle2, // or import something else, but CheckCircle2 is fine or maybe Link2? CheckCircle2 is already imported
  SYSTEM:              Megaphone,
};

export default function SaleToast({ storeId }: SaleToastProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Atualiza a progress bar a cada 100ms
  useEffect(() => {
    progressIntervalRef.current = setInterval(() => {
      const now = Date.now();
      setToasts(prev => {
        const alive = prev
          .map(t => ({
            ...t,
            progress: Math.max(0, ((t.dismissAt - now) / TOAST_DURATION_MS) * 100),
          }))
          .filter(t => t.dismissAt > now);
        return alive;
      });
    }, 100);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Adicionar novo toast ao receber notificação via Realtime
  const addToast = useCallback((notif: Notification) => {
    // Só mostrar toast para tipos relevantes
    const showFor: NotificationType[] = ['SALE_CONFIRMED', 'WITHDRAWAL_APPROVED', 'WITHDRAWAL_FAILED'];
    if (!showFor.includes(notif.type)) return;

    setToasts(prev => {
      // Limite de 3 toasts simultâneos
      const limited = prev.length >= 3 ? prev.slice(1) : prev;
      return [
        ...limited,
        {
          ...notif,
          dismissAt: Date.now() + TOAST_DURATION_MS,
          progress: 100,
        },
      ];
    });
  }, []);

  // Subscribir ao Realtime
  useEffect(() => {
    if (!storeId) return;
    const unsubscribe = subscribeToNotifications(storeId, addToast);
    return unsubscribe;
  }, [storeId, addToast]);

  // Dispensar manualmente
  const dismiss = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-label="Notificações de vendas"
    >
      {toasts.map((toast) => {
        const meta = NOTIFICATION_META[toast.type];
        const Icon = ICON_MAP[toast.type];
        const formattedAmount = toast.metadata?.amount
          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(toast.metadata.amount)
          : null;

        return (
          <div
            key={toast.id}
            className="pointer-events-auto w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden"
            style={{
              animation: 'slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Progress bar no topo */}
            <div className="h-1 bg-slate-100 relative overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-400 to-blue-500 transition-none"
                style={{ width: `${toast.progress}%`, transition: 'width 0.1s linear' }}
              />
            </div>

            <div className="flex items-start gap-3 p-4">
              {/* Ícone */}
              <div className={`w-10 h-10 rounded-xl ${meta.bgColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <Icon className={`w-5 h-5 ${meta.color}`} />
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-0.5">
                      {meta.emoji} {meta.label}
                    </p>
                    <p className="text-sm font-bold text-slate-900 leading-tight">{toast.title}</p>
                  </div>
                  <button
                    onClick={() => dismiss(toast.id)}
                    className="p-1 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-all flex-shrink-0"
                    aria-label="Dispensar notificação"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{toast.body}</p>

                {/* Valor da venda em destaque */}
                {formattedAmount && (
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-extrabold px-3 py-1.5 rounded-xl">
                    <ShoppingBag className="w-4 h-4 text-emerald-600" />
                    {formattedAmount}
                    {toast.metadata?.productTitle && (
                      <span className="text-emerald-600 font-medium text-xs truncate max-w-[120px]">
                        — {toast.metadata.productTitle}
                      </span>
                    )}
                  </div>
                )}

                <p className="text-[10px] text-slate-400 mt-1.5">
                  {formatRelativeTime(toast.createdAt)}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Animação keyframe via style tag inline */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%) scale(0.95); opacity: 0; }
          to   { transform: translateX(0) scale(1);      opacity: 1; }
        }
      `}</style>
    </div>
  );
}
