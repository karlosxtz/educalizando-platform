CREATE OR REPLACE FUNCTION public.review_manual_withdrawal(
  p_withdrawal_id TEXT, p_action TEXT, p_reviewed_by TEXT,
  p_payment_reference TEXT DEFAULT NULL, p_review_note TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE v public.withdrawals%ROWTYPE;
BEGIN
 SELECT * INTO v FROM public.withdrawals WHERE id=p_withdrawal_id FOR UPDATE;
 IF NOT FOUND THEN RETURN json_build_object('success',false,'error','Solicitação não encontrada.'); END IF;
 IF p_action='reopen' AND v.status IN ('FAILED','CANCELLED') THEN
   UPDATE public.withdrawals SET status='PENDING', failure_reason=NULL, reviewed_by=p_reviewed_by, review_note=p_review_note, reviewed_at=NOW(), updated_at=NOW() WHERE id=p_withdrawal_id;
 ELSIF p_action='reverse' AND v.status='COMPLETED' THEN
   INSERT INTO public.wallet_transactions (id,creator_id,store_id,type,status,gross_amount,net_amount,description,created_at) VALUES (gen_random_uuid()::text,v.creator_id,v.store_id,'ADJUSTMENT','COMPLETED',v.amount,v.amount,'Estorno administrativo do saque #'||p_withdrawal_id,NOW());
   UPDATE public.withdrawals SET status='FAILED', failure_reason='Estornado pela administração', reviewed_by=p_reviewed_by, review_note=p_review_note, reviewed_at=NOW(), updated_at=NOW() WHERE id=p_withdrawal_id;
 ELSE RETURN json_build_object('success',false,'error','Ação incompatível com o status atual.'); END IF;
 RETURN json_build_object('success',true);
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path=public;
