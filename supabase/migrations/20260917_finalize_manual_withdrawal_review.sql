CREATE OR REPLACE FUNCTION public.review_manual_withdrawal(
  p_withdrawal_id TEXT,
  p_action TEXT,
  p_reviewed_by TEXT,
  p_payment_reference TEXT DEFAULT NULL,
  p_review_note TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_withdrawal public.withdrawals%ROWTYPE;
BEGIN
  SELECT * INTO v_withdrawal FROM public.withdrawals WHERE id = p_withdrawal_id FOR UPDATE;
  IF NOT FOUND THEN RETURN json_build_object('success', false, 'error', 'Solicitação de saque não encontrada.'); END IF;

  IF p_action = 'complete' AND v_withdrawal.status IN ('PENDING', 'PROCESSING') THEN
    IF COALESCE(TRIM(p_payment_reference), '') = '' THEN RETURN json_build_object('success', false, 'error', 'Informe a referência ou comprovante da transferência.'); END IF;
    UPDATE public.withdrawals SET status = 'COMPLETED', payment_reference = TRIM(p_payment_reference), review_note = NULLIF(TRIM(p_review_note), ''), reviewed_by = p_reviewed_by, reviewed_at = NOW(), completed_at = NOW(), updated_at = NOW() WHERE id = p_withdrawal_id;

  ELSIF p_action = 'reject' AND v_withdrawal.status IN ('PENDING', 'PROCESSING') THEN
    INSERT INTO public.wallet_transactions (id, creator_id, store_id, type, status, gross_amount, net_amount, description, created_at)
    VALUES (gen_random_uuid()::text, v_withdrawal.creator_id, v_withdrawal.store_id, 'ADJUSTMENT', 'COMPLETED', v_withdrawal.amount, v_withdrawal.amount, 'Devolução de saldo do saque rejeitado #' || p_withdrawal_id, NOW());
    UPDATE public.withdrawals SET status = 'FAILED', failure_reason = COALESCE(NULLIF(TRIM(p_review_note), ''), 'Solicitação rejeitada pela administração.'), review_note = NULLIF(TRIM(p_review_note), ''), reviewed_by = p_reviewed_by, reviewed_at = NOW(), failed_at = NOW(), updated_at = NOW() WHERE id = p_withdrawal_id;

  ELSIF p_action = 'reverse' AND v_withdrawal.status = 'COMPLETED' THEN
    INSERT INTO public.wallet_transactions (id, creator_id, store_id, type, status, gross_amount, net_amount, description, created_at)
    VALUES (gen_random_uuid()::text, v_withdrawal.creator_id, v_withdrawal.store_id, 'ADJUSTMENT', 'COMPLETED', v_withdrawal.amount, v_withdrawal.amount, 'Estorno administrativo do saque #' || p_withdrawal_id, NOW());
    UPDATE public.withdrawals SET status = 'FAILED', failure_reason = COALESCE(NULLIF(TRIM(p_review_note), ''), 'Estornado pela administração.'), review_note = NULLIF(TRIM(p_review_note), ''), reviewed_by = p_reviewed_by, reviewed_at = NOW(), failed_at = NOW(), updated_at = NOW() WHERE id = p_withdrawal_id;

  ELSIF p_action = 'reopen' AND v_withdrawal.status = 'FAILED' THEN
    -- Um saque rejeitado já devolveu o saldo. Ao reabri-lo, reservamos esse
    -- mesmo valor novamente para impedir pagamento duplicado.
    INSERT INTO public.wallet_transactions (id, creator_id, store_id, type, status, gross_amount, net_amount, description, created_at)
    VALUES (gen_random_uuid()::text, v_withdrawal.creator_id, v_withdrawal.store_id, 'ADJUSTMENT', 'COMPLETED', -v_withdrawal.amount, -v_withdrawal.amount, 'Reserva reaberta do saque #' || p_withdrawal_id, NOW());
    UPDATE public.withdrawals SET status = 'PENDING', failure_reason = NULL, review_note = NULLIF(TRIM(p_review_note), ''), reviewed_by = p_reviewed_by, reviewed_at = NOW(), failed_at = NULL, updated_at = NOW() WHERE id = p_withdrawal_id;

  ELSE
    RETURN json_build_object('success', false, 'error', 'Ação incompatível com o status atual do saque.');
  END IF;
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.review_manual_withdrawal(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_manual_withdrawal(TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
