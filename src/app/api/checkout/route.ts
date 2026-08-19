import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createOrGetAsaasCustomer, createAsaasPayment, isValidCPF } from '@/lib/asaas-service';
import { createOrderRecord, calculateOrderFinancials, PaymentMethodType } from '@/lib/order-service';
import { getAuthenticatedUserRole } from '@/lib/student-service';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { validateCouponCode } from '@/lib/coupon-service';

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
      isPlrPurchase = false,
      couponCode
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
        { success: false, error: 'Apenas CRIADORES podem comprar Licenças PLR. Por favor, faça login em sua conta de Criador.' },
        { status: 401 }
      );
    }
    if (!isPlrPurchase && authSession.role === 'creator') {
      return NextResponse.json(
        { success: false, error: 'Criadores não podem comprar materiais comuns. Por favor, utilize uma conta de ALUNO.' },
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

    // 3.1. Bloquear compras duplicadas
    if (isPlrPurchase) {
      const { data: existingPlr } = await supabaseAdmin
        .from('order_items')
        .select('product_id, orders!inner(student_id, status, is_plr_purchase)')
        .in('product_id', productIds)
        .eq('orders.student_id', studentId)
        .eq('orders.is_plr_purchase', true)
        .in('orders.status', ['paid', 'processing']);
      
      if (existingPlr && existingPlr.length > 0) {
        return NextResponse.json({ success: false, error: 'Você já possui a Licença PLR para um ou mais produtos deste carrinho.' }, { status: 400 });
      }
    } else {
      const { data: existingAccess } = await supabaseAdmin
        .from('student_product_access')
        .select('product_id')
        .in('product_id', productIds)
        .eq('student_id', studentId)
        .eq('status', 'ACTIVE');

      if (existingAccess && existingAccess.length > 0) {
        return NextResponse.json({ success: false, error: 'Você já comprou e possui acesso a um ou mais materiais deste carrinho.' }, { status: 400 });
      }
    }

    const { data: realProducts, error: dbError } = await supabase
      .from('products')
      .select('id, preco, preco_plr, is_plr, store_id, status, titulo')
      .in('id', productIds);

    if (dbError || !realProducts || realProducts.length !== productIds.length) {
      return NextResponse.json({ success: false, error: 'Um ou mais produtos não existem ou estão indisponíveis.' }, { status: 400 });
    }

    // 3.5 Definir a Loja Efetiva Baseada no Banco (Não confiar no frontend)
    const effectiveStoreId = realProducts[0]?.store_id;
    if (!effectiveStoreId) {
      return NextResponse.json({ success: false, error: 'Não foi possível determinar a loja do produto.' }, { status: 400 });
    }

    // 4. Reconstruir array de items com PREÇO REAL e QUANTIDADE validada
    const realItems: any[] = [];
    for (const item of items) {
      const realProd = realProducts.find((p: any) => p.id === item.productId);
      if (!realProd) continue;

      if (realProd.status !== 'publicado') {
        return NextResponse.json({ success: false, error: `Produto indisponível para venda: ${realProd.titulo}` }, { status: 400 });
      }

      // Validar se todos os produtos pertencem à mesma loja efetiva do banco
      if (realProd.store_id !== effectiveStoreId) {
        return NextResponse.json({ success: false, error: 'Todos os produtos devem pertencer exclusivamente à mesma loja.' }, { status: 400 });
      }
      
      if (isPlrPurchase && !realProd.is_plr) {
        return NextResponse.json({ success: false, error: 'Este produto não possui licença PLR habilitada.' }, { status: 400 });
      }

      const rawQuantity = Number(item.quantity);
      const validQuantity = (isNaN(rawQuantity) || rawQuantity < 1 || !Number.isInteger(rawQuantity)) ? 1 : rawQuantity;
      const safeQuantity = Math.min(validQuantity, 10);

      // Preço Base 
      let finalPrice = Number(isPlrPurchase ? (realProd.preco_plr || realProd.preco) : realProd.preco);

      // Validação Estrita do Cupom no Servidor
      if (couponCode) {
        const couponRes = await validateCouponCode(effectiveStoreId, couponCode, 'product', realProd.id, finalPrice);
        if (couponRes.valid && couponRes.finalPrice !== undefined) {
          finalPrice = couponRes.finalPrice;
        }
      }

      realItems.push({
        ...item,
        productTitle: isPlrPurchase ? `${realProd.titulo} (Licença PLR)` : realProd.titulo,
        unitPrice: finalPrice, 
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
    
    // Process affiliate
    const cookieStore = await cookies();
    let affiliateId = null;
    let affiliateCommissionAmount = 0;
    
    // 1. Tentar ler o novo cookie seguro JSON (Cross-store tracking)
    const secureCookie = cookieStore.get('educalizando_affiliates');
    let rawAffiliateId = null;
    
    if (secureCookie && secureCookie.value) {
      try {
        const parsed = JSON.parse(secureCookie.value);
        if (parsed[effectiveStoreId]) {
          rawAffiliateId = parsed[effectiveStoreId];
        }
      } catch (e) {
        // Ignorar erro de parse
      }
    }

    const baseSubtotal = realItems.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0);

    if (rawAffiliateId) {
      const { calculateAffiliateCommission } = await import('@/lib/affiliate-service');
      const commissionResult = await calculateAffiliateCommission({
        affiliateId: rawAffiliateId,
        storeId: effectiveStoreId,
        productId: realItems[0]?.productId,
        buyerId: studentId,
        baseSubtotal
      });
      
      affiliateId = commissionResult.affiliateId;
      affiliateCommissionAmount = commissionResult.affiliateCommissionAmount;
    }

    const financials = calculateOrderFinancials(realItems, 0, platformSettings || undefined, affiliateCommissionAmount);

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
      storeId: effectiveStoreId,
      buyerName: buyerName,
      buyerEmail,
      buyerCpf,
      buyerPhone: body.buyerPhone,
      paymentMethod: normalizedMethod,
      items: realItems,
      asaasPaymentId: asaasPayment.id,
      asaasCustomerId,
      pixCopyPaste: asaasPayment.pixCopyPastePayload,
      pixQrCodeBase64: asaasPayment.pixQrCodeBase64,
      isPlrPurchase,
      affiliateId: affiliateId || undefined,
      affiliateCommissionAmount: affiliateCommissionAmount > 0 ? affiliateCommissionAmount : undefined
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
