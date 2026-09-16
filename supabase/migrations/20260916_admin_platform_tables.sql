-- Estruturas usadas pelos módulos administrativos da Educalizando.
-- A migration é idempotente para também funcionar em projetos já em produção.

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_fee_percentage NUMERIC(5, 2) NOT NULL DEFAULT 13 CHECK (platform_fee_percentage >= 0 AND platform_fee_percentage <= 100),
  platform_fixed_fee NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (platform_fixed_fee >= 0),
  minimum_withdrawal_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (minimum_withdrawal_amount >= 0),
  withdrawal_fee NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (withdrawal_fee >= 0),
  whatsapp_template_creator TEXT,
  whatsapp_template_student TEXT,
  whatsapp_template_affiliate TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.system_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  link_url TEXT,
  link_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.platform_tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  duration TEXT NOT NULL DEFAULT '00:00',
  "order" INTEGER NOT NULL DEFAULT 0 CHECK ("order" >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compatibilidade com bases que já possuíam uma versão parcial dessas tabelas.
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS platform_fee_percentage NUMERIC(5, 2) NOT NULL DEFAULT 13,
  ADD COLUMN IF NOT EXISTS platform_fixed_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS minimum_withdrawal_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS withdrawal_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS whatsapp_template_creator TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_template_student TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_template_affiliate TEXT,
  ADD COLUMN IF NOT EXISTS updated_by TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.system_banners
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS link_url TEXT,
  ADD COLUMN IF NOT EXISTS link_text TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.platform_tutorials
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS youtube_id TEXT,
  ADD COLUMN IF NOT EXISTS duration TEXT NOT NULL DEFAULT '00:00',
  ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_system_banners_active_created
  ON public.system_banners (is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_tutorials_visible_order
  ON public.platform_tutorials (is_active, "order", created_at DESC);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_tutorials ENABLE ROW LEVEL SECURITY;

-- Somente conteúdo destinado ao público pode ser lido pelo cliente anon.
DROP POLICY IF EXISTS "system_banners_public_active" ON public.system_banners;
CREATE POLICY "system_banners_public_active" ON public.system_banners
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "platform_tutorials_public_active" ON public.platform_tutorials;
CREATE POLICY "platform_tutorials_public_active" ON public.platform_tutorials
  FOR SELECT USING (is_active = TRUE);

-- Escritas administrativas são executadas exclusivamente pela API com service_role.
-- Não há políticas de insert/update/delete para usuários comuns.
