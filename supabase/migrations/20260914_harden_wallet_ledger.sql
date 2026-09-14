-- Protege o livro-caixa contra leitura e mutação direta pelo navegador.
-- A service role usada pelas APIs continua ignorando RLS normalmente.
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de wallet_transactions por store_id" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Permitir insercao em wallet_transactions via API" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Permitir atualizacao em wallet_transactions via API" ON public.wallet_transactions;
DROP POLICY IF EXISTS "wallet_transactions_select_owner" ON public.wallet_transactions;

CREATE POLICY "wallet_transactions_select_owner"
  ON public.wallet_transactions
  FOR SELECT
  TO authenticated
  USING (
    creator_id = auth.uid()::text
    OR EXISTS (
      SELECT 1
      FROM public.stores
      WHERE stores.id::text = wallet_transactions.store_id::text
        AND stores.creator_id = auth.uid()
    )
  );

-- Diferencia os lançamentos do vendedor e do afiliado no mesmo pedido.
-- O valor vazio representa o saldo principal da loja (creator_id nulo).
DROP INDEX IF EXISTS public.uq_wallet_transactions_order_type;
CREATE UNIQUE INDEX IF NOT EXISTS uq_wallet_transactions_order_type_owner
  ON public.wallet_transactions(order_id, type, COALESCE(creator_id, ''))
  WHERE order_id IS NOT NULL;

