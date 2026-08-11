import { NextResponse } from 'next/server';
import { createOrGetAsaasCustomer, createAsaasPayment } from '@/lib/asaas-service';
import { createOrderRecord, calculateOrderFinancials, PaymentMethodType } from '@/lib/order-service';
import { getAuthenticatedUserRole } from '@/lib/student-service';

export async function POST(request: Request) {
  try {
    // 1. DADOS DE AUTENTICAÇÃO DO COMPRADOR (SE LOGADO) OU COMPRA DIRETA
    const authSession = await getAuthenticatedUserRole();
    const body = await request.json();
    const { 
      storeId, 
      paymentMethod = 'pix',
      items = [],
      creditCard,
      creditCardHolderInfo
    } = body;

    // Se estiver logado como aluno, prioriza a sessão do aluno, caso contrário usa os dados informados no formulário
    const studentId = (authSession.isAuthenticated && authSession.role === 'student' && authSession.userId)
      ? authSession.userId 
      : (body.buyerEmail || '').toLowerCase().trim();

    const buyerName = body.buyerName || authSession.fullName || 'Comprador Educalizando';
    const buyerEmail = (body.buyerEmail || authSession.email || '').toLowerCase().trim();
    const buyerCpf = (body.buyerCpf || authSession.cpf || '').replace(/\D/g, '');

    // 2. Validação Estrita dos Campos Obrigatórios
    if (!storeId || !buyerName || !buyerEmail || buyerCpf.length !== 11 || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Por favor, informe seu Nome Completo, E-mail e CPF válido para o recibo da compra.' },
        { status: 400 }
      );
    }

    // 3. REGRA FUNDAMENTAL (SERVIDOR): UMA COMPRA = UMA LOJA
    const invalidStoreItem = items.find((it: any) => it.storeId !== storeId);
    if (invalidStoreItem) {
      return NextResponse.json(
        { success: false, error: 'Todos os produtos do pedido devem pertencer exclusivamente à mesma loja.' },
        { status: 400 }
      );
    }

    // 4. Método de Pagamento Normalizado
    const normalizedMethod: PaymentMethodType = 
      paymentMethod.toLowerCase() === 'credit_card' ? 'credit_card' : 
      paymentMethod.toLowerCase() === 'boleto' ? 'boleto' : 'pix';

    const asaasBillingType = 
      normalizedMethod === 'credit_card' ? 'CREDIT_CARD' :
      normalizedMethod === 'boleto' ? 'BOLETO' : 'PIX';

    // 5. Fonte Única da Verdade Financeira (Cálculo no Servidor)
    const financials = calculateOrderFinancials(items, 0);

    // 6. Criar ou Obter Cliente no Asaas (executado exclusivamente no servidor)
    const asaasCustomerId = await createOrGetAsaasCustomer({
      name: buyerName,
      email: buyerEmail,
      cpfCnpj: buyerCpf,
      phone: body.buyerPhone
    });

    const tempOrderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // 7. Criar Cobrança Centralizada no Asaas (POST /payments)
    const asaasPayment = await createAsaasPayment({
      customerId: asaasCustomerId,
      billingType: asaasBillingType,
      value: financials.totalAmount,
      externalReference: tempOrderId,
      description: `Educalizando — Pedido #${tempOrderId.substring(4, 10).toUpperCase()} (${items[0]?.productTitle || 'Infoproduto'})`,
      creditCard,
      creditCardHolderInfo
    });

    // 8. Persistir Pedido no Banco / Local com Vínculo Obrigatório ao student_id
    const orderRecord = await createOrderRecord({
      storeId,
      buyerName,
      buyerEmail,
      buyerCpf,
      buyerPhone: body.buyerPhone,
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
      studentId,
      status: orderRecord.status,
      asaasPaymentId: asaasPayment.id,
      paymentMethod: normalizedMethod,
      subtotalAmount: orderRecord.subtotalAmount,
      totalAmount: orderRecord.totalAmount,
      platformFeeAmount: orderRecord.platformFeeAmount,
      creatorNetAmount: orderRecord.creatorNetAmount,
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
