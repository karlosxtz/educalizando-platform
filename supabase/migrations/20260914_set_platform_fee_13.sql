-- Regra comercial vigente: 13% sobre cada venda, sem taxa fixa.
ALTER TABLE public.platform_settings
  ALTER COLUMN platform_fee_percentage SET DEFAULT 13.00,
  ALTER COLUMN platform_fixed_fee SET DEFAULT 0.00;

UPDATE public.platform_settings
SET platform_fee_percentage = 13.00,
    platform_fixed_fee = 0.00,
    updated_at = NOW(),
    updated_by = 'fee_policy_13_percent';
