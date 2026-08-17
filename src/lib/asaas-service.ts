/**
 * =============================================================================
 * EDUCALIZANDO — INTEGRATION: ASAAS API V3 SERVICE (SERVER-SIDE ONLY)
 * =============================================================================
 * ATENÇÃO: Este serviço executa exclusivamente no lado do servidor (Server-side / Route Handlers).
 * A ASAAS_API_KEY NUNCA deve ser exposta ao cliente.
 * =============================================================================
 */

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'access_token': ASAAS_API_KEY
  };
}

// =============================================================================
// RETRY COM BACKOFF EXPONENCIAL
// Tenta até maxRetries vezes em caso de erros transitórios (5xx, rede).
// Erros de negócio (4xx) NÃO são retentados.
// =============================================================================
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  const RETRY_DELAYS_MS = [500, 1000, 2000]; // backoff: 0.5s → 1s → 2s

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);

      // Erros de cliente (4xx) não merecem retry — falha rápida
      if (res.status >= 400 && res.status < 500) return res;

      // Sucesso ou erro de servidor (5xx) → retry se ainda tiver tentativas
      if (res.ok || attempt === maxRetries) return res;

      console.warn(`[Asaas] Tentativa ${attempt + 1}/${maxRetries + 1} falhou (HTTP ${res.status}) para ${url}. Aguardando ${RETRY_DELAYS_MS[attempt]}ms...`);
    } catch (networkErr) {
      if (attempt === maxRetries) throw networkErr;
      console.warn(`[Asaas] Erro de rede na tentativa ${attempt + 1}/${maxRetries + 1} para ${url}:`, networkErr);
    }

    await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS_MS[attempt] ?? 2000));
  }

  // Nunca atingido, mas satisfaz o tipo de retorno
  throw new Error(`[Asaas] Todas as ${maxRetries + 1} tentativas falharam para ${url}`);
}

export interface AsaasCustomerData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
}

export interface AsaasPaymentParams {
  customerId: string;
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  value: number;
  externalReference: string; // Order ID
  description: string;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
}

export interface AsaasPaymentResult {
  id: string;
  status: string;
  billingType: string;
  value: number;
  externalReference: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixQrCodeBase64?: string;
  pixCopyPastePayload?: string;
}

export interface AsaasPixKeyLookupResult {
  valid: boolean;
  key?: string;
  keyType?: string;
  accountHolderName?: string;
  accountHolderCpfCnpj?: string;
  errorMessage?: string;
}

export interface AsaasTransferParams {
  value: number;
  pixAddressKey: string;
  pixAddressKeyType: 'CPF';
  description: string;
  externalReference: string; // withdrawal-{id}
}

export interface AsaasTransferResult {
  id: string;
  status: string;
  value: number;
  netValue?: number;
  dateCreated: string;
  scheduleDate?: string;
}

export function isValidCPF(cpf: string): boolean {
  const clean = (cpf || '').replace(/\D/g, '');
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;

  let sum = 0;
  let remainder = 0;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(clean.substring(i - 1, i), 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean.substring(9, 10), 10)) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(clean.substring(i - 1, i), 10) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean.substring(10, 11), 10)) return false;

  return true;
}

// 1. Criar ou Buscar Cliente no Asaas (Cache por CPF/Email para evitar duplicatas)
export async function createOrGetAsaasCustomer(data: AsaasCustomerData): Promise<string> {
  const cleanCpf = (data.cpfCnpj || '').replace(/\D/g, '');
  let cleanEmail = (data.email || '').trim().toLowerCase();

  // Sanitização de e-mail (erros comuns de digitação)
  cleanEmail = cleanEmail
    .replace(/\.commm$/i, '.com')
    .replace(/\.comm$/i, '.com')
    .replace(/\.coom$/i, '.com')
    .replace(/\.cmo$/i, '.com');

  if (!cleanEmail.includes('@') || cleanEmail.length < 5) {
    throw new Error('Por favor, informe um endereço de e-mail válido para o recibo da compra.');
  }

  // Validação estrita do CPF antes de qualquer chamada ao Asaas
  if (!isValidCPF(cleanCpf)) {
    throw new Error('O CPF informado é inválido. Por favor, verifique os dígitos digitados.');
  }

  const apiKeyHeader = getHeaders();
  console.log(`[ASAAS SERVICE] API URL: ${ASAAS_API_URL}`);
  console.log(`[ASAAS SERVICE] Token Prefix: ${(ASAAS_API_KEY || '').substring(0, 15)}...`);

  // A. Buscar cliente existente por CPF
  if (cleanCpf && cleanCpf.length === 11) {
    const searchRes = await fetchWithRetry(
      `${ASAAS_API_URL}/customers?cpfCnpj=${cleanCpf}`,
      { method: 'GET', headers: apiKeyHeader }
    );

    if (searchRes.ok) {
      try {
        const searchData = await searchRes.json();
        if (searchData.data?.length > 0 && searchData.data[0].id) {
          return searchData.data[0].id;
        }
      } catch (e) {}
    }
  }

  // B. Buscar cliente existente por E-mail
  if (cleanEmail) {
    const searchEmailRes = await fetchWithRetry(
      `${ASAAS_API_URL}/customers?email=${encodeURIComponent(cleanEmail)}`,
      { method: 'GET', headers: apiKeyHeader }
    );

    if (searchEmailRes.ok) {
      try {
        const searchData = await searchEmailRes.json();
        if (searchData.data?.length > 0 && searchData.data[0].id) {
          return searchData.data[0].id;
        }
      } catch (e) {}
    }
  }

  // C. Criar novo cliente no Asaas
  const createPayload = {
    name: data.name,
    email: cleanEmail,
    cpfCnpj: cleanCpf,
    mobilePhone: data.phone ? data.phone.replace(/\D/g, '') : undefined
  };

  const createRes = await fetchWithRetry(`${ASAAS_API_URL}/customers`, {
    method: 'POST',
    headers: apiKeyHeader,
    body: JSON.stringify(createPayload)
  });

  const createText = await createRes.text();

  if (!createRes.ok) {
    let friendlyError = '';
    try {
      const parsed = JSON.parse(createText);
      if (parsed.errors?.length > 0) {
        friendlyError = parsed.errors.map((e: any) => e.description).join('; ');
      }
    } catch (e) {}
    console.error('[createOrGetAsaasCustomer] Falha ao criar cliente:', createText);
    throw new Error(friendlyError || 'Erro ao cadastrar comprador no gateway Asaas. Verifique o CPF e E-mail digitados.');
  }

  const createdData = JSON.parse(createText);
  if (!createdData?.id) {
    throw new Error('Falha crítica: Resposta da API do Asaas não continha um ID de cliente válido.');
  }

  return createdData.id;
}

