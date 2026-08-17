import { supabase, supabaseAdmin, isRealSupabaseConfigured } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// =============================================================================
// EDUCALIZANDO — NOTIFICATION SERVICE
// Notificações em tempo real via Supabase Realtime (Postgres Changes)
// =============================================================================

export type NotificationType =
  | 'SALE_CONFIRMED'
  | 'WITHDRAWAL_APPROVED'
  | 'WITHDRAWAL_FAILED'
  | 'NEW_REVIEW'
  | 'SYSTEM';

export interface Notification {
  id: string;
  storeId: string;
  creatorId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata: {
    orderId?: string;
    amount?: number;
    productTitle?: string;
    buyerName?: string;
    withdrawalId?: string;
    reviewId?: string;
    productId?: string;
    [key: string]: unknown;
  };
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsPage {
  data: Notification[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

// Ícones e cores por tipo (usados nos componentes)
export const NOTIFICATION_META: Record<NotificationType, {
  emoji: string;
  color: string;
  bgColor: string;
  label: string;
}> = {
  SALE_CONFIRMED:      { emoji: '💰', color: 'text-emerald-700', bgColor: 'bg-emerald-50', label: 'Nova Venda' },
  WITHDRAWAL_APPROVED: { emoji: '✅', color: 'text-blue-700',    bgColor: 'bg-blue-50',    label: 'Saque Aprovado' },
  WITHDRAWAL_FAILED:   { emoji: '❌', color: 'text-red-700',     bgColor: 'bg-red-50',     label: 'Saque Recusado' },
  NEW_REVIEW:          { emoji: '⭐', color: 'text-yellow-700',  bgColor: 'bg-yellow-50',  label: 'Nova Avaliação' },
  SYSTEM:              { emoji: '📢', color: 'text-slate-700',   bgColor: 'bg-slate-50',   label: 'Aviso do Sistema' },
};

// =============================================================================
// MAPEAMENTO DB → INTERFACE
// =============================================================================
function mapRow(row: Record<string, unknown>): Notification {
  return {
    id:        String(row.id),
    storeId:   String(row.store_id),
    creatorId: String(row.creator_id),
    type:      row.type as NotificationType,
    title:     String(row.title),
    body:      String(row.body),
    metadata:  (row.metadata as Notification['metadata']) || {},
    isRead:    Boolean(row.is_read),
    createdAt: String(row.created_at),
  };
}

// =============================================================================
// 1. BUSCAR NOTIFICAÇÕES (com paginação)
// =============================================================================
export async function getNotifications(
  storeId: string,
  options: { page?: number; pageSize?: number; unreadOnly?: boolean } = {}
): Promise<NotificationsPage> {
  const page     = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(50, options.pageSize ?? 20);
  const from     = (page - 1) * pageSize;
  const to       = from + pageSize - 1;

  const empty: NotificationsPage = { data: [], total: 0, unreadCount: 0, hasMore: false };

  if (!isRealSupabaseConfigured()) return empty;

  try {
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (options.unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error, count } = await query;

    if (error) {
      console.warn('[getNotifications] Erro Supabase:', error.message);
      return empty;
    }

    // Contar não lidas separadamente para o badge
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('is_read', false);

    const total = count ?? 0;
    return {
      data:        (data ?? []).map(mapRow),
      total,
      unreadCount: unreadCount ?? 0,
      hasMore:     from + pageSize < total,
    };
  } catch (err) {
    console.error('[getNotifications] Exceção:', err);
    return empty;
  }
}

// =============================================================================
// 2. CONTAGEM DE NÃO LIDAS (para o badge)
// =============================================================================
export async function getUnreadCount(storeId: string): Promise<number> {
  if (!isRealSupabaseConfigured()) return 0;

  try {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('is_read', false);

    return count ?? 0;
  } catch (err) {
    console.error('[getUnreadCount] Erro:', err);
    return 0;
  }
}

// =============================================================================
// 3. MARCAR UMA NOTIFICAÇÃO COMO LIDA
// =============================================================================
export async function markAsRead(notificationId: string): Promise<boolean> {
  if (!isRealSupabaseConfigured()) return false;

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.warn('[markAsRead] Erro:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[markAsRead] Exceção:', err);
    return false;
  }
}

// =============================================================================
// 4. MARCAR TODAS COMO LIDAS
// =============================================================================
export async function markAllAsRead(storeId: string): Promise<boolean> {
  if (!isRealSupabaseConfigured()) return false;

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('store_id', storeId)
      .eq('is_read', false);

    if (error) {
      console.warn('[markAllAsRead] Erro:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[markAllAsRead] Exceção:', err);
    return false;
  }
}

// =============================================================================
// 5. INSERIR NOTIFICAÇÃO (chamado pelo webhook — server-side com supabaseAdmin)
// =============================================================================
export interface CreateNotificationParams {
  storeId: string;
  creatorId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Notification['metadata'];
}

export async function createNotification(params: CreateNotificationParams): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        store_id:   params.storeId,
        creator_id: params.creatorId,
        type:       params.type,
        title:      params.title,
        body:       params.body,
        metadata:   params.metadata ?? {},
        is_read:    false,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[createNotification] Erro ao inserir:', error.message);
      return null;
    }

    return (data as { id: string }).id;
  } catch (err) {
    console.error('[createNotification] Exceção:', err);
    return null;
  }
}

// =============================================================================
// 6. SUPABASE REALTIME — SUBSCRIBE (client-side)
// Escuta novos INSERTs na tabela `notifications` para a loja específica.
// Retorna a função de unsubscribe para cleanup em useEffect.
// =============================================================================
export function subscribeToNotifications(
  storeId: string,
  onNew: (notification: Notification) => void
): () => void {
  if (!isRealSupabaseConfigured() || typeof window === 'undefined') {
    return () => {};
  }

  const channelName = `notifications:store:${storeId}`;

  const channel: RealtimeChannel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event:  'INSERT',
        schema: 'public',
        table:  'notifications',
        filter: `store_id=eq.${storeId}`,
      },
      (payload) => {
        if (payload.new) {
          onNew(mapRow(payload.new as Record<string, unknown>));
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.info(`[NotificationService] Realtime conectado para loja ${storeId}`);
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        console.warn(`[NotificationService] Canal ${channelName} encerrado: ${status}`);
      }
    });

  // Retornar função de cleanup para o useEffect
  return () => {
    supabase.removeChannel(channel);
  };
}

// =============================================================================
// 7. HELPER — formatar tempo relativo (ex: "há 2 min", "há 3h", "ontem")
// =============================================================================
export function formatRelativeTime(isoDate: string): string {
  const date  = new Date(isoDate);
  const now   = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec  = Math.floor(diffMs / 1000);
  const diffMin  = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay  = Math.floor(diffHour / 24);

  if (diffSec < 60)   return 'agora mesmo';
  if (diffMin < 60)   return `há ${diffMin} min`;
  if (diffHour < 24)  return `há ${diffHour}h`;
  if (diffDay === 1)  return 'ontem';
  if (diffDay < 7)    return `há ${diffDay} dias`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}
