import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createInfinitePayCheckout, isValidCPF } from '@/lib/infinitepay-service';
import { createOrderRecord, PaymentMethodType } from '@/lib/order-service';
import { supabaseAdmin } from '@/lib/supabase';
import { validateCouponCode } from '@/lib/coupon-service';
import { getRequestUser } from '@/lib/api-auth';
import { getStorePromotion } from '@/lib/store-promotion';
import { assertCheckoutFinancialConfiguration, getFinancialConfiguration } from '@/lib/financial-configuration';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    try {
      assertCheckoutFinancialConfiguration();
    } catch {
      const configuration = getFinancialConfiguration();
      console.error('[Checkout] Configuração financeira indisponível.', {
        environment: configuration.environment,
        infinitePay: configuration.infinitePay.state,
        cryptography: configuration.cryptography.state,
      });
      return NextResponse.json(
        { success: false, error: 'O checkout está temporariamente indisponível. Tente novamente em instantes.' },
        { status: 503 },
      );
    }
    const { 
      storeId, 
      buyerName: rawBuyerName,
      buyerEmail: rawBuyerEmail,
      buyerCpf: rawBuyerCpf,
      buyerPhone,
      remarketingBrowserToken,
      items = [],
      kitId,
      isPlrPurchase: rawIsPlrPurchase = false,
      couponCode
    } = body;

    // O campo vem do navegador e só o booleano literal `true` pode iniciar
    // uma compra PLR. Strings como "false" não podem contaminar uma compra
    // comum e fazê-la parecer licença no CRM/na entrega.
    const isPlrPurchase = rawIsPlrPurchase === true;

    // 1. REGRA MANDATÓRIA DE AUTENTICAÇÃO (cookies SSR ou Bearer)
    const user = await getRequestUser(request);
    const metadata = user?.user_metadata || {};
    let authenticatedRole = metadata.role === 'creator' || metadata.is_creator === true ? 'creator' : 'student';

    // Se o comprador não tem identificação válida:
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: isPlrPurchase 
            ? 'Para comprar Licenças PLR, é obrigatório estar conectado em uma conta de CRIADOR.' 
            : 'Para realizar compras na Educalizando, é obrigatório estar conectado em uma conta de CLIENTE.'
        },
        { status: 401 }
      );
    }

    // Uma loja vinculada torna a conta de fato uma conta de criador, inclusive
    // para cadastros antigos cujo metadata ainda não contém o campo role.
    if (authenticatedRole !== 'creator') {
      const { data: creatorStore } = await supabaseAdmin
        .from('stores')
        .select('id')
        .eq('creator_id', user.id)
        .limit(1)
        .maybeSingle();
      if (creatorStore) authenticatedRole = 'creator';
    }
    
    // Verificação de Role (Papel)
    if (isPlrPurchase && authenticatedRole !== 'creator') {
      return NextResponse.json(
        { success: false, error: 'Apenas CRIADORES podem comprar Licenças PLR. Por favor, faça login em sua conta de Criador.' },
        { status: 401 }
      );
    }
    if (!isPlrPurchase && authenticatedRole === 'creator') {
      return NextResponse.json(
        { success: false, error: 'Criadores não podem comprar materiais comuns. Por favor, utilize uma conta de CLIENTE.' },
        { status: 401 }
      );
    }

    const studentId = user.id; // Será usado como ID do comprador (seja aluno ou criador)
    const buyerName = (metadata.full_name || rawBuyerName || (isPlrPurchase ? 'Criador' : 'Cliente')).trim();
    const buyerEmail = (user.email || rawBuyerEmail || '').toLowerCase().trim();
    const buyerCpf = String(metadata.cpf || rawBuyerCpf || '').replace(/\D/g, '');
    // O telefone informado no checkout tem prioridade. Caso esteja vazio,
    // usamos o WhatsApp validado no cadastro do Cliente para permitir os
    // avisos de pagamento e a identificação no gateway.
    const buyerPhoneDigits = String(buyerPhone || metadata.whatsapp || metadata.phone || '').replace(/\D/g, '');
    const infinitePayPhone = buyerPhoneDigits
      ? `+${buyerPhoneDigits.startsWith('55') ? buyerPhoneDigits : `55${buyerPhoneDigits}`}`
      : undefined;

    // 2. Validação Estrita dos Campos Obrigatórios e Validação do CPF
    if (!storeId || !buyerName || !buyerEmail || !isValidCPF(buyerCpf) || (!kitId && items.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Por favor, informe seu Nome Completo, E-mail e um CPF válido para a emissão do recibo.' },
        { status: 400 }
      );
    }

    // Licenças PLR são B2B: somente uma conta que já possui loja de criador
    // pode comprá-las. Isso impede que uma compra PLR seja tratada como acesso
    // de aluno em qualquer etapa posterior de entrega ou reenvio.
    if (isPlrPurchase) {
      const { data: creatorStore, error: creatorStoreError } = await supabaseAdmin
        .from('stores')
        .select('id')
        .eq('creator_id', user.id)
        .limit(1)
        .maybeSingle();
      if (creatorStoreError || !creatorStore) {
        return NextResponse.json({ success: false, error: 'Licenças PLR são exclusivas para contas de criador. Crie sua loja antes de realizar esta compra.' }, { status: 403 });
      }
    }

    // 3. Buscar Produtos Reais no Banco e Validar (SERVER-SIDE PRICE)
    let kitContext: { id: string; storeId: string; title: string; price: number } | null = null;
    let productIds = items.map((it: any) => it.productId).filter(Boolean);

    // Kits are paid once but grant access to each included product. The kit and
    // its products are always reloaded here, never trusted from the browser.
    if (kitId) {
      if (isPlrPurchase) {
        return NextResponse.json({ success: false, error: 'Kits não podem ser comprados como licença PLR.' }, { status: 400 });
      }
      const { data: kit, error: kitError } = await supabaseAdmin
        .from('kits')
        .select('id, store_id, titulo, preco_kit, status, excluido_em, kit_items(product_id)')
        .eq('id', kitId)
        .maybeSingle();

      if (kitError || !kit || kit.status !== 'publicado' || kit.excluido_em || kit.store_id !== storeId) {
        return NextResponse.json({ success: false, error: 'Este combo não está disponível para compra.' }, { status: 400 });
      }
      productIds = (kit.kit_items || []).map((item: { product_id: string }) => item.product_id).filter(Boolean);
      if (productIds.length === 0 || new Set(productIds).size !== productIds.length || !(Number(kit.preco_kit) > 0)) {
        return NextResponse.json({ success: false, error: 'Este combo não possui materiais válidos para venda.' }, { status: 400 });
      }
      kitContext = { id: kit.id, storeId: kit.store_id, title: kit.titulo, price: Number(kit.preco_kit) };
    }

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

    const { data: realProducts, error: dbError } = await supabaseAdmin
      .from('products')
      .select('id, preco, preco_plr, is_plr, has_plr_delivery, store_id, status, titulo')
      .in('id', productIds);

    if (dbError || !realProducts || realProducts.length !== productIds.length) {
      return NextResponse.json({ success: false, error: 'Um ou mais produtos não existem ou estão indisponíveis.' }, { status: 400 });
    }

    const checkoutItems = kitContext
      ? productIds.map((productId: string) => ({ productId, quantity: 1 }))
      : items;

    if (new Set(productIds).size !== checkoutItems.length) {
      return NextResponse.json({ success: false, error: 'O carrinho contém itens duplicados ou inválidos.' }, { status: 400 });
    }

    // 3.5 Definir a Loja Efetiva Baseada no Banco (Não confiar no frontend)
    const effectiveStoreId = realProducts[0]?.store_id;
    if (!effectiveStoreId) {
      return NextResponse.json({ success: false, error: 'Não foi possível determinar a loja do produto.' }, { status: 400 });
    }
    const { data: effectiveStore } = await supabaseAdmin
      .from('stores')
      .select('slug, creator_id, bulk_discount_enabled, bulk_discount_minimum, bulk_discount_percentage')
      .eq('id', effectiveStoreId)
      .maybeSingle();
    if (!effectiveStore?.slug) {
      return NextResponse.json({ success: false, error: 'A loja responsável pelo produto não foi encontrada.' }, { status: 400 });
    }
    if (effectiveStore.creator_id === user.id) {
      return NextResponse.json({ success: false, error: 'Não é permitido comprar um produto da própria loja.' }, { status: 400 });
    }

    // 4. Reconstruir array de items com PREÇO REAL e QUANTIDADE validada
    const realItems: any[] = [];
    let appliedCouponId: string | null = null;
    let kitDiscountedPrice = kitContext?.price || 0;
    if (kitContext && couponCode) {
      const couponRes = await validateCouponCode(effectiveStoreId, couponCode, 'kit', kitContext.id, kitContext.price);
      if (!couponRes.valid || couponRes.finalPrice === undefined) {
        return NextResponse.json({ success: false, error: couponRes.message || 'Cupom inválido para este combo.' }, { status: 400 });
      }
      kitDiscountedPrice = couponRes.finalPrice;
      appliedCouponId = couponRes.coupon?.id || null;
    }

    const kitProductTotal = kitContext
      ? realProducts.reduce((total: number, product: any) => total + Number(product.preco || 0), 0)
      : 0;
    if (kitContext && !(kitProductTotal > 0)) {
      return NextResponse.json({ success: false, error: 'Não foi possível calcular o valor dos materiais deste combo.' }, { status: 400 });
    }
    let allocatedKitCents = 0;

    for (const [itemIndex, item] of checkoutItems.entries()) {
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

      if (isPlrPurchase && !(Number(realProd.preco_plr) > 0)) {
        return NextResponse.json({ success: false, error: 'A Licença PLR deste produto está sem um preço válido.' }, { status: 400 });
      }

      if (isPlrPurchase && !realProd.has_plr_delivery) {
        return NextResponse.json({ success: false, error: 'A entrega da Licença PLR deste produto ainda não foi configurada.' }, { status: 400 });
      }

      const rawQuantity = Number(item.quantity);
      const validQuantity = (isNaN(rawQuantity) || rawQuantity < 1 || !Number.isInteger(rawQuantity)) ? 1 : rawQuantity;
      const safeQuantity = Math.min(validQuantity, 10);

      // Preço Base 
      let finalPrice = Number(isPlrPurchase ? realProd.preco_plr : realProd.preco);

      if (kitContext) {
        const kitCents = Math.round(kitDiscountedPrice * 100);
        const isLastKitItem = itemIndex === checkoutItems.length - 1;
        const allocatedCents = isLastKitItem
          ? kitCents - allocatedKitCents
          : Math.round(kitCents * (Number(realProd.preco || 0) / kitProductTotal));
        allocatedKitCents += allocatedCents;
        finalPrice = allocatedCents / 100;
      }

      // Validação Estrita do Cupom no Servidor
      if (couponCode && !kitContext) {
        const couponRes = await validateCouponCode(effectiveStoreId, couponCode, 'product', realProd.id, finalPrice);
        if (couponRes.valid && couponRes.finalPrice !== undefined) {
          finalPrice = couponRes.finalPrice;
          appliedCouponId = couponRes.coupon?.id || appliedCouponId;
        } else {
          return NextResponse.json({ success: false, error: couponRes.message || 'Cupom inválido para este produto.' }, { status: 400 });
        }
      }

      realItems.push({
        ...item,
        productTitle: kitContext ? `${kitContext.title} — ${realProd.titulo}` : isPlrPurchase ? `${realProd.titulo} (Licença PLR)` : realProd.titulo,
        unitPrice: finalPrice, 
        quantity: safeQuantity,
        storeId: realProd.store_id // Garante storeId correto
      });
    }

    if (realItems.length !== checkoutItems.length || realItems.some(item => !(Number(item.unitPrice) > 0))) {
      return NextResponse.json({ success: false, error: 'Um ou mais itens possuem preço inválido.' }, { status: 400 });
    }

    // Oferta automática da loja: nunca mistura produtos de lojas diferentes e é
    // recalculada exclusivamente no servidor, sem confiar no valor do navegador.
    const subtotalBeforeStoreDiscount = realItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
    const storePromotion = getStorePromotion(effectiveStore, subtotalBeforeStoreDiscount);
    if (!couponCode && storePromotion.qualified) {
      const multiplier = 1 - (storePromotion.percentage / 100);
      realItems.forEach((item) => {
        item.unitPrice = Number((item.unitPrice * multiplier).toFixed(2));
      });
    }

    // A forma de pagamento será escolhida no checkout hospedado da InfinitePay.
    const normalizedMethod: PaymentMethodType = 'pix';

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

    // Calcular as taxas para fornecer a base líquida correta ao motor de afiliados
    const { calculateOrderFinancials } = await import('@/lib/order-service');
    // Na conta InfinitePay, as taxas do cartão devem ser configuradas como repassadas ao comprador.
    const gatewayFeeAmount = 0;
    const tempFinancials = calculateOrderFinancials(realItems, gatewayFeeAmount, platformSettings || undefined, 0);
    
    if (rawAffiliateId) {
      const { calculateAffiliateCommission } = await import('@/lib/affiliate-service');
      const commissionResult = await calculateAffiliateCommission({
        affiliateId: rawAffiliateId,
        storeId: effectiveStoreId,
        productId: realItems[0]?.productId,
        buyerId: studentId,
        baseSubtotal,
        gatewayFee: tempFinancials.asaasFeeAmount,
        platformFee: tempFinancials.platformFeeAmount
      });
      
      affiliateId = commissionResult.affiliateId;
      affiliateCommissionAmount = commissionResult.affiliateCommissionAmount;
    }

    const tempOrderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, '');

    // 6. Persistir primeiro o pedido. Assim nunca existe cobrança válida sem um
    // pedido correspondente para o webhook confirmar e liberar os acessos.
    const orderRecord = await createOrderRecord({
      id: tempOrderId,
      studentId,
      storeId: effectiveStoreId,
      buyerName: buyerName,
      buyerEmail,
      buyerCpf,
      buyerPhone: buyerPhoneDigits || undefined,
      paymentMethod: normalizedMethod,
      items: realItems,
      asaasFeeAmount: gatewayFeeAmount,
      paymentProvider: 'infinitepay',
      isPlrPurchase,
      affiliateId: affiliateId || undefined,
      affiliateCommissionAmount: affiliateCommissionAmount > 0 ? affiliateCommissionAmount : undefined,
      couponId: appliedCouponId || undefined,
      platformSettings: platformSettings || undefined
    });

    if (remarketingBrowserToken) {
      await supabaseAdmin.from('abandoned_cart_reminders')
        .update({ order_id: orderRecord.id, updated_at: new Date().toISOString() })
        .eq('browser_token', remarketingBrowserToken)
        .eq('store_id', effectiveStoreId)
        .eq('status', 'pending');
    }

    // 7. Criar o checkout hospedado da InfinitePay na conta central.
    const infinitePayCheckout = await createInfinitePayCheckout({
      orderNsu: tempOrderId,
      redirectUrl: `${appUrl}/loja/${encodeURIComponent(effectiveStore.slug)}/checkout/sucesso/${tempOrderId}`,
      webhookUrl: `${appUrl}/api/webhooks/infinitepay`,
      customer: {
        name: buyerName,
        email: buyerEmail,
        phoneNumber: infinitePayPhone
      },
      items: realItems.map(item => ({
        quantity: item.quantity,
        price: Math.round(item.unitPrice * 100),
        description: item.productTitle
      }))
    });

    const { error: checkoutUrlError } = await supabaseAdmin
      .from('orders')
      .update({ checkout_url: infinitePayCheckout.checkoutUrl })
      .eq('id', orderRecord.id);
    if (checkoutUrlError) {
      console.error('[Checkout] Pedido criado, mas não foi possível salvar a URL hospedada:', checkoutUrlError);
    }

    return NextResponse.json({
      success: true,
      orderId: orderRecord.id,
      studentId,
      status: orderRecord.status,
      paymentProvider: 'infinitepay',
      paymentMethod: normalizedMethod,
      subtotalAmount: orderRecord.subtotalAmount,
      totalAmount: orderRecord.totalAmount,
      platformFeeAmount: orderRecord.platformFeeAmount,
      creatorNetAmount: orderRecord.creatorNetAmount,
      storeDiscountAmount: storePromotion.qualified && !couponCode ? storePromotion.discountAmount : 0,
      checkoutUrl: infinitePayCheckout.checkoutUrl
    });

  } catch (error: any) {
    console.error('[API Checkout Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao processar o checkout.' },
      { status: 500 }
    );
  }
}
