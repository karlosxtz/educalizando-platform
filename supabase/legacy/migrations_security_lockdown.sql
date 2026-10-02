-- =============================================================================
-- EDUCALIZANDO — MIGRATION: RLS LOCKDOWN (ZERO TRUST SECURITY)
-- =============================================================================
-- Este script aplica a política DEFAULT DENY em tabelas core do sistema,
-- forçando com que TODA leitura/escrita precise ser explicitamente liberada.
-- Operações do Super Admin/NodeJS usando "service_role" bypassam o RLS.

-- 1. TRANCANDO TABELAS (Default Deny)
ALTER TABLE IF EXISTS public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.creator_pix_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS DA LOJA (STORES)
-- Regra: Qualquer um pode VER lojas ativas, mas apenas o DONO pode EDITAR.
DROP POLICY IF EXISTS "Public can view active stores" ON public.stores;
CREATE POLICY "Public can view active stores" ON public.stores
    FOR SELECT USING (true); -- No futuro, filtrar por status ativo

DROP POLICY IF EXISTS "Owners can update their own stores" ON public.stores;
CREATE POLICY "Owners can update their own stores" ON public.stores
    FOR UPDATE USING (auth.uid()::text = creator_id::text);

-- 3. POLÍTICAS DE PRODUTOS (PRODUCTS)
-- Regra: Qualquer um pode VER produtos, mas apenas o DONO pode CRIAR/EDITAR.
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" ON public.products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can manage their products" ON public.products;
CREATE POLICY "Owners can manage their products" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.stores 
            WHERE stores.id = products.store_id 
            AND stores.creator_id::text = auth.uid()::text
        )
    );

-- 4. POLÍTICAS FINANCEIRAS (DADOS SENSÍVEIS)
-- Regra: APENAS o próprio criador pode ver suas chaves PIX, transações da carteira e saques.
-- Clientes não podem ler nem escrever nessas tabelas sob nenhuma hipótese.

-- Chaves PIX
DROP POLICY IF EXISTS "Creators view own pix keys" ON public.creator_pix_keys;
CREATE POLICY "Creators view own pix keys" ON public.creator_pix_keys
    FOR SELECT USING (auth.uid()::text = creator_id::text);

-- Wallet (Carteira)
DROP POLICY IF EXISTS "Creators view own wallet" ON public.wallet_transactions;
CREATE POLICY "Creators view own wallet" ON public.wallet_transactions
    FOR SELECT USING (
        -- Assumindo que a relação carteira -> loja -> dono precisa bater. 
        -- Simplificando para exigir bypass do backend se o creator_id não estiver na tabela.
        -- O backend Node usa service_role para ler, então bloquear aqui é mais seguro.
        false 
    );

-- Saques
DROP POLICY IF EXISTS "Creators view own withdrawals" ON public.withdrawals;
CREATE POLICY "Creators view own withdrawals" ON public.withdrawals
    FOR SELECT USING (auth.uid()::text = creator_id::text);

-- Impedir clientes anônimos de escrever em dados financeiros
DROP POLICY IF EXISTS "Nobody can write financial data via client" ON public.wallet_transactions;
CREATE POLICY "Nobody can write financial data via client" ON public.wallet_transactions
    FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "Nobody can write withdrawals via client" ON public.withdrawals;
CREATE POLICY "Nobody can write withdrawals via client" ON public.withdrawals
    FOR INSERT WITH CHECK (false);

-- 5. CATEGORIAS E CONFIGURAÇÕES DA PLATAFORMA
-- Regra: Leitura pública. Edição apenas pelo backend (Super Admin).
DROP POLICY IF EXISTS "Public config read" ON public.platform_settings;
CREATE POLICY "Public config read" ON public.platform_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public categories read" ON public.categories;
CREATE POLICY "Public categories read" ON public.categories FOR SELECT USING (true);

-- Backend (service_role) vai ignorar todas essas restrições automaticamente.
