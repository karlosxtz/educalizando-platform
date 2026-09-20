import { supabase, supabaseAdmin, allowsLocalDevelopmentFallback, isRealSupabaseConfigured } from './supabase';
import { calculateCreatorWallet, recordWalletTransaction } from './wallet-service';
import { isValidCPF } from './infinitepay-service';

// CONFIGURAÇÃO CENTRALIZADA (Item 11 & 43 da Especificação)
export const MIN_WITHDRAWAL_AMOUNT = 0;
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
  netAmount?: number;
  withdrawalFee?: number;
  pixKeyId: string;
  pixKeyType: 'CPF';
  pixKeyMasked: string;
  status: WithdrawalStatus;
  asaasTransferId?: string | null;
  asaasExternalReference?: string | null;
  paymentReference?: string | null;
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
      const db = typeof window === 'undefined' ? supabaseAdmin : supabase;
      const { data, error } = await db
        .from('creator_pix_keys')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
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
      if (error) {
        console.error('[getActiveCreatorPixKey] Falha ao consultar chave PIX:', error.message);
      }
    } catch (e) {
      console.error('[getActiveCreatorPixKey] Erro Supabase:', e);
    }
  }

  const local = getLocalPixKeys();
  const found = local.find(k => k.storeId === storeId && k.isActive);
  if (found) return found;

  // Nunca invente uma chave válida em produção. Isso fazia a tela financeira
  // mostrar uma chave de exemplo e falhar quando o saque era validado no
  // servidor. O atalho existe somente para o modo local explicitamente ativado.
  if (allowsLocalDevelopmentFallback() && creatorCpf && creatorCpf.replace(/\D/g, '').length === 11) {
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

// 2. Cadastrar chave PIX CPF. A titularidade é conferida manualmente no pagamento do saque.
export async function registerCreatorPixKey(data: {
  storeId: string;
  creatorId: string;
  creatorProfileCpf: string;
  inputPixKey: string;
  holderName?: string;
  bankName?: string;
}): Promise<CreatorPixKey> {
  // Em produção, uma chave não pode existir somente no estado local. Falhamos
  // explicitamente para não informar ao criador que o cadastro foi salvo quando
  // as variáveis/integração do Supabase não estão disponíveis.
  if (!isRealSupabaseConfigured()) {
    throw new Error('A integração segura com o banco de dados não está configurada para cadastrar chaves PIX.');
  }

  const cleanInputCpf = data.inputPixKey.replace(/\D/g, '');
  const cleanProfileCpf = data.creatorProfileCpf.replace(/\D/g, '');

  if (cleanInputCpf.length !== 11) {
    throw new Error('A chave PIX deve ser um CPF válido com 11 dígitos.');
  }

  // REGRA 3: O CPF informado como chave PIX deve corresponder ao CPF cadastrado no perfil do criador
  if (cleanInputCpf !== cleanProfileCpf) {
    throw new Error('A chave PIX CPF precisa pertencer ao mesmo CPF cadastrado na sua conta.');
  }

  if (!isValidCPF(cleanInputCpf)) {
    throw new Error('O CPF informado como chave PIX é inválido.');
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
    holderName: data.holderName || 'Titular da conta',
    holderCpf: cleanInputCpf,
    validationStatus: 'VALID',
    validatedAt: now,
    isActive: true,
    createdAt: now,
    updatedAt: now
  };

  // Desativar chaves antigas se existirem (Item 8 da Especificação)
  const { data: saved, error } = await supabaseAdmin.rpc('register_creator_pix_key_safe', {
    p_id: newKey.id,
    p_creator_id: newKey.creatorId,
    p_store_id: newKey.storeId,
    p_pix_key: newKey.pixKey,
    p_pix_key_masked: newKey.pixKeyMasked,
    p_holder_name: newKey.holderName || null,
    p_holder_cpf: newKey.holderCpf || null,
    p_validated_at: newKey.validatedAt
  });
  if (error || saved !== true) {
    throw new Error(`Não foi possível cadastrar a chave PIX: ${error?.message || 'operação não confirmada'}`);
  }

  const local = getLocalPixKeys().map(k => k.storeId === data.storeId ? { ...k, isActive: false } : k);
  local.unshift(newKey);
  saveLocalPixKeys(local);

  return newKey;
}

// 3. Solicitar saque manual com reserva atômica do saldo
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
  let minimumWithdrawal = MIN_WITHDRAWAL_AMOUNT;
  if (isRealSupabaseConfigured()) {
    const { data: settings } = await supabaseAdmin.from('platform_settings').select('minimum_withdrawal_amount').limit(1).maybeSingle();
    minimumWithdrawal = Number(settings?.minimum_withdrawal_amount ?? MIN_WITHDRAWAL_AMOUNT);
  }
  if (data.amount < minimumWithdrawal) {
    throw new Error(`O valor mínimo para saque é de R$ ${minimumWithdrawal.toFixed(2).replace('.', ',')}.`);
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
    const { supabaseAdmin } = await import('./supabase');
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

  // A transferência é feita manualmente pela administração na conta InfinitePay.
  return withdrawalRecord;
}

// 4. Obter Histórico de Saques do Criador
export async function getWithdrawalsHistory(storeId: string): Promise<WithdrawalRecord[]> {
  if (isRealSupabaseConfigured()) {
    try {
      const db = typeof window === 'undefined' ? supabaseAdmin : supabase;
      const { data, error } = await db
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
          netAmount: Number(d.net_amount ?? d.amount),
          withdrawalFee: Number(d.withdrawal_fee || 0),
          pixKeyId: d.pix_key_id,
          pixKeyType: d.pix_key_type || 'CPF',
          pixKeyMasked: d.pix_key_masked,
          status: d.status as WithdrawalStatus,
          asaasTransferId: d.asaas_transfer_id,
          asaasExternalReference: d.asaas_external_reference,
          paymentReference: d.payment_reference,
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
