-- =============================================================================
-- EDUCALIZANDO — NOTIFICATIONS SYSTEM
-- Tabela de notificações em tempo real para criadores
-- =============================================================================

-- 1. Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  creator_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN (
                    'SALE_CONFIRMED',
                    'WITHDRAWAL_APPROVED',
                    'WITHDRAWAL_FAILED',
                    'NEW_REVIEW',
                    'SYSTEM'
                  )),
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  metadata        JSONB DEFAULT '{}'::jsonb,   -- dados extras: order_id, amount, product_title, etc.
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_store_id     ON notifications (store_id);
CREATE INDEX IF NOT EXISTS idx_notifications_creator_id   ON notifications (creator_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read      ON notifications (store_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at   ON notifications (store_id, created_at DESC);

-- 3. RLS — Criador só vê as suas próprias notificações
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Criador pode ver suas notificações
CREATE POLICY "notifications_creator_select" ON notifications
  FOR SELECT USING (creator_id = auth.uid());

-- Criador pode marcar como lida
CREATE POLICY "notifications_creator_update" ON notifications
  FOR UPDATE USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Service role pode inserir (webhooks e sistema usam service role key)
CREATE POLICY "notifications_service_insert" ON notifications
  FOR INSERT WITH CHECK (TRUE);

-- Service role pode deletar (limpeza de notificações antigas)
CREATE POLICY "notifications_service_delete" ON notifications
  FOR DELETE USING (TRUE);

-- 4. Habilitar Realtime para a tabela (necessário para Supabase Realtime funcionar)
-- Execute no Supabase Dashboard: Database > Replication > Add table: notifications
-- OU via SQL:
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 5. Função para limpar notificações antigas (> 90 dias) — pode ser chamada por cron
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
