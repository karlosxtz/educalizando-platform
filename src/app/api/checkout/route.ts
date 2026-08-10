import { NextResponse } from 'next/server';
import { createOrGetAsaasCustomer, createAsaasPayment } from '@/lib/asaas-service';
import { createOrderRecord, PaymentMethodType } from '@/lib/order-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      storeId, 
      buyerName, 
      buyerEmail, 
      buyerCpf, 
      buyerPhone, 
      paymentMethod = 'pix',
      items = [],
      creditCard,
      creditCardHolderInfo
    } = body;

    // 1. Validação Estrita dos Campos Obrigatórios
    if (!storeId || !buyerName || !buyerEmail || !buyerCpf || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Por favor, preencha todos os campos obrigatórios (Nome, E-mail, CPF).' },
        { status: 400 }
      );
    }

    const cleanCpf = buyerCpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      return NextResponse.json(
        { success: false, error: 'O CPF informado é inválido. Digite um CPF válido com 11 dígitos.' },
        { status: 400 }
      );
    }

    // 2. Método de Pagamento Normalizado
    const normalizedMethod: PaymentMethodType = 
      paymentMethod.toLowerCase() === 'credit_card' ? 'credit_card' : 
      paymentMethod.toLowerCase() === 'boleto' ? 'boleto' : 'pix';

    const asaasBillingType = 
      normalizedMethod === 'credit_card' ? 'CREDIT_CARD' :
      normalizedMethod === 'boleto' ? 'BOLETO' : 'PIX';

    // 3. Criar ou Obter Cliente no Asaas (executado exclusivamente no servidor)
    const asaasCustomerId = await createOrGetAsaasCustomer({
      name: buyerName,
      email: buyerEmail,
      cpfCnpj: cleanCpf,
      phone: buyerPhone
    });

    // 4. Calcular Valor Total dos Itens
    const totalAmount = items.reduce((sum: number, it: any) => sum + Number(it.unitPrice || 0), 0);

    // 5. Criar Registro Inicial do Pedido com Taxas Congeladas
    const tempOrderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // 6. Criar Cobrança Centralizada no Asaas (POST /payments)
    const asaasPayment = await createAsaasPayment({
      customerId: asaasCustomerId,
      billingType: asaasBillingType,
      value: totalAmount,
      externalReference: tempOrderId,
      description: `Educalizando — Pedido #${tempOrderId.substring(4, 10).toUpperCase()} (${items[0]?.productTitle || 'Infoproduto'})`,
      creditCard,
      creditCardHolderInfo
    });

    // 7. Persistir Pedido com o ID da Cobrança Asaas
    const orderRecord = await createOrderRecord({
      storeId,
      buyerName,
      buyerEmail,
      buyerCpf: cleanCpf,
      buyerPhone,
      paymentMethod: normalizedMethod,
      items,
      asaasPaymentId: asaasPayment.id,
      asaasCustomerId,
      pixCopyPaste: asaasPayment.pixCopyPastePayload,
      pixQrCodeBase64: asaasPayment.pixQrCodeBase64
    });

    return NextResponse.json({
      success: true,
      orderId: orderRecord.id,
      status: orderRecord.status,
      asaasPaymentId: asaasPayment.id,
      paymentMethod: normalizedMethod,
      totalAmount: orderRecord.totalAmount,
      pixQrCodeBase64: asaasPayment.pixQrCodeBase64,
      pixCopyPastePayload: asaasPayment.pixCopyPastePayload,
      bankSlipUrl: asaasPayment.bankSlipUrl
    });

  } catch (error: any) {
    console.error('[API Checkout Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao processar o checkout.' },
      { status: 500 }
    );
  }
}
