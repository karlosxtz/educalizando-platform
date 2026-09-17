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

  -- Apenas lançamentos do programa de afiliados formam este saldo. Vendas da
  -- própria loja do usuário nunca podem ser sacadas pelo fluxo de afiliado.
  SELECT COALESCE(SUM(net_amount), 0) INTO v_available_balance
  FROM public.wallet_transactions
  WHERE creator_id = p_creator_id
    AND status = 'COMPLETED'
    AND (
      (type = 'AFFILIATE_COMMISSION' AND created_at <= NOW() - INTERVAL '7 days')
      OR (type = 'REFUND' AND description LIKE 'Estorno de Comissão -%')
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
