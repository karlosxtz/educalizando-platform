import { calculatePlatformFee } from './payment-fees';
import { getLocalOrders, saveLocalOrders } from './sales-service';
import { getLocalAsaasOrders, getOrderRecordById, OrderRecord, OrderStatusType, PaymentMethodType, saveLocalAsaasOrders } from './order-service';
import { isRealSupabaseConfigured as isRealSupabaseConfiguredForOrders } from './supabase';

// 4. Atualizar Status do Pedido + Registrar Taxa Asaas Real + Idempotência
export async function updateOrderStatus(
  orderId: string, 
  newStatus: OrderStatusType, 
  asaasPaymentId?: string,
  realAsaasFee?: number,
  options: { onlyIfPending?: boolean; paymentMethod?: PaymentMethodType; installments?: number } = {},
): Promise<OrderRecord | null> {
  let order = await getOrderRecordById(orderId);
  if (!order && asaasPaymentId) {
    const localAll = getLocalAsaasOrders();
    order = localAll.find(o => o.asaasPaymentId === asaasPaymentId || o.id === orderId) || null;
  }

  if (!order) return null;
  if (options.onlyIfPending && order.status !== 'pending') {
    return { ...order, statusTransitioned: false };
  }

  // Uma repetição válida deve conferir novamente os efeitos idempotentes (ledger e acesso).
  // Isso permite reparar automaticamente uma confirmação anterior parcialmente processada.
  let statusTransitioned = order.status !== newStatus;

  const nowPaidAt = newStatus === 'paid' ? new Date().toISOString() : order.paidAt;

  // Se uma taxa Asaas real foi informada pelo webhook, recalcular creator_net_amount
  let updatedAsaasFee = order.asaasFeeAmount;
  let updatedCreatorNet = order.creatorNetAmount;

  if (realAsaasFee !== undefined && realAsaasFee >= 0) {
    updatedAsaasFee = Number(realAsaasFee.toFixed(2));
  }
  
  const confirmedPaymentMethod = options.paymentMethod || order.paymentMethod;
  const updatedPlatformPercentageFee = calculatePlatformFee(order.subtotalAmount, confirmedPaymentMethod);
  const updatedPlatformFee = updatedPlatformPercentageFee;
  const affComission = order.affiliateCommissionAmount || 0;
  updatedCreatorNet = Number(Math.max(0, order.subtotalAmount - updatedPlatformFee - updatedAsaasFee - affComission).toFixed(2));

  // Atualizar Supabase se configurado
  if (isRealSupabaseConfiguredForOrders()) {
    try {
      const { supabaseAdmin } = await import('./supabase');
      
      // ATUALIZAÇÃO ATÔMICA (Optimistic Locking)
      // Tenta atualizar o status APENAS se ele já não for o novo status.
      const { data: updatedOrder, error } = await supabaseAdmin.from('orders').update({
        status: newStatus,
        paid_at: nowPaidAt,
        payment_method: confirmedPaymentMethod,
        platform_fixed_fee_amount: 0,
        platform_percentage_fee_amount: updatedPlatformPercentageFee,
        platform_fee_amount: updatedPlatformFee,
        asaas_fee_amount: updatedAsaasFee,
        creator_net_amount: updatedCreatorNet
      })
      .eq('id', order.id)
      .eq('status', options.onlyIfPending ? 'pending' : newStatus === 'paid' ? 'pending' : order.status)
      .select()
      .maybeSingle();

      if (error) {
        throw new Error(`Falha ao atualizar o pedido: ${error.message}`);
      }

      // Sem linha alterada, outra confirmação venceu a corrida. Ainda conferimos os efeitos
      // idempotentes abaixo, mas não repetimos os e-mails transacionais.
      if (!updatedOrder) {
        statusTransitioned = false;
        console.log(`[Webhook Seguro] Pedido ${order.id} já estava em ${newStatus}. Conferindo efeitos idempotentes.`);
      }
    } catch (err) {
      console.error('[updateOrderStatus] Erro Exceção Supabase:', err);
      throw err;
    }
  }

  // Atualizar LocalStorage Asaas Orders
  const localAsaas = getLocalAsaasOrders();
  const idx = localAsaas.findIndex(o => o.id === order!.id);
  if (idx !== -1) {
    localAsaas[idx].status = newStatus;
    localAsaas[idx].paidAt = nowPaidAt;
    localAsaas[idx].asaasFeeAmount = updatedAsaasFee;
    localAsaas[idx].paymentMethod = confirmedPaymentMethod;
    localAsaas[idx].platformFixedFeeAmount = 0;
    localAsaas[idx].platformPercentageFeeAmount = updatedPlatformPercentageFee;
    localAsaas[idx].platformFeeAmount = updatedPlatformFee;
    localAsaas[idx].creatorNetAmount = updatedCreatorNet;
    saveLocalAsaasOrders(localAsaas);
  }

  // Atualizar Lista Geral de Vendas Vendedor (RecentOrder)
  const recentOrders = getLocalOrders();
  const recIdx = recentOrders.findIndex(r => r.id === order!.id);
  if (recIdx !== -1) {
    recentOrders[recIdx].statusPagamento = newStatus === 'paid' ? 'pago' : newStatus === 'refunded' ? 'expirado' : 'pendente_pix';
    saveLocalOrders(recentOrders);
  }

  // Se confirmado como PAGO, liberar matrícula do aluno e registrar lançamento de venda no ledger da carteira
  if (newStatus === 'paid') {
    try {
      if (order.couponId) {
        const { supabaseAdmin } = await import('./supabase');
        const { error: couponError } = await supabaseAdmin.rpc('consume_order_coupon', { p_order_id: order.id });
        if (couponError) throw couponError;
      }

      // 1. Registrar transação SALE no ledger imutável da carteira
      const { recordWalletTransaction } = await import('./wallet-service');
      await recordWalletTransaction({
        storeId: order.storeId,
        orderId: order.id,
        buyerName: order.buyerName,
        productTitle: order.items[0]?.productTitle || 'Material digital',
        type: 'SALE',
        grossAmount: order.totalAmount,
        platformFixedFeeAmount: 0,
        platformPercentageFeeAmount: updatedPlatformPercentageFee,
        platformFeeAmount: updatedPlatformFee,
        asaasFeeAmount: updatedAsaasFee,
        netAmount: updatedCreatorNet,
        description: `Venda aprovada do Pedido #${order.id.substring(4, 10).toUpperCase()} — ${confirmedPaymentMethod === 'pix' ? 'PIX' : `${options.installments || 1}x no cartão`}`
      });

      // A indicação de criador é registrada em tabela própria e na carteira do
      // indicador. A comissão foi reservada no pedido e não reduz a vendedora.
      if (order.creatorReferralId && Number(order.creatorReferralCommissionAmount) > 0 && isRealSupabaseConfiguredForOrders()) {
        const { createCreatorReferralCommission } = await import('./creator-referral-service');
        const referralCommission = await createCreatorReferralCommission(order);
        if (referralCommission) {
          await recordWalletTransaction({
            storeId: referralCommission.beneficiary_store_id,
            creatorId: referralCommission.beneficiary_creator_id,
            orderId: order.id,
            buyerName: order.buyerName,
            productTitle: order.items[0]?.productTitle || 'Material digital',
            type: 'CREATOR_REFERRAL_COMMISSION',
            grossAmount: Number(referralCommission.commission_amount),
            platformFixedFeeAmount: 0,
            platformPercentageFeeAmount: 0,
            platformFeeAmount: 0,
            asaasFeeAmount: 0,
            netAmount: Number(referralCommission.commission_amount),
            description: `Bônus por indicação de criador - Pedido #${order.id.substring(4, 10).toUpperCase()}`
          });
        }
      }

      // 1B. Registrar transação AFFILIATE_COMMISSION no ledger se houver afiliado
      if (order.affiliateId && affComission > 0) {
        let affiliateUserId = null;
        if (isRealSupabaseConfiguredForOrders()) {
          const { supabaseAdmin } = await import('./supabase');
          const { data: affData } = await supabaseAdmin
            .from('affiliates')
            .select('user_id')
            .eq('id', order.affiliateId)
            .single();
          if (affData) affiliateUserId = affData.user_id;
        }

        await recordWalletTransaction({
          storeId: order.storeId, // A comissão ainda está vinculada à loja onde a venda ocorreu
          creatorId: affiliateUserId, // Identificador de quem é o dono do dinheiro (o afiliado)
          orderId: order.id,
          buyerName: order.buyerName,
          productTitle: order.items[0]?.productTitle || 'Material digital',
          type: 'AFFILIATE_COMMISSION',
          grossAmount: affComission,
          platformFixedFeeAmount: 0,
          platformPercentageFeeAmount: 0,
          platformFeeAmount: 0,
          asaasFeeAmount: 0,
          netAmount: affComission,
          description: `Comissão de Afiliado - Pedido #${order.id.substring(4, 10).toUpperCase()}`
        });

        // E-mails são disparados somente por quem efetivamente mudou o status.
        if (statusTransitioned) try {
          if (affiliateUserId && isRealSupabaseConfiguredForOrders()) {
            const { supabaseAdmin } = await import('./supabase');
            const { data: affUser } = await supabaseAdmin.auth.admin.getUserById(affiliateUserId);
            const affEmail = affUser?.user?.email;
            const affName = affUser?.user?.user_metadata?.full_name || 'Afiliado';

            if (affEmail) {
              const { sendSaleNotificationToAffiliate } = await import('./mail-service');
              await sendSaleNotificationToAffiliate({
                affiliateEmail: affEmail,
                affiliateName: affName,
                amount: affComission,
                productTitle: order.items[0]?.productTitle || 'Material digital'
              });
            }
          }
        } catch (mailErr) {
          console.error('[updateOrderStatus] Erro ao disparar e-mail pro afiliado:', mailErr);
        }
      }

      const studentEmail = (order.buyerEmail || '').toLowerCase().trim();

      // 2. Produtos finais pertencem à biblioteca do aluno. PLR é uma licença
      // B2B e é lido exclusivamente em /dashboard/plr/comprados pelo pedido;
      // criar student_product_access para ele misturava as duas áreas.
      if (!order.is_plr_purchase) {
        const { grantStudentProductAccess } = await import('./student-service');
        const accessStudentId = order.studentId || studentEmail;
        if (order.items && order.items.length > 0) {
          for (const item of order.items) {
            await grantStudentProductAccess({
              studentId: accessStudentId,
              productId: item.productId,
              orderId: order.id,
              storeId: order.storeId
            });
          }
        } else {
          // Fallback caso seja pedido sem item específico na lista
          await grantStudentProductAccess({
            studentId: accessStudentId,
            productId: 'prod-combo-1',
            orderId: order.id,
            storeId: order.storeId
          });
        }
      }

      // 📧 Disparar e-mail via Resend para o aluno. A reserva no banco evita
      // duplicidade em webhooks repetidos e mantém falhas disponíveis para retry.
      let deliveryAttemptId: string | null = null;
      try {
        const { claimTransactionalDelivery, completeTransactionalDelivery } = await import('./transactional-delivery-service');
        deliveryAttemptId = await claimTransactionalDelivery(order.id, 'EMAIL', 'MATERIAL_DELIVERY');
        if (!deliveryAttemptId) {
          console.log(`[updateOrderStatus] E-mail de entrega do pedido ${order.id} já está em processamento ou já foi enviado.`);
          return {
            ...order,
            status: newStatus,
            statusTransitioned,
            paidAt: nowPaidAt,
            asaasFeeAmount: updatedAsaasFee,
            creatorNetAmount: updatedCreatorNet
          };
        }

        let creatorWhatsapp: string | null = null;
        if (isRealSupabaseConfiguredForOrders()) {
          const { supabaseAdmin } = await import('./supabase');
          const { data: storeData } = await supabaseAdmin.from('stores').select('whatsapp').eq('id', order.storeId).maybeSingle();
          if (storeData) creatorWhatsapp = storeData.whatsapp;
        }

        const { sendSaleConfirmationToBuyer } = await import('./mail-service');
        let deliveryByProduct = new Map<string, { arquivo_url: string | null; arquivo_nome: string | null; plr_license_url: string | null }>();
        if (isRealSupabaseConfiguredForOrders() && order.items.length) {
          const { supabaseAdmin } = await import('./supabase');
          const { data: deliveries } = await supabaseAdmin.from('product_deliveries').select('product_id, arquivo_url, arquivo_nome, plr_license_url').in('product_id', order.items.map(item => item.productId));
          deliveryByProduct = new Map((deliveries || []).map(item => [item.product_id, item]));
        }
        const productTitles = order.items.length > 0 
          ? order.items.map(it => it.productTitle || 'Material digital').join(', ')
          : 'Kit Combo Digital';
          
        const mailResult = await sendSaleConfirmationToBuyer({
          buyerEmail: studentEmail,
          buyerName: order.buyerName,
          orderId: order.id,
          productTitles,
          products: order.items.map(it => {
            const delivery = deliveryByProduct.get(it.productId);
            const fileUrl = order.is_plr_purchase ? delivery?.plr_license_url : delivery?.arquivo_url;
            return { id: it.productId, title: it.productTitle || 'Material digital', fileUrl, fileName: delivery?.arquivo_nome };
          }),
          creatorWhatsapp,
          isPlrPurchase: order.is_plr_purchase === true
        });
        if (!mailResult.sent) throw new Error(mailResult.error || 'A Resend não confirmou o envio.');
        await completeTransactionalDelivery(deliveryAttemptId);
      } catch (mailErr) {
        try {
          const { failTransactionalDelivery } = await import('./transactional-delivery-service');
          if (deliveryAttemptId) await failTransactionalDelivery(deliveryAttemptId, mailErr instanceof Error ? mailErr.message : String(mailErr));
        } catch (trackingErr) {
          console.error('[updateOrderStatus] Erro ao registrar falha de e-mail:', trackingErr);
        }
        console.error('[updateOrderStatus] Erro ao disparar e-mail pro aluno:', mailErr);
      }
    } catch (e) {
      console.error('[updateOrderStatus] Erro ao liberar acesso ou registrar lançamento no ledger:', e);
    }
  } else if (newStatus === 'refunded') {
    // O reembolso encerra o direito de acesso deste pedido, mas não toca em
    // acessos de outra compra válida do mesmo material pelo mesmo usuário.
    try {
      const { revokeStudentProductAccessByOrder } = await import('./student-service');
      await revokeStudentProductAccessByOrder(order.id);
    } catch (accessError) {
      console.error('[updateOrderStatus] Erro ao revogar acesso após estorno:', accessError);
    }
    try {
      // Registrar ajuste negativo de reembolso no ledger da carteira do criador
      const { recordWalletTransaction } = await import('./wallet-service');
      await recordWalletTransaction({
        storeId: order.storeId,
        orderId: order.id,
        buyerName: order.buyerName,
        productTitle: order.items[0]?.productTitle || 'Material digital',
        type: 'REFUND',
        grossAmount: -order.totalAmount,
        platformFixedFeeAmount: -order.platformFixedFeeAmount,
        platformPercentageFeeAmount: -order.platformPercentageFeeAmount,
        platformFeeAmount: -order.platformFeeAmount,
        asaasFeeAmount: -updatedAsaasFee,
        netAmount: -updatedCreatorNet,
        description: `Estorno / Reembolso do Pedido #${order.id.substring(4, 10).toUpperCase()}`
      });

      if (order.creatorReferralId && isRealSupabaseConfiguredForOrders()) {
        const { reverseCreatorReferralCommission } = await import('./creator-referral-service');
        const referralCommission = await reverseCreatorReferralCommission(order.id);
        if (referralCommission) {
          await recordWalletTransaction({
            storeId: referralCommission.beneficiary_store_id,
            creatorId: referralCommission.beneficiary_creator_id,
            orderId: order.id,
            buyerName: order.buyerName,
            productTitle: order.items[0]?.productTitle || 'Material digital',
            type: 'CREATOR_REFERRAL_COMMISSION_REFUND',
            grossAmount: -Number(referralCommission.commission_amount),
            platformFixedFeeAmount: 0,
            platformPercentageFeeAmount: 0,
            platformFeeAmount: 0,
            asaasFeeAmount: 0,
            netAmount: -Number(referralCommission.commission_amount),
            description: `Estorno de bônus por indicação - Pedido #${order.id.substring(4, 10).toUpperCase()}`
          });
        }
      }

      // 2B. Estornar também a comissão do afiliado se houver
      if (order.affiliateId && affComission > 0) {
        let affiliateUserId = null;
        if (isRealSupabaseConfiguredForOrders()) {
          const { supabaseAdmin } = await import('./supabase');
          const { data: affData } = await supabaseAdmin
            .from('affiliates')
            .select('user_id')
            .eq('id', order.affiliateId)
            .single();
          if (affData) affiliateUserId = affData.user_id;
        }

        await recordWalletTransaction({
          storeId: order.storeId,
          creatorId: affiliateUserId,
          orderId: order.id,
          buyerName: order.buyerName,
          productTitle: order.items[0]?.productTitle || 'Material digital',
          // Tipo próprio para não colidir com o estorno da carteira da loja
          // no índice idempotente do mesmo pedido.
          type: 'AFFILIATE_COMMISSION_REFUND',
          grossAmount: -affComission,
          platformFixedFeeAmount: 0,
          platformPercentageFeeAmount: 0,
          platformFeeAmount: 0,
          asaasFeeAmount: 0,
          netAmount: -affComission,
          description: `Estorno de Comissão - Pedido #${order.id.substring(4, 10).toUpperCase()}`
        });
      }
    } catch (e) {
      console.error('[updateOrderStatus] Erro ao registrar estorno no ledger:', e);
    }
  }

  return {
    ...order,
    status: newStatus,
    statusTransitioned,
    paidAt: nowPaidAt,
    asaasFeeAmount: updatedAsaasFee,
    creatorNetAmount: updatedCreatorNet,
    paymentMethod: confirmedPaymentMethod,
    platformFixedFeeAmount: 0,
    platformPercentageFeeAmount: updatedPlatformPercentageFee,
    platformFeeAmount: updatedPlatformFee
  };
}
