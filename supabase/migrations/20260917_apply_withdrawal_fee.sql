-- Taxa de saque transparente: o criador informa o valor que receberá no PIX;
-- a taxa configurada é reservada junto e volta ao saldo em caso de recusa.
ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS withdrawal_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_amount NUMERIC(10, 2);

UPDATE public.withdrawals
SET net_amount = amount
WHERE net_amount IS NULL;

ALTER TABLE public.withdrawals
  ALTER COLUMN net_amount SET NOT NULL;

CREATE OR REPLACE FUNCTION public.process_withdrawal_safe(
  p_store_id TEXT, p_creator_id TEXT, p_amount NUMERIC, p_pix_key_id TEXT,
  p_pix_key_type TEXT, p_pix_key_masked TEXT, p_asaas_external_ref TEXT,
  p_withdrawal_id TEXT
) RETURNS JSON AS $$
DECLARE
  v_available_balance NUMERIC;
  v_fee NUMERIC := 0;
  v_reserved_amount NUMERIC;
  v_in_progress BOOLEAN;
BEGIN
  PERFORM 1 FROM public.wallet_transactions WHERE store_id = p_store_id FOR UPDATE;

  SELECT EXISTS (SELECT 1 FROM public.withdrawals WHERE store_id = p_store_id AND status IN ('PENDING', 'PROCESSING')) INTO v_in_progress;
  IF v_in_progress THEN RETURN json_build_object('success', false, 'error', 'Você já possui uma solicitação de saque em andamento.'); END IF;

  SELECT COALESCE(withdrawal_fee, 0) INTO v_fee FROM public.platform_settings ORDER BY updated_at DESC NULLS LAST LIMIT 1;
  v_fee := COALESCE(v_fee, 0);
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

CREATE OR REPLACE FUNCTION public.review_manual_withdrawal(
  p_withdrawal_id TEXT, p_action TEXT, p_reviewed_by TEXT,
  p_payment_reference TEXT DEFAULT NULL, p_review_note TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_withdrawal public.withdrawals%ROWTYPE;
  v_reserved_amount NUMERIC;
BEGIN
  SELECT * INTO v_withdrawal FROM public.withdrawals WHERE id = p_withdrawal_id FOR UPDATE;
  IF NOT FOUND THEN RETURN json_build_object('success', false, 'error', 'Solicitação de saque não encontrada.'); END IF;
  v_reserved_amount := v_withdrawal.amount + COALESCE(v_withdrawal.withdrawal_fee, 0);

  IF p_action = 'complete' AND v_withdrawal.status IN ('PENDING', 'PROCESSING') THEN
    IF COALESCE(TRIM(p_payment_reference), '') = '' THEN RETURN json_build_object('success', false, 'error', 'Informe a referência ou comprovante da transferência.'); END IF;
    UPDATE public.withdrawals SET status = 'COMPLETED', payment_reference = TRIM(p_payment_reference), review_note = NULLIF(TRIM(p_review_note), ''), reviewed_by = p_reviewed_by, reviewed_at = NOW(), completed_at = NOW(), updated_at = NOW() WHERE id = p_withdrawal_id;
  ELSIF p_action = 'reject' AND v_withdrawal.status IN ('PENDING', 'PROCESSING') THEN
    INSERT INTO public.wallet_transactions (id, creator_id, store_id, type, status, gross_amount, net_amount, description, created_at)
    VALUES (gen_random_uuid()::text, v_withdrawal.creator_id, v_withdrawal.store_id, 'ADJUSTMENT', 'COMPLETED', v_reserved_amount, v_reserved_amount, 'Devolução de saldo do saque rejeitado #' || p_withdrawal_id, NOW());
    UPDATE public.withdrawals SET status = 'FAILED', failure_reason = COALESCE(NULLIF(TRIM(p_review_note), ''), 'Solicitação rejeitada pela administração.'), review_note = NULLIF(TRIM(p_review_note), ''), reviewed_by = p_reviewed_by, reviewed_at = NOW(), failed_at = NOW(), updated_at = NOW() WHERE id = p_withdrawal_id;
  ELSIF p_action = 'reverse' AND v_withdrawal.status = 'COMPLETED' THEN
    INSERT INTO public.wallet_transactions (id, creator_id, store_id, type, status, gross_amount, net_amount, description, created_at)
    VALUES (gen_random_uuid()::text, v_withdrawal.creator_id, v_withdrawal.store_id, 'ADJUSTMENT', 'COMPLETED', v_reserved_amount, v_reserved_amount, 'Estorno administrativo do saque #' || p_withdrawal_id, NOW());
    UPDATE public.withdrawals SET status = 'FAILED', failure_reason = COALESCE(NULLIF(TRIM(p_review_note), ''), 'Estornado pela administração.'), review_note = NULLIF(TRIM(p_review_note), ''), reviewed_by = p_reviewed_by, reviewed_at = NOW(), failed_at = NOW(), updated_at = NOW() WHERE id = p_withdrawal_id;
  ELSIF p_action = 'reopen' AND v_withdrawal.status = 'FAILED' THEN
    INSERT INTO public.wallet_transactions (id, creator_id, store_id, type, status, gross_amount, net_amount, description, created_at)
    VALUES (gen_random_uuid()::text, v_withdrawal.creator_id, v_withdrawal.store_id, 'ADJUSTMENT', 'COMPLETED', -v_reserved_amount, -v_reserved_amount, 'Reserva reaberta do saque #' || p_withdrawal_id, NOW());
    UPDATE public.withdrawals SET status = 'PENDING', failure_reason = NULL, review_note = NULLIF(TRIM(p_review_note), ''), reviewed_by = p_reviewed_by, reviewed_at = NOW(), failed_at = NULL, updated_at = NOW() WHERE id = p_withdrawal_id;
  ELSE
    RETURN json_build_object('success', false, 'error', 'Ação incompatível com o status atual do saque.');
  END IF;
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.review_manual_withdrawal(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_manual_withdrawal(TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
