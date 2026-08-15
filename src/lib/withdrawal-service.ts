import { supabase, supabaseAdmin, isRealSupabaseConfigured } from './supabase';
import { calculateCreatorWallet, recordWalletTransaction } from './wallet-service';
import { lookupAsaasPixKey, createAsaasTransfer } from './asaas-service';

// CONFIGURAÇÃO CENTRALIZADA (Item 11 & 43 da Especificação)
export const MIN_WITHDRAWAL_AMOUNT = 1.00;
export const WITHDRAWAL_ENABLED = true;

export type PixKeyValidationStatus = 'PENDING' | 'VALID' | 'INVALID' | 'BLOCKED';
export type WithdrawalStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface CreatorPixKey {
  id: string;
  creatorId: string;
  storeId: string;
  pixKeyType: 'CPF';
  pixKey: string; // Somente números (ex: 12345678901)
  pixKeyMasked: string; // Mascarado (ex: ***.***.123-**)
  holderName?: string | null;
  holderCpf?: string | null;
  validationStatus: PixKeyValidationStatus;
  validatedAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalRecord {
  id: string;
  creatorId: string;
  storeId: string;
  amount: number;
  pixKeyId: string;
  pixKeyType: 'CPF';
  pixKeyMasked: string;
  status: WithdrawalStatus;
  asaasTransferId?: string | null;
  asaasExternalReference?: string | null;
  failureReason?: string | null;
  requestedAt: string;
  processingAt?: string | null;
  completedAt?: string | null;
  failedAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
}

const LOCAL_PIX_KEYS_KEY = 'educalizando_creator_pix_keys_v1';
const LOCAL_WITHDRAWALS_KEY = 'educalizando_withdrawals_v1';
const LOCAL_WEBHOOK_EVENTS_KEY = 'educalizando_webhook_events_v1';

// Helper de Mascaramento Seguro de CPF (Item 6 da Especificação)
export function maskCPF(cpf: string): string {
  const nums = cpf.replace(/\D/g, '');
  if (nums.length !== 11) return '***.***.***-**';
  return `***.***.${nums.substring(6, 9)}-${nums.substring(9, 11)}`;
}

function getLocalPixKeys(): CreatorPixKey[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_PIX_KEYS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalPixKeys(keys: CreatorPixKey[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_PIX_KEYS_KEY, JSON.stringify(keys));
  } catch (e) {}
}

function getLocalWithdrawals(): WithdrawalRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_WITHDRAWALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalWithdrawals(withdrawals: WithdrawalRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_WITHDRAWALS_KEY, JSON.stringify(withdrawals));
  } catch (e) {}
}

// 1. Obter Chave PIX Ativa do Criador
export async function getActiveCreatorPixKey(storeId: string, creatorCpf?: string): Promise<CreatorPixKey | null> {
  if (isRealSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('creator_pix_keys')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          creatorId: data.creator_id,
          storeId: data.store_id,
          pixKeyType: 'CPF',
          pixKey: data.pix_key,
          pixKeyMasked: data.pix_key_masked,
          holderName: data.holder_name,
          holderCpf: data.holder_cpf,
          validationStatus: data.validation_status as PixKeyValidationStatus,
          validatedAt: data.validated_at,
          isActive: data.is_active,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      }
    } catch (e) {
      console.error('[getActiveCreatorPixKey] Erro Supabase:', e);
    }
  }

  const local = getLocalPixKeys();
  const found = local.find(k => k.storeId === storeId && k.isActive);
  if (found) return found;

  if (creatorCpf && creatorCpf.replace(/\D/g, '').length === 11) {
    const cleanCpf = creatorCpf.replace(/\D/g, '');
    const defaultKey: CreatorPixKey = {
      id: `pix_${storeId.substring(0, 6)}_${cleanCpf.substring(7)}`,
      creatorId: `creator_${storeId}`,
      storeId,
      pixKeyType: 'CPF',
      pixKey: cleanCpf,
      pixKeyMasked: maskCPF(cleanCpf),
      holderName: 'Criador Educalizando',
      holderCpf: cleanCpf,
      validationStatus: 'VALID',
      validatedAt: new Date().toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return defaultKey;
  }

  return null;
}

