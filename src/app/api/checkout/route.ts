import { NextResponse } from 'next/server';
import { createOrGetAsaasCustomer, createAsaasPayment, isValidCPF } from '@/lib/asaas-service';
import { createOrderRecord, calculateOrderFinancials, PaymentMethodType } from '@/lib/order-service';
import { getAuthenticatedUserRole } from '@/lib/student-service';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      storeId, 
      buyerName: rawBuyerName,
      buyerEmail: rawBuyerEmail,
      buyerCpf: rawBuyerCpf,
      buyerPhone,
      paymentMethod = 'pix',
      items = [],
      creditCard,
      creditCardHolderInfo,
      isPlrPurchase = false
    } = body;

    // 1. REGRA MANDATÓRIA DE AUTENTICAÇÃO (SUPABASE AUTH)
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
            role: isPlrPurchase ? 'creator' : 'student',
            userId: userData.user.id,
            email: userData.user.email || rawBuyerEmail || '',
            fullName: meta.full_name || rawBuyerName || (isPlrPurchase ? 'Criador' : 'Aluno Educalizando'),
            cpf: meta.cpf || rawBuyerCpf || ''
          };
        }
      } catch (e) {}
    }

    // Se o comprador não tem identificação válida:
    if (!authSession.isAuthenticated || !authSession.userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: isPlrPurchase 
            ? 'Para comprar Licenças PLR, é obrigatório estar conectado em uma conta de CRIADOR.' 
            : 'Para realizar compras na Educalizando, é obrigatório estar conectado em uma conta de ALUNO.' 
        },
        { status: 401 }
      );
    }
    
    // Verificação de Role (Papel)
    if (isPlrPurchase && authSession.role !== 'creator') {
      return NextResponse.json(
        { success: false, error: 'Apenas CRIADORES podem comprar Licenças PLR.' },
        { status: 401 }
      );
    }

    const studentId = authSession.userId; // Será usado como ID do comprador (seja aluno ou criador)
    const buyerName = (rawBuyerName || authSession.fullName || (isPlrPurchase ? 'Criador' : 'Aluno')).trim();
    const buyerEmail = (rawBuyerEmail || authSession.email || '').toLowerCase().trim();
    const buyerCpf = (rawBuyerCpf || authSession.cpf || '').replace(/\D/g, '');

    // 2. Validação Estrita dos Campos Obrigatórios e Validação do CPF
    if (!storeId || !buyerName || !buyerEmail || !isValidCPF(buyerCpf) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Por favor, informe seu Nome Completo, E-mail e um CPF válido para a emissão do recibo.' },
        { status: 400 }
      );
    }

    // 3. Buscar Produtos Reais no Banco e Validar (SERVER-SIDE PRICE)
    const productIds = items.map((it: any) => it.productId).filter(Boolean);
    if (productIds.length === 0) {
      return NextResponse.json({ success: false, error: 'Carrinho vazio ou inválido.' }, { status: 400 });
    }

    const { data: realProducts, error: dbError } = await supabase
      .from('products')
      .select('id, preco, preco_plr, is_plr, store_id, status, titulo')
      .in('id', productIds);

    if (dbError || !realProducts || realProducts.length !== productIds.length) {
      return NextResponse.json({ success: false, error: 'Um ou mais produtos não existem ou estão indisponíveis.' }, { status: 400 });
    }

    // 4. Reconstruir array de items com PREÇO REAL e QUANTIDADE validada
    const realItems: any[] = [];
    for (const item of items) {
      const realProd = realProducts.find((p: any) => p.id === item.productId);
      if (!realProd) continue;

      if (realProd.status !== 'publicado') {
        return NextResponse.json({ success: false, error: `Produto indisponível para venda: ${realProd.titulo}` }, { status: 400 });
      }

      if (realProd.store_id !== storeId) {
        return NextResponse.json({ success: false, error: 'Todos os produtos devem pertencer exclusivamente à mesma loja.' }, { status: 400 });
      }
      
      if (isPlrPurchase && !realProd.is_plr) {
        return NextResponse.json({ success: false, error: 'Este produto não possui licença PLR habilitada.' }, { status: 400 });
      }

      const rawQuantity = Number(item.quantity);
      const validQuantity = (isNaN(rawQuantity) || rawQuantity < 1 || !Number.isInteger(rawQuantity)) ? 1 : rawQuantity;
      const safeQuantity = Math.min(validQuantity, 10);

      realItems.push({
        ...item,
        productTitle: isPlrPurchase ? `${realProd.titulo} (Licença PLR)` : realProd.titulo,
        unitPrice: Number(isPlrPurchase ? (realProd.preco_plr || realProd.preco) : realProd.preco), // PREÇO DEFINIDO PELO SERVIDOR!
        quantity: safeQuantity,
        storeId: realProd.store_id // Garante storeId correto
      });
    }

    // 4b. Método de Pagamento Normalizado
    const normalizedMethod: PaymentMethodType = 
      paymentMethod.toLowerCase() === 'credit_card' ? 'credit_card' : 
      paymentMethod.toLowerCase() === 'boleto' ? 'boleto' : 'pix';

    const asaasBillingType = 
      normalizedMethod === 'credit_card' ? 'CREDIT_CARD' :
      normalizedMethod === 'boleto' ? 'BOLETO' : 'PIX';

    // 5. Fonte Única da Verdade Financeira (Cálculo no Servidor com realItems e Taxas Dinâmicas)
    const { data: platformSettings } = await supabaseAdmin.from('platform_settings').select('*').limit(1).single();
    
    const financials = calculateOrderFinancials(realItems, 0, platformSettings || undefined);

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
      description: `Educalizando — Pedido #${tempOrderId.substring(4, 10).toUpperCase()} (${realItems[0]?.productTitle || 'Infoproduto'})`,
      creditCard,
      creditCardHolderInfo
    });

    // 8. Persistir Pedido no Banco / Local com Vínculo Obrigatório ao student_id
    const orderRecord = await createOrderRecord({
      id: tempOrderId,
      storeId,
      buyerName,
      buyerEmail,
      buyerCpf,
      buyerPhone: body.buyerPhone,
      paymentMethod: normalizedMethod,
      items: realItems,
      asaasPaymentId: asaasPayment.id,
      asaasCustomerId,
      pixCopyPaste: asaasPayment.pixCopyPastePayload,
      pixQrCodeBase64: asaasPayment.pixQrCodeBase64,
      isPlrPurchase
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
