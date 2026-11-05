-- Atualiza o limite mínimo de saque para R$ 50,00 na plataforma
BEGIN;

-- 1. Garante que o valor padrão da coluna minimum_withdrawal_amount seja 50.00
ALTER TABLE public.platform_settings 
  ALTER COLUMN minimum_withdrawal_amount SET DEFAULT 50.00;

-- 2. Atualiza registros existentes para que o saque mínimo seja pelo menos R$ 50,00
UPDATE public.platform_settings 
SET minimum_withdrawal_amount = 50.00,
    updated_at = NOW()
WHERE minimum_withdrawal_amount < 50.00 OR minimum_withdrawal_amount IS NULL;

-- 3. Se ainda não houver nenhuma linha em platform_settings, insere com os padrões
INSERT INTO public.platform_settings (
  platform_fee_percentage,
  platform_fixed_fee,
  minimum_withdrawal_amount,
  withdrawal_fee,
  created_at,
  updated_at
)
SELECT 13.00, 0.00, 50.00, 0.00, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.platform_settings);

-- 4. Atualiza a função process_withdrawal_safe para validar o valor mínimo no banco
CREATE OR REPLACE FUNCTION public.process_withdrawal_safe(
  p_store_id TEXT, p_creator_id TEXT, p_amount NUMERIC, p_pix_key_id TEXT,
  p_pix_key_type TEXT, p_pix_key_masked TEXT, p_asaas_external_ref TEXT,
  p_withdrawal_id TEXT
) RETURNS JSON AS $$
DECLARE
  v_available_balance NUMERIC;
  v_fee NUMERIC := 0;
  v_min_amount NUMERIC := 50.00;
  v_reserved_amount NUMERIC;
  v_in_progress BOOLEAN;