// 2. Cadastrar e Validar Chave PIX CPF (Com consulta de titularidade Asaas no Servidor)
export async function registerCreatorPixKey(data: {
  storeId: string;
  creatorId: string;
  creatorProfileCpf: string;
  inputPixKey: string;
  holderName?: string;
}): Promise<CreatorPixKey> {
  const cleanInputCpf = data.inputPixKey.replace(/\D/g, '');
  const cleanProfileCpf = data.creatorProfileCpf.replace(/\D/g, '');

  if (cleanInputCpf.length !== 11) {
    throw new Error('A chave PIX deve ser um CPF válido com 11 dígitos.');
  }

  // REGRA 3: O CPF informado como chave PIX deve corresponder ao CPF cadastrado no perfil do criador
  if (cleanInputCpf !== cleanProfileCpf) {
    throw new Error('A chave PIX CPF precisa pertencer ao mesmo CPF cadastrado na sua conta.');
  }

  // REGRA 4 & 5: Validação REAL de Titularidade na API do Asaas (Servidor)
  const lookupRes = await lookupAsaasPixKey(cleanInputCpf);
  if (!lookupRes.valid) {
    throw new Error(lookupRes.errorMessage || 'Não foi possível confirmar a titularidade da chave PIX no Asaas. Verifique os dados e tente novamente.');
  }

  const now = new Date().toISOString();
  const maskedCpf = maskCPF(cleanInputCpf);
  const keyId = `pix_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newKey: CreatorPixKey = {
    id: keyId,
    creatorId: data.creatorId,
    storeId: data.storeId,
    pixKeyType: 'CPF',
    pixKey: cleanInputCpf,
    pixKeyMasked: maskedCpf,
    holderName: lookupRes.accountHolderName || data.holderName || 'Titular Validado',
    holderCpf: cleanInputCpf,
    validationStatus: 'VALID',
    validatedAt: now,
    isActive: true,
    createdAt: now,
    updatedAt: now
  };

  // Desativar chaves antigas se existirem (Item 8 da Especificação)
  if (isRealSupabaseConfigured()) {
    try {
      await supabaseAdmin.from('creator_pix_keys')
        .update({ is_active: false })
        .eq('store_id', data.storeId);

      await supabaseAdmin.from('creator_pix_keys').insert([{
        id: newKey.id,
        creator_id: newKey.creatorId,
        store_id: newKey.storeId,
        pix_key_type: newKey.pixKeyType,
        pix_key: newKey.pixKey,
        pix_key_masked: newKey.pixKeyMasked,
        holder_name: newKey.holderName,
        holder_cpf: newKey.holderCpf,
        validation_status: newKey.validationStatus,
        validated_at: newKey.validatedAt,
        is_active: true,
        created_at: newKey.createdAt,
        updated_at: newKey.updatedAt
      }]);
    } catch (e) {
      console.error('[registerCreatorPixKey] Erro Supabase:', e);
    }
  }

  const local = getLocalPixKeys().map(k => k.storeId === data.storeId ? { ...k, isActive: false } : k);
  local.unshift(newKey);
  saveLocalPixKeys(local);

  return newKey;
}

// 3. Solicitar Saque Automático com Reserva de Saldo & Transferência PIX Asaas
export async function requestCreatorWithdrawal(data: {
  storeId: string;
  creatorId: string;
  amount: number;
  creatorProfileCpf: string;
}): Promise<WithdrawalRecord> {

  // A. Verificar se Saques estão Globamente Ativos (Item 43)
  if (!WITHDRAWAL_ENABLED) {
    throw new Error('Os saques estão temporariamente indisponíveis. Tente novamente mais tarde.');
  }

  // B. Verificar Valor Mínimo de Saque (Item 11)
  if (data.amount < MIN_WITHDRAWAL_AMOUNT) {
    throw new Error(`O valor mínimo para saque é de R$ ${MIN_WITHDRAWAL_AMOUNT.toFixed(2).replace('.', ',')}.`);
  }

  // C. Verificar se existe Chave PIX Ativa e Validada (Item 10)
  const activeKey = await getActiveCreatorPixKey(data.storeId);
  if (!activeKey || activeKey.validationStatus !== 'VALID') {
    throw new Error('Você precisa cadastrar e validar uma chave PIX CPF antes de solicitar um saque.');
  }

  // D. PREVENÇÃO DE RACE CONDITION E RESERVA DE SALDO VIA TRAVA ATÔMICA (RPC)
  const now = new Date().toISOString();
  const withdrawalId = `wtd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const externalRef = `withdrawal-${withdrawalId}`;

  const withdrawalRecord: WithdrawalRecord = {
    id: withdrawalId,
    creatorId: data.creatorId,
    storeId: data.storeId,
    amount: Number(data.amount.toFixed(2)),
    pixKeyId: activeKey.id,
    pixKeyType: 'CPF',
    pixKeyMasked: activeKey.pixKeyMasked,
    status: 'PENDING',
    asaasExternalReference: externalRef,
    requestedAt: now,
    createdAt: now
  };

  if (isRealSupabaseConfigured()) {
    // Chama o banco de dados para travar as linhas e inserir o saque atomicamente
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('process_withdrawal_safe', {
      p_store_id: data.storeId,
      p_creator_id: data.creatorId,
      p_amount: data.amount,
      p_pix_key_id: activeKey.id,
      p_pix_key_type: 'CPF',
      p_pix_key_masked: activeKey.pixKeyMasked,
      p_asaas_external_ref: externalRef,
      p_withdrawal_id: withdrawalId
    });

    if (rpcError) {
      console.error('[requestCreatorWithdrawal] Erro RPC:', rpcError);
      throw new Error(`Erro interno: ${rpcError.message} (Code: ${rpcError.code})`);
    }

    if (!rpcResult.success) {
      throw new Error(rpcResult.error || 'Não foi possível processar o saque de forma segura.');
    }
  } else {
    // Fallback de Simulação Local (Local Storage)
    const allWithdrawals = getLocalWithdrawals().filter(w => w.storeId === data.storeId);
    const inProgress = allWithdrawals.find(w => w.status === 'PENDING' || w.status === 'PROCESSING');
    if (inProgress) throw new Error('Você já possui uma solicitação de saque em processamento. Aguarde.');

    const walletSummary = await calculateCreatorWallet(data.storeId);
    if (data.amount > walletSummary.saldoDisponivel) throw new Error('Saldo insuficiente.');

    await recordWalletTransaction({
      storeId: data.storeId,
      orderId: withdrawalId,
      type: 'WITHDRAWAL',
      grossAmount: -data.amount,
      platformFixedFeeAmount: 0,
      platformPercentageFeeAmount: 0,
      platformFeeAmount: 0,
      asaasFeeAmount: 0,
      netAmount: -data.amount,
      description: `Reserva para Saque PIX ${activeKey.pixKeyMasked}`
    });

    const local = getLocalWithdrawals();
    local.unshift(withdrawalRecord);
    saveLocalWithdrawals(local);
  }

  // G. CRIAR TRANSFERÊNCIA PIX NA API DO ASAAS (Item 17)
  try {
    const asaasTransfer = await createAsaasTransfer({
      value: data.amount,
      pixAddressKey: activeKey.pixKey,
      pixAddressKeyType: 'CPF',
      description: `Saque Educalizando — Ref ${withdrawalId.substring(4, 10).toUpperCase()}`,
      externalReference: externalRef
    });

    // Atualizar status para PROCESSING com o ID retornado pelo Asaas
    withdrawalRecord.status = 'PROCESSING';
    withdrawalRecord.asaasTransferId = asaasTransfer.id;
    withdrawalRecord.processingAt = new Date().toISOString();

    if (isRealSupabaseConfigured()) {
      await supabase.from('withdrawals').update({
        status: 'PROCESSING',
        asaas_transfer_id: asaasTransfer.id,
        processing_at: withdrawalRecord.processingAt
      }).eq('id', withdrawalRecord.id);
    }

    const updatedLocal = getLocalWithdrawals();
    const idx = updatedLocal.findIndex(w => w.id === withdrawalRecord.id);
    if (idx !== -1) {
      updatedLocal[idx] = withdrawalRecord;
      saveLocalWithdrawals(updatedLocal);
    }

    return withdrawalRecord;

  } catch (err: any) {
    console.error('[requestCreatorWithdrawal] Erro ao criar transferência no Asaas:', err);

    // H. TRATAMENTO DE FALHA ANTES DA TRANSFERÊNCIA (Item 36)
    // Marca saque como FAILED e estorna a reserva no ledger de saldo
    withdrawalRecord.status = 'FAILED';
    withdrawalRecord.failureReason = err.message || 'Falha na API de transferência Asaas.';
    withdrawalRecord.failedAt = new Date().toISOString();

    await recordWalletTransaction({
      storeId: data.storeId,
      orderId: withdrawalId,
      type: 'ADJUSTMENT',
      grossAmount: data.amount,
      platformFixedFeeAmount: 0,
      platformPercentageFeeAmount: 0,
      platformFeeAmount: 0,
      asaasFeeAmount: 0,
      netAmount: data.amount,
      description: `Devolução de saldo por falha no saque (${withdrawalRecord.failureReason})`
    });

    if (isRealSupabaseConfigured()) {
      await supabase.from('withdrawals').update({
        status: 'FAILED',
        failure_reason: withdrawalRecord.failureReason,
        failed_at: withdrawalRecord.failedAt
      }).eq('id', withdrawalRecord.id);
    }

    const updatedLocal = getLocalWithdrawals();
    const idx = updatedLocal.findIndex(w => w.id === withdrawalRecord.id);
    if (idx !== -1) {
      updatedLocal[idx] = withdrawalRecord;
      saveLocalWithdrawals(updatedLocal);
    }

    throw new Error(`Não foi possível concluir seu saque: ${withdrawalRecord.failureReason}. O valor permaneceu no seu saldo disponível.`);
  }
}

