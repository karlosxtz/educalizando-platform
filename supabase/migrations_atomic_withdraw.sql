-- =============================================================================
-- EDUCALIZANDO — MIGRATION: SAQUE SEGURO COM TRAVA ATÔMICA (FORTE KNOX)
-- =============================================================================

-- Função RPC para processar o saque de forma atômica
-- Previne Race Conditions travando as linhas da carteira da loja para leitura
DROP FUNCTION IF EXISTS public.process_withdrawal_safe;

CREATE OR REPLACE FUNCTION public.process_withdrawal_safe(
    p_store_id TEXT,
    p_creator_id TEXT,
    p_amount NUMERIC,
    p_pix_key_id TEXT,
    p_pix_key_type TEXT,
    p_pix_key_masked TEXT,
    p_asaas_external_ref TEXT,
    p_withdrawal_id TEXT
) RETURNS JSON AS $$
DECLARE
    v_available_balance NUMERIC;
    v_in_progress BOOLEAN;
BEGIN
    -- 1. BLOQUEIO ATÔMICO (Row-level lock)
    -- Garante que se houverem requisições concorrentes, elas aguardarão até que
    -- esta transação atual termine (seja por commit ou rollback)
    PERFORM 1 FROM public.wallet_transactions 
    WHERE store_id = p_store_id 
    FOR UPDATE;

    -- 2. VERIFICAÇÃO DE SAQUE EM ANDAMENTO
    SELECT EXISTS (
        SELECT 1 FROM public.withdrawals 
        WHERE store_id = p_store_id AND status IN ('PENDING', 'PROCESSING')
    ) INTO v_in_progress;

    IF v_in_progress THEN
        RETURN json_build_object('success', false, 'error', 'Você já possui uma solicitação de saque em andamento.');
    END IF;

    -- 3. CÁLCULO DE SALDO DISPONÍVEL (Após lock)
    SELECT COALESCE(SUM(net_amount), 0) INTO v_available_balance 
    FROM public.wallet_transactions 
    WHERE store_id = p_store_id AND status = 'COMPLETED';

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
    INSERT INTO public.wallet_transactions (
        id, store_id, order_id, type, gross_amount, net_amount, description, status
    ) VALUES (
        gen_random_uuid()::text, p_store_id, NULL, 'WITHDRAWAL', -p_amount, -p_amount, 'Reserva para Saque PIX ' || p_pix_key_masked, 'COMPLETED'
    );

    -- Transação é commitada com sucesso. Outras concorrências lerão o saldo atualizado.
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