// 2. Criar Cobrança no Asaas (POST /payments)
export async function createAsaasPayment(params: AsaasPaymentParams): Promise<AsaasPaymentResult> {
  const today = new Date();
  const dueDateStr = today.toISOString().split('T')[0];

  if (
    !ASAAS_API_KEY || 
    ASAAS_API_KEY.includes('demo') || 
    ASAAS_API_KEY === '' || 
    params.customerId.startsWith('cus_demo_') || 
    params.customerId.startsWith('cus_fallback_')
  ) {
    console.log('[Asaas Service] Modo Sandbox/Demo — simulando cobrança Asaas para Order:', params.externalReference);
    const mockPaymentId = `pay_demo_${Date.now()}`;
    const mockCopyPaste = `00020101021226870014BR.GOV.BCB.PIX2565pix.asaas.com/qr/p/v2/${mockPaymentId}5204000053039865405${params.value.toFixed(2)}5802BR5925Educalizando Plataforma6009SAO PAULO62070503***6304E8A2`;
    const mockQrBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    return {
      id: mockPaymentId,
      status: params.billingType === 'PIX' ? 'PENDING' : 'CONFIRMED',
      billingType: params.billingType,
      value: params.value,
      externalReference: params.externalReference,
      pixCopyPastePayload: mockCopyPaste,
      pixQrCodeBase64: mockQrBase64,
      invoiceUrl: `https://sandbox.asaas.com/i/${mockPaymentId}`
    };
  }

  try {
    const payload: any = {
      customer: params.customerId,
      billingType: params.billingType,
      value: params.value,
      dueDate: dueDateStr,
      description: params.description,
      externalReference: params.externalReference
    };

    if (params.billingType === 'CREDIT_CARD' && params.creditCard && params.creditCardHolderInfo) {
      payload.creditCard = params.creditCard;
      payload.creditCardHolderInfo = params.creditCardHolderInfo;
    }

    const response = await fetchWithRetry(`${ASAAS_API_URL}/payments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();

    if (!response.ok) {
      let friendlyMsg = '';
      try {
        const parsed = JSON.parse(responseText);
        if (parsed.errors?.length > 0) {
          friendlyMsg = parsed.errors.map((e: any) => e.description).join('; ');
        }
      } catch (e) {}
      console.error('[createAsaasPayment] Falha na API Asaas:', responseText);
      throw new Error(friendlyMsg || 'Erro ao gerar cobrança no gateway de pagamento.');
    }

    const payData = JSON.parse(responseText);
    const result: AsaasPaymentResult = {
      id: payData.id,
      status: payData.status,
      billingType: payData.billingType,
      value: payData.value,
      externalReference: payData.externalReference,
      invoiceUrl: payData.invoiceUrl,
      bankSlipUrl: payData.bankSlipUrl
    };

    if (params.billingType === 'PIX') {
      const pixData = await getAsaasPixQrCode(payData.id);
      result.pixQrCodeBase64 = pixData.pixQrCodeBase64;
      result.pixCopyPastePayload = pixData.pixCopyPastePayload;
    }

    return result;
  } catch (err: any) {
    console.error('[createAsaasPayment] Erro:', err.message);
    throw err;
  }
}

// 3. Buscar QR Code e Payload Copia e Cola do PIX (GET /payments/{id}/pixQrCode)
export async function getAsaasPixQrCode(paymentId: string): Promise<{ pixQrCodeBase64?: string; pixCopyPastePayload?: string }> {
  if (!ASAAS_API_KEY || ASAAS_API_KEY.includes('demo') || paymentId.startsWith('pay_demo_')) {
    return {
      pixCopyPastePayload: `00020101021226870014BR.GOV.BCB.PIX2565pix.asaas.com/qr/p/v2/${paymentId}520400005303986540510.005802BR5925Educalizando Plataforma6009SAO PAULO62070503***6304E8A2`,
      pixQrCodeBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    };
  }

  try {
    const res = await fetchWithRetry(
      `${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`,
      { method: 'GET', headers: getHeaders() }
    );

    if (!res.ok) {
      console.error('[getAsaasPixQrCode] Falha ao obter QR Code PIX:', await res.text());
      return {};
    }

    const data = await res.json();
    return {
      pixQrCodeBase64: data.encodedImage
        ? (data.encodedImage.startsWith('data:') ? data.encodedImage : `data:image/png;base64,${data.encodedImage}`)
        : undefined,
      pixCopyPastePayload: data.payload
    };
  } catch (err) {
    console.error('[getAsaasPixQrCode] Erro:', err);
    return {};
  }
}

// 4. Consultar Status Atual da Cobrança (GET /payments/{id})
export async function getAsaasPaymentStatus(paymentId: string): Promise<{ status: string; paidAt?: string }> {
  if (!ASAAS_API_KEY || ASAAS_API_KEY.includes('demo') || paymentId.startsWith('pay_demo_')) {
    return { status: 'CONFIRMED', paidAt: new Date().toISOString() };
  }

  try {
    const res = await fetch(`${ASAAS_API_URL}/payments/${paymentId}`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!res.ok) return { status: 'PENDING' };
    const data = await res.json();
    return {
      status: data.status,
      paidAt: data.confirmedDate || data.paymentDate
    };
  } catch (err) {
    return { status: 'PENDING' };
  }
}

// 5. Consulta de Titularidade da Chave PIX CPF no Asaas (GET /pix/addressKeys/external?type=CPF&key={cleanCpf})
export async function lookupAsaasPixKey(cleanCpf: string): Promise<AsaasPixKeyLookupResult> {
  if (!ASAAS_API_KEY || ASAAS_API_KEY.includes('demo') || ASAAS_API_KEY === '') {
    console.log('[Asaas Service] Modo Demo — Simulando validação de chave PIX CPF no Asaas:', cleanCpf);
    return {
      valid: true,
      key: cleanCpf,
      keyType: 'CPF',
      accountHolderName: 'Professor Criador Educalizando',
      accountHolderCpfCnpj: cleanCpf
    };
  }

  try {
    const res = await fetchWithRetry(
      `${ASAAS_API_URL}/pix/addressKeys/external?type=CPF&key=${cleanCpf}`,
      { method: 'GET', headers: getHeaders() }
    );

    if (!res.ok) {
      console.warn('[lookupAsaasPixKey] Falha na consulta Asaas:', await res.text());
      return {
        valid: false,
        errorMessage: 'Não foi possível confirmar a titularidade da chave PIX no Asaas. Verifique os dados e tente novamente.'
      };
    }

    const data = await res.json();
    return {
      valid: true,
      key: data.key || cleanCpf,
      keyType: data.type || 'CPF',
      accountHolderName: data.accountHolder?.name || data.accountHolderName,
      accountHolderCpfCnpj: data.accountHolder?.cpfCnpj || data.accountHolderCpfCnpj || cleanCpf
    };
  } catch (err: any) {
    console.error('[lookupAsaasPixKey] Erro de conexão:', err);
    return {
      valid: false,
      errorMessage: 'Erro de conexão ao consultar a chave PIX no Asaas.'
    };
  }
}

// 6. Criar Transferência PIX para Saque no Asaas (POST /transfers)
export async function createAsaasTransfer(params: AsaasTransferParams): Promise<AsaasTransferResult> {
  if (!ASAAS_API_KEY || ASAAS_API_KEY.includes('demo') || ASAAS_API_KEY === '') {
    console.log('[Asaas Service] Modo Demo — Simulando criação de transferência PIX Asaas:', params);
    const mockId = `trf_demo_${Date.now()}`;
    return {
      id: mockId,
      status: 'BANK_PROCESSING',
      value: params.value,
      dateCreated: new Date().toISOString()
    };
  }

  try {
    const payload = {
      value: params.value,
      pixAddressKey: params.pixAddressKey,
      pixAddressKeyType: 'CPF',
      operationType: 'PIX',
      description: params.description,
      externalReference: params.externalReference
    };

    const res = await fetchWithRetry(`${ASAAS_API_URL}/transfers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[createAsaasTransfer] Falha na API Asaas:', errText);
      throw new Error(`Erro ao gerar transferência no Asaas (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return {
      id: data.id,
      status: data.status || 'PENDING',
      value: data.value,
      netValue: data.netValue,
      dateCreated: data.dateCreated || new Date().toISOString(),
      scheduleDate: data.scheduleDate
    };
  } catch (err: any) {
    console.error('[createAsaasTransfer] Erro:', err);
    throw err;
  }
}