// 4. Obter Histórico de Saques do Criador
export async function getWithdrawalsHistory(storeId: string): Promise<WithdrawalRecord[]> {
  if (isRealSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('store_id', storeId)
        .order('requested_at', { ascending: false });

      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          creatorId: d.creator_id,
          storeId: d.store_id,
          amount: Number(d.amount),
          pixKeyId: d.pix_key_id,
          pixKeyType: d.pix_key_type || 'CPF',
          pixKeyMasked: d.pix_key_masked,
          status: d.status as WithdrawalStatus,
          asaasTransferId: d.asaas_transfer_id,
          asaasExternalReference: d.asaas_external_reference,
          failureReason: d.failure_reason,
          requestedAt: d.requested_at,
          processingAt: d.processing_at,
          completedAt: d.completed_at,
          failedAt: d.failed_at,
          cancelledAt: d.cancelled_at,
          createdAt: d.created_at
        }));
      }
    } catch (e) {
      console.error('[getWithdrawalsHistory] Erro Supabase:', e);
    }
  }

  const local = getLocalWithdrawals();
  return local.filter(w => w.storeId === storeId).sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
}

// 5. Processamento dos Eventos de Webhook de Transferência do Asaas (Item 20-25)
export async function handleAsaasTransferWebhook(payload: { event: string; transfer: any; id?: string }): Promise<void> {
  const { event, transfer } = payload;
  if (!transfer) return;

  const eventId = payload.id || `evt_${event}_${transfer.id}_${Date.now()}`;
  const transferId = transfer.id;
  const externalRef = transfer.externalReference;

  // A. Remover cache local incompatível com backend Node.js
  console.log(`[Transfer Webhook] Evento: ${event} | TransferId: ${transferId} | ExternalRef: ${externalRef}`);

  let wId = externalRef ? externalRef.replace('withdrawal-', '') : null;
  let item: WithdrawalRecord | undefined = undefined;

  // B. Buscar saque NATIVAMENTE no banco de dados (Resolução do Bug Crítico de Busca)
  if (isRealSupabaseConfigured()) {
    try {
      let query = supabase.from('withdrawals').select('*');
      if (transferId && wId) {
        query = query.or(`asaas_transfer_id.eq.${transferId},id.eq.${wId}`);
      } else if (transferId) {
        query = query.eq('asaas_transfer_id', transferId);
      } else if (wId) {
        query = query.eq('id', wId);
      }

      const { data, error } = await query.single();
      if (!error && data) {
        item = {
          id: data.id,
          creatorId: data.creator_id,
          storeId: data.store_id,
          amount: Number(data.amount),
          pixKeyId: data.pix_key_id,
          pixKeyType: data.pix_key_type || 'CPF',
          pixKeyMasked: data.pix_key_masked,
          status: data.status as WithdrawalStatus,
          asaasTransferId: data.asaas_transfer_id,
          asaasExternalReference: data.asaas_external_reference,
          failureReason: data.failure_reason,
          requestedAt: data.requested_at,
          processingAt: data.processing_at,
          completedAt: data.completed_at,
          failedAt: data.failed_at,
          cancelledAt: data.cancelled_at,
          createdAt: data.created_at
        };
      }
    } catch (e) {
      console.error('[Transfer Webhook] Erro ao buscar saque no DB:', e);
    }
  }

  // Fallback para simulação local se DB não existir
  if (!item) {
    let withdrawals = getLocalWithdrawals();
    item = withdrawals.find(w => w.asaasTransferId === transferId || (wId && w.id === wId));
  }

  if (!item) {
    console.warn(`[Transfer Webhook] Saque não encontrado para TransferId ${transferId}`);
    return;
  }

  // C. TRANSFER_DONE -> Saque Concluído (Item 21)
  if (event === 'TRANSFER_DONE') {
    // TRAVA DE ESTADO / IDEMPOTÊNCIA: Evitar reprocessamento
    if (item.status === 'COMPLETED') {
      console.log(`[Transfer Webhook] Saque ${item.id} já estava COMPLETED. Ignorando evento repetido.`);
      return;
    }

    item.status = 'COMPLETED';
    item.completedAt = new Date().toISOString();

    if (isRealSupabaseConfigured()) {
      await supabase.from('withdrawals').update({
        status: 'COMPLETED',
        completed_at: item.completedAt
      }).eq('id', item.id);
    }
  }

  // D. TRANSFER_FAILED / TRANSFER_CANCELLED -> Falha e Devolução do Saldo (Item 22 & 23)
  else if (event === 'TRANSFER_FAILED' || event === 'TRANSFER_CANCELLED') {
    // TRAVA DE ESTADO / IDEMPOTÊNCIA: Prevenção CRÍTICA de duplo estorno
    if (item.status === 'FAILED' || item.status === 'CANCELLED') {
      console.warn(`[Transfer Webhook] ALERTA: Saque ${item.id} já estava ${item.status}. Evitando estorno em duplicidade (dinheiro infinito).`);
      return;
    }

    const isCancel = event === 'TRANSFER_CANCELLED';
    item.status = isCancel ? 'CANCELLED' : 'FAILED';
    item.failureReason = transfer.failReason || (isCancel ? 'Transferência cancelada' : 'Falha no processamento bancário');
    item.failedAt = new Date().toISOString();

    // Estornar a reserva devolvendo o valor ao saldo do criador
    await recordWalletTransaction({
      storeId: item.storeId,
      orderId: item.id,
      type: 'ADJUSTMENT',
      grossAmount: item.amount,
      platformFixedFeeAmount: 0,
      platformPercentageFeeAmount: 0,
      platformFeeAmount: 0,
      asaasFeeAmount: 0,
      netAmount: item.amount,
      description: `Estorno de saque ${isCancel ? 'cancelado' : 'falhado'} (${item.failureReason})`
    });

    if (isRealSupabaseConfigured()) {
      await supabase.from('withdrawals').update({
        status: item.status,
        failure_reason: item.failureReason,
        failed_at: item.failedAt
      }).eq('id', item.id);
    }
  }

  // Atualização em cache/fallback caso esteja rodando simulação visual
  if (typeof window !== 'undefined') {
    let withdrawals = getLocalWithdrawals();
    const idx = withdrawals.findIndex(w => w.id === item!.id);
    if (idx !== -1) {
      withdrawals[idx] = item;
      saveLocalWithdrawals(withdrawals);
    }
  }
}
