'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, CheckCheck, ShoppingBag, X, TrendingUp } from 'lucide-react';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  subscribeToNotifications,
  formatRelativeTime,
  NOTIFICATION_META,
  type Notification,
} from '@/lib/notification-service';

interface NotificationCenterProps {
  storeId: string;
}

export default function NotificationCenter({ storeId }: NotificationCenterProps) {
  const [open, setOpen]               = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading]         = useState(false);
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(false);
  const dropdownRef                   = useRef<HTMLDivElement>(null);
  const bellRef                       = useRef<HTMLButtonElement>(null);

  // ── Carregar notificações ──────────────────────────────────────────────────
  const loadNotifications = useCallback(async (pageNum = 1, append = false) => {
    if (!storeId) return;
    setLoading(true);
    try {
      const result = await getNotifications(storeId, { page: pageNum, pageSize: 15 });
      setNotifications(prev => append ? [...prev, ...result.data] : result.data);
      setUnreadCount(result.unreadCount);
      setHasMore(result.hasMore);
      setPage(pageNum);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  // ── Carregar na montagem ───────────────────────────────────────────────────
  useEffect(() => {
    if (storeId) {
      loadNotifications(1);
    }
  }, [storeId, loadNotifications]);

  // ── Supabase Realtime — escutar novas notificações ─────────────────────────
  useEffect(() => {
    if (!storeId) return;

    const unsubscribe = subscribeToNotifications(storeId, (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Pulsar o sino brevemente
      if (bellRef.current) {
        bellRef.current.classList.add('animate-bounce');
        setTimeout(() => bellRef.current?.classList.remove('animate-bounce'), 1000);
      }
    });

    return unsubscribe;
  }, [storeId]);

  // ── Fechar ao clicar fora ──────────────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  // ── Marcar uma como lida ───────────────────────────────────────────────────
  const handleMarkRead = async (notif: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (notif.isRead) return;
    await markAsRead(notif.id);
    setNotifications(prev =>
      prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // ── Marcar todas como lidas ────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    await markAllAsRead(storeId);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  // ── Carregar mais ──────────────────────────────────────────────────────────
  const handleLoadMore = () => loadNotifications(page + 1, true);

  // ── Abrir/fechar dropdown ──────────────────────────────────────────────────
  const toggleOpen = () => {
    setOpen(prev => {
      if (!prev) loadNotifications(1); // refresh ao abrir
      return !prev;
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Botão de sino ── */}
      <button
        ref={bellRef}
        onClick={toggleOpen}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        title="Notificações"
        aria-label={`${unreadCount} notificações não lidas`}
      >
        <Bell className="w-5 h-5" />

        {/* Badge de contagem */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-extrabold leading-none px-1 shadow-md ring-2 ring-white animate-in zoom-in-50 duration-200">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/80 z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-bold text-slate-900">Notificações</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-extrabold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  {unreadCount} novas
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded-lg transition-all flex items-center gap-1"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Todas lidas
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-sm">Carregando...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                <TrendingUp className="w-8 h-8 opacity-40" />
                <p className="text-sm font-medium">Nenhuma notificação ainda</p>
                <p className="text-xs text-slate-400">As vendas aparecerão aqui em tempo real!</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const meta = NOTIFICATION_META[notif.type];
                return (
                  <div
                    key={notif.id}
                    onClick={(e) => handleMarkRead(notif, e)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-all duration-150 ${
                      notif.isRead
                        ? 'hover:bg-slate-50'
                        : 'bg-blue-50/40 hover:bg-blue-50/70'
                    }`}
                  >
                    {/* Ícone */}
                    <div className={`w-9 h-9 rounded-xl ${meta.bgColor} flex items-center justify-center text-lg flex-shrink-0 mt-0.5`}>
                      {meta.emoji}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-bold leading-tight truncate ${notif.isRead ? 'text-slate-600' : 'text-slate-900'}`}>
                          {notif.title}
                        </p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {formatRelativeTime(notif.createdAt)}
                          </span>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                        {notif.body}
                      </p>
                      {notif.metadata?.amount && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md mt-1">
                          <ShoppingBag className="w-3 h-3" />
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(notif.metadata.amount)}
                        </span>
                      )}
                    </div>

                    {/* Ação de marcar lida */}
                    {!notif.isRead && (
                      <button
                        onClick={(e) => handleMarkRead(notif, e)}
                        className="p-1 rounded-lg text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-all flex-shrink-0 mt-0.5"
                        title="Marcar como lida"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Carregar mais */}
          {hasMore && (
            <div className="px-4 py-3 border-t border-slate-100">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="w-full text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 py-2 rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? 'Carregando...' : 'Ver mais notificações'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
