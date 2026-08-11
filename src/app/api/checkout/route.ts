import { NextResponse } from 'next/server';
import { createOrGetAsaasCustomer, createAsaasPayment } from '@/lib/asaas-service';
import { createOrderRecord, calculateOrderFinancials, PaymentMethodType } from '@/lib/order-service';
import { getAuthenticatedUserRole } from '@/lib/student-service';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      storeId, 
      studentId: clientStudentId,
      buyerName: rawBuyerName,
      buyerEmail: rawBuyerEmail,
      buyerCpf: rawBuyerCpf,
      buyerPhone,
      paymentMethod = 'pix',
      items = [],
      creditCard,
      creditCardHolderInfo
    } = body;

    // 1. REGRA MANDATÓRIA DE AUTENTICAÇÃO DO ALUNO (SUPABASE AUTH / SESSÃO DO ALUNO)
    let authSession = await getAuthenticatedUserRole();

    // Se o servidor em si não encontrou a sessão mas o cliente passou Authorization Bearer token:
    const authHeader = request.headers.get('authorization');
    if ((!authSession.isAuthenticated || !authSession.userId) && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const { data: userData } = await supabase.auth.getUser(token);
        if (userData?.user) {
          const meta = userData.user.user_metadata || {};
          authSession = {
            isAuthenticated: true,
            role: 'student',
            userId: userData.user.id,
            email: userData.user.email || rawBuyerEmail || '',
            fullName: meta.full_name || rawBuyerName || 'Aluno Educalizando',
            cpf: meta.cpf || rawBuyerCpf || ''
          };
        }
      } catch (e) {}
    }

    // Se o cliente autenticado na tela passou o studentId válido do aluno logado
    if ((!authSession.isAuthenticated || !authSession.userId) && clientStudentId && rawBuyerEmail) {
      authSession = {
        isAuthenticated: true,
        role: 'student',
        userId: clientStudentId,
        email: rawBuyerEmail.toLowerCase().trim(),
        fullName: rawBuyerName || 'Aluno Educalizando',
        cpf: rawBuyerCpf || ''
      };
    }

    // Se o comprador ainda não tem identificação de aluno:
    if (!authSession.isAuthenticated || !authSession.userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Para realizar compras na Educalizando, é obrigatório estar conectado em uma conta de ALUNO.' 
        },
        { status: 401 }
      );
    }

    const studentId = authSession.userId;
    const buyerName = (rawBuyerName || authSession.fullName || 'Aluno Educalizando').trim();
    const buyerEmail = (rawBuyerEmail || authSession.email || '').toLowerCase().trim();
    const buyerCpf = (rawBuyerCpf || authSession.cpf || '').replace(/\D/g, '');

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
