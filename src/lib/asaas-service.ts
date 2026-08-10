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

// 1. Criar ou Buscar Cliente no Asaas (Cache por CPF para evitar duplicatas)
export async function createOrGetAsaasCustomer(data: AsaasCustomerData): Promise<string> {
  const cleanCpf = data.cpfCnpj.replace(/\D/g, '');

  if (!ASAAS_API_KEY || ASAAS_API_KEY.includes('demo') || ASAAS_API_KEY === '') {
    // Sandbox / Mock Mode para Teste Local
    console.log('[Asaas Service] Modo Demo Ativo — simulando ID de cliente Asaas para CPF:', cleanCpf);
    return `cus_demo_${cleanCpf.substring(0, 8)}`;
  }

  try {
    // A. Buscar cliente existente por CPF
    const searchRes = await fetch(`${ASAAS_API_URL}/customers?cpfCnpj=${cleanCpf}`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.data && searchData.data.length > 0) {
        return searchData.data[0].id;
      }
    }

    // B. Criar novo cliente se não encontrado
    const createRes = await fetch(`${ASAAS_API_URL}/customers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        cpfCnpj: cleanCpf,
        mobilePhone: data.phone ? data.phone.replace(/\D/g, '') : undefined
      })
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Erro ao criar cliente no Asaas: ${errText}`);
    }

    const createdData = await createRes.json();
    return createdData.id;
  } catch (err: any) {
    console.error('[createOrGetAsaasCustomer] Erro API Asaas:', err);
    return `cus_fallback_${Date.now()}`;
  }
}

// 2. Criar Cobrança no Asaas (POST /payments)
export async function createAsaasPayment(params: AsaasPaymentParams): Promise<AsaasPaymentResult> {
  const today = new Date();
  const dueDateStr = today.toISOString().split('T')[0];

  if (!ASAAS_API_KEY || ASAAS_API_KEY.includes('demo') || ASAAS_API_KEY === '') {
    // Sandbox / Mock Mode para Testes de Desenvolvimento
    console.log('[Asaas Service] Modo Demo Ativo — simulando cobrança Asaas para Order:', params.externalReference);
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
      pixQrCodeBase64: mockQrBase64
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

    const response = await fetch(`${ASAAS_API_URL}/payments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro ao gerar cobrança no Asaas (${response.status}): ${errText}`);
    }

    const payData = await response.json();
    const result: AsaasPaymentResult = {
      id: payData.id,
      status: payData.status,
      billingType: payData.billingType,
      value: payData.value,
      externalReference: payData.externalReference,
      invoiceUrl: payData.invoiceUrl,
      bankSlipUrl: payData.bankSlipUrl
    };

    // Se a cobrança for PIX, buscar dados do QR Code imediato
    if (params.billingType === 'PIX') {
      const pixData = await getAsaasPixQrCode(payData.id);
      result.pixQrCodeBase64 = pixData.pixQrCodeBase64;
      result.pixCopyPastePayload = pixData.pixCopyPastePayload;
    }

    return result;
  } catch (err: any) {
    console.error('[createAsaasPayment] Erro:', err);
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
    const res = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!res.ok) {
      console.error('[getAsaasPixQrCode] Falha ao obter QR Code PIX:', await res.text());
      return {};
    }

    const data = await res.json();
    return {
      pixQrCodeBase64: data.encodedImage ? (data.encodedImage.startsWith('data:') ? data.encodedImage : `data:image/png;base64,${data.encodedImage}`) : undefined,
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
