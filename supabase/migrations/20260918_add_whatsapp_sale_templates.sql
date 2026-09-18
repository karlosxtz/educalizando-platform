-- Templates opcionais das mensagens disparadas após confirmação de pagamento.
-- Variáveis disponíveis: {{nome}}, {{comprador}}, {{produto}}, {{valor}}, {{pedido}}.
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS whatsapp_template_creator_sale TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_template_buyer_sale TEXT;

NOTIFY pgrst, 'reload schema';
