-- Adiciona colunas para templates de WhatsApp por persona
ALTER TABLE public.platform_settings
ADD COLUMN IF NOT EXISTS whatsapp_template_creator TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_template_student TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_template_affiliate TEXT;
