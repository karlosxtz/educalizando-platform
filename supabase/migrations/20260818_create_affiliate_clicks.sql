-- Criação da tabela de rastreamento de cliques de afiliados
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    visitor_id TEXT NOT NULL,
    referer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Política de leitura/escrita restrita.
-- Nenhuma operação permitida via client. Todas as inserções devem ser feitas
-- via supabaseAdmin no backend (service_role), que bypassa RLS.
CREATE POLICY "affiliate_clicks_no_client_access" ON public.affiliate_clicks
    FOR ALL USING (false);

-- Índices otimizados para agregação e anti-spam
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate ON public.affiliate_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_dedup ON public.affiliate_clicks(visitor_id, affiliate_id, store_id, created_at);
