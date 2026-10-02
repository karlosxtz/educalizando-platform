-- =============================================================================
-- EDUCALIZANDO — MIGRATION SUPER ADMIN V2 (CONFIGURAÇÕES GLOBAIS)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_fee_percentage NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    platform_fixed_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    minimum_withdrawal_amount NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
    withdrawal_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by VARCHAR(255)
);

-- Inserir a linha de configuração padrão se a tabela estiver vazia
INSERT INTO public.platform_settings (platform_fee_percentage, platform_fixed_fee, minimum_withdrawal_amount, withdrawal_fee, updated_by)
SELECT 10.00, 0.00, 50.00, 0.00, 'system_init'
WHERE NOT EXISTS (SELECT 1 FROM public.platform_settings);

-- RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Super Admin backend pode ler e escrever contornando o RLS com o service_role.
-- Clients não devem ler isso diretamente (ou apenas leitura pública para as taxas)
CREATE POLICY "Leitura publica de configuracoes da plataforma" ON public.platform_settings
  FOR SELECT USING (true);

CREATE POLICY "Ninguem escreve via client" ON public.platform_settings
  FOR ALL USING (false);
