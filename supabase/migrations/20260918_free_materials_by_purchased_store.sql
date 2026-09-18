-- Brindes são um benefício da relação do cliente com cada loja.
-- Uma compra paga na loja libera apenas os materiais gratuitos daquela mesma loja.
CREATE INDEX IF NOT EXISTS idx_orders_paid_student_store
  ON public.orders (student_id, store_id)
  WHERE status = 'paid';

NOTIFY pgrst, 'reload schema';
