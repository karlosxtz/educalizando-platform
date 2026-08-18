-- =============================================================================
-- EDUCALIZANDO — MIGRATION: SAQUE SEGURO COM TRAVA ATÔMICA PARA AFILIADOS
-- =============================================================================

-- Função RPC para processar o saque de forma atômica para afiliados
-- Previne Race Conditions travando as linhas da carteira do afiliado para leitura
DROP FUNCTION IF EXISTS public.process_affiliate_withdrawal_safe;

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
    -- 1. BLOQUEIO ATÔMICO (Row-level lock)
    -- Trava apenas as transações deste afiliado. Assim não bloqueia as lojas dos criadores.
    PERFORM 1 FROM public.wallet_transactions 
    WHERE creator_id = p_creator_id 
    FOR UPDATE;

    -- 2. VERIFICAÇÃO DE SAQUE EM ANDAMENTO
    -- Um afiliado não pode ter dois saques em andamento
    SELECT EXISTS (
        SELECT 1 FROM public.withdrawals 
        WHERE creator_id = p_creator_id AND status IN ('PENDING', 'PROCESSING')
    ) INTO v_in_progress;

    IF v_in_progress THEN
        RETURN json_build_object('success', false, 'error', 'Você já possui uma solicitação de saque em andamento.');
    END IF;

    -- 3. CÁLCULO DE SALDO DISPONÍVEL (Após lock)
    -- Considera todo o histórico financeiro do afiliado (Comissões, Refunds, Saques Anteriores)
    SELECT COALESCE(SUM(net_amount), 0) INTO v_available_balance 
    FROM public.wallet_transactions 
    WHERE creator_id = p_creator_id AND status = 'COMPLETED';

    -- 4. VALIDAÇÃO DE SALDO
    IF p_amount > v_available_balance THEN
        RETURN json_build_object('success', false, 'error', 'Saldo insuficiente.', 'available', v_available_balance);
    END IF;

    -- 5. INSERÇÃO DO SAQUE NA FILA
    INSERT INTO public.withdrawals (
        id, creator_id, store_id, amount, pix_key_id, pix_key_type, pix_key_masked, status, asaas_external_reference
    ) VALUES (
        p_withdrawal_id, p_creator_id, p_store_id, p_amount, p_pix_key_id, p_pix_key_type, p_pix_key_masked, 'PENDING', p_asaas_external_ref
    );

    -- 6. DEDUÇÃO IMEDIATA (Reserva de Saldo)
    -- Registra o saque na carteira para reduzir o saldo imediatamente.
    INSERT INTO public.wallet_transactions (
        id, store_id, creator_id, order_id, type, gross_amount, net_amount, description, status
    ) VALUES (
        gen_random_uuid()::text, p_store_id, p_creator_id, NULL, 'WITHDRAWAL', -p_amount, -p_amount, 'Reserva para Saque PIX (Afiliado) ' || p_pix_key_masked, 'COMPLETED'
    );

    -- Transação é commitada com sucesso. Outras concorrências lerão o saldo atualizado.
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
