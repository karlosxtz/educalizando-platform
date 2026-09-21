import { getConfiguredInfinitePayHandle } from './financial-configuration';

const INFINITEPAY_API_URL = 'https://api.checkout.infinitepay.io';

export interface InfinitePayCheckoutItem {
  quantity: number;
  price: number;
  description: string;
}

export interface InfinitePayPaymentReference {
  orderNsu: string;
  transactionNsu: string;
  slug: string;
}

async function readApiResponse(response: Response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error('A InfinitePay retornou uma resposta inválida.');
  }
}

export async function createInfinitePayCheckout(params: {
  orderNsu: string;
  redirectUrl: string;
  webhookUrl: string;
  items: InfinitePayCheckoutItem[];
  customer?: { name: string; email: string; phoneNumber?: string };
}) {
  const handle = getConfiguredInfinitePayHandle();

  const response = await fetch(`${INFINITEPAY_API_URL}/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      handle,
      order_nsu: params.orderNsu,
      redirect_url: params.redirectUrl,
      webhook_url: params.webhookUrl,
      items: params.items,
      customer: params.customer ? {
        name: params.customer.name,
        email: params.customer.email,
        phone_number: params.customer.phoneNumber
      } : undefined
    }),
    cache: 'no-store'
  });
  const data = await readApiResponse(response);

  if (!response.ok || typeof data.url !== 'string' || !data.url.startsWith('https://')) {
    console.error('[InfinitePay] Falha ao criar checkout:', response.status, data);
    throw new Error('Não foi possível abrir o pagamento na InfinitePay. Tente novamente.');
  }

  return { checkoutUrl: data.url as string };
}

export async function checkInfinitePayPayment(reference: InfinitePayPaymentReference) {
  const handle = getConfiguredInfinitePayHandle();
  const response = await fetch(`${INFINITEPAY_API_URL}/payment_check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      handle,
      order_nsu: reference.orderNsu,
      transaction_nsu: reference.transactionNsu,
      slug: reference.slug
    }),
    cache: 'no-store'
  });
  const data = await readApiResponse(response);

  if (!response.ok || data.success !== true) {
    throw new Error('Não foi possível confirmar o pagamento na InfinitePay.');
  }

  return {
    paid: data.paid === true,
    amountInCents: Number(data.amount || 0),
    paidAmountInCents: Number(data.paid_amount || 0),
    installments: Number(data.installments || 1),
    captureMethod: String(data.capture_method || '')
  };
}

export function isValidCPF(cpf: string): boolean {
  const clean = (cpf || '').replace(/\D/g, '');
  if (clean.length !== 11 || /^(\d)\1{10}$/.test(clean)) return false;

  const calculateDigit = (length: number) => {
    let sum = 0;
    for (let index = 0; index < length; index++) {
      sum += Number(clean[index]) * (length + 1 - index);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return calculateDigit(9) === Number(clean[9]) && calculateDigit(10) === Number(clean[10]);
}
