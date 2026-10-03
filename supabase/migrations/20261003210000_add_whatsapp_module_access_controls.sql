-- Controles comerciais do módulo WhatsApp da Loja.
-- A cobrança pode ser desligada globalmente ou dispensada para uma loja específica.

ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS whatsapp_module_charge_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS whatsapp_module_price_cents INTEGER NOT NULL DEFAULT 1990;

ALTER TABLE public.whatsapp_store_subscriptions
  ADD COLUMN IF NOT EXISTS free_access_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS free_access_note TEXT,
  ADD COLUMN IF NOT EXISTS free_access_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS free_access_updated_by TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'platform_settings_whatsapp_module_price_check'
  ) THEN
    ALTER TABLE public.platform_settings
      ADD CONSTRAINT platform_settings_whatsapp_module_price_check
      CHECK (whatsapp_module_price_cents BETWEEN 100 AND 1000000);
  END IF;
END $$;

COMMENT ON COLUMN public.platform_settings.whatsapp_module_charge_enabled IS
  'Quando falso, todas as lojas acessam gratuitamente o módulo WhatsApp.';
COMMENT ON COLUMN public.whatsapp_store_subscriptions.free_access_enabled IS
  'Cortesia individual concedida pelo administrador, independente de assinatura paga.';

NOTIFY pgrst, 'reload schema';