BEGIN
  PERFORM 1 FROM public.wallet_transactions WHERE store_id = p_store_id FOR UPDATE;

  SELECT EXISTS (
    SELECT 1 FROM public.withdrawals 
    WHERE store_id = p_store_id AND status IN ('PENDING', 'PROCESSING')
  ) INTO v_in_progress;
  IF v_in_progress THEN 
    RETURN json_build_object('success', false, 'error', 'Você já possui uma solicitação de saque em andamento.'); 
  END IF;

  SELECT COALESCE(minimum_withdrawal_amount, 50.00), COALESCE(withdrawal_fee, 0)
  INTO v_min_amount, v_fee 
  FROM public.platform_settings ORDER BY updated_at DESC NULLS LAST LIMIT 1;

  v_min_amount := COALESCE(v_min_amount, 50.00);
  v_fee := COALESCE(v_fee, 0);

  IF p_amount < v_min_amount THEN
    RETURN json_build_object('success', false, 'error', 'O valor mínimo para saque é de R$ ' || to_char(v_min_amount, 'FM999G999D00'));
  END IF;

  v_reserved_amount := p_amount + v_fee;

  SELECT COALESCE(SUM(net_amount), 0) INTO v_available_balance
  FROM public.wallet_transactions WHERE store_id = p_store_id AND status = 'COMPLETED';
  IF v_reserved_amount > v_available_balance THEN
    RETURN json_build_object('success', false, 'error', 'Saldo insuficiente para o valor solicitado e a taxa de saque.', 'available', v_available_balance);
  END IF;

  INSERT INTO public.withdrawals (id, creator_id, store_id, amount, net_amount, withdrawal_fee, pix_key_id, pix_key_type, pix_key_masked, status, asaas_external_reference)
  VALUES (p_withdrawal_id, p_creator_id, p_store_id, p_amount, p_amount, v_fee, p_pix_key_id, p_pix_key_type, p_pix_key_masked, 'PENDING', p_asaas_external_ref);

  INSERT INTO public.wallet_transactions (id, store_id, order_id, type, gross_amount, net_amount, description, status)
  VALUES (gen_random_uuid()::text, p_store_id, NULL, 'WITHDRAWAL', -v_reserved_amount, -v_reserved_amount,
    'Reserva para Saque PIX ' || p_pix_key_masked || CASE WHEN v_fee > 0 THEN ' (inclui taxa de saque)' ELSE '' END, 'COMPLETED');

  RETURN json_build_object('success', true, 'withdrawal_fee', v_fee, 'reserved_amount', v_reserved_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Atualiza a função process_affiliate_withdrawal_safe para validar o valor mínimo no banco
CREATE OR REPLACE FUNCTION public.process_affiliate_withdrawal_safe(
  p_creator_id TEXT,
  p_amount NUMERIC,
  p_pix_key_id TEXT,
  p_pix_key_type TEXT,
  p_pix_key_masked TEXT,
  p_asaas_external_ref TEXT,
  p_withdrawal_id TEXT,
  p_store_id TEXT
) RETURNS JSON AS $$
DECLARE
  v_available_balance NUMERIC;
  v_min_amount NUMERIC := 50.00;
  v_in_progress BOOLEAN;
BEGIN
  PERFORM 1 FROM public.wallet_transactions WHERE creator_id = p_creator_id FOR UPDATE;

  SELECT EXISTS (
    SELECT 1 FROM public.withdrawals
    WHERE creator_id = p_creator_id AND store_id = p_store_id AND status IN ('PENDING', 'PROCESSING')
  ) INTO v_in_progress;
  IF v_in_progress THEN
    RETURN json_build_object('success', false, 'error', 'Você já possui uma solicitação de saque em andamento.');
  END IF;

  SELECT COALESCE(minimum_withdrawal_amount, 50.00)
  INTO v_min_amount
  FROM public.platform_settings ORDER BY updated_at DESC NULLS LAST LIMIT 1;
  v_min_amount := COALESCE(v_min_amount, 50.00);

  IF p_amount < v_min_amount THEN
    RETURN json_build_object('success', false, 'error', 'O valor mínimo para saque é de R$ ' || to_char(v_min_amount, 'FM999G999D00'));
  END IF;

  SELECT COALESCE(SUM(net_amount), 0) INTO v_available_balance
  FROM public.wallet_transactions
  WHERE creator_id = p_creator_id
    AND status = 'COMPLETED'
    AND (
      (type = 'AFFILIATE_COMMISSION' AND created_at <= NOW() - INTERVAL '7 days')
      OR (type IN ('REFUND', 'AFFILIATE_COMMISSION_REFUND') AND description LIKE 'Estorno de Comissão -%')
      OR (type = 'WITHDRAWAL' AND store_id = p_store_id AND description LIKE 'Reserva para Saque PIX (Afiliado)%')
      OR (type = 'ADJUSTMENT' AND store_id = p_store_id AND description LIKE 'Devolução de saldo do saque rejeitado%')
    );

  IF p_amount <= 0 OR p_amount > v_available_balance THEN
    RETURN json_build_object('success', false, 'error', 'Saldo disponível insuficiente.', 'available', v_available_balance);
  END IF;

  INSERT INTO public.withdrawals (id, creator_id, store_id, amount, pix_key_id, pix_key_type, pix_key_masked, status, asaas_external_reference)
  VALUES (p_withdrawal_id, p_creator_id, p_store_id, p_amount, p_pix_key_id, p_pix_key_type, p_pix_key_masked, 'PENDING', p_asaas_external_ref);

  INSERT INTO public.wallet_transactions (id, store_id, creator_id, order_id, type, gross_amount, net_amount, description, status)
  VALUES (gen_random_uuid()::text, p_store_id, p_creator_id, NULL, 'WITHDRAWAL', -p_amount, -p_amount, 'Reserva para Saque PIX (Afiliado) ' || p_pix_key_masked, 'COMPLETED');

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.process_affiliate_withdrawal_safe(TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_affiliate_withdrawal_safe(TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

COMMIT;

