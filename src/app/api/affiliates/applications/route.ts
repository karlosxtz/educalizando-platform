import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { createNotification } from '@/lib/notification-service';
import { supabaseAdmin } from '@/lib/supabase';

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Usuário não autenticado.', 401);

    const body = await request.json().catch(() => null);
    const productId = typeof body?.productId === 'string' ? body.productId.trim() : '';
    const storeId = typeof body?.storeId === 'string' ? body.storeId.trim() : '';
    if (!productId || !storeId) return jsonError('Produto ou loja inválidos.', 400);

    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, titulo, store_id, status, excluido_em, allow_affiliates, stores!inner(creator_id, affiliate_program_enabled)')
      .eq('id', productId)
      .eq('store_id', storeId)
      .maybeSingle();

    if (productError) throw productError;
    if (!product || product.status !== 'publicado' || product.excluido_em || !product.allow_affiliates) {
      return jsonError('Este produto não está disponível para afiliação.', 409);
    }

    const store = Array.isArray(product.stores) ? product.stores[0] : product.stores;
    if (!store?.affiliate_program_enabled) {
      return jsonError('O programa de afiliados desta loja está desativado.', 409);
    }
    if (store.creator_id === user.id) {
      return jsonError('Você não pode se afiliar a um produto da sua própria loja.', 409);
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('affiliates')
      .select('id, status')
      .eq('store_id', storeId)
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .maybeSingle();
    if (existingError) throw existingError;

    let affiliateId: string;
    if (existing) {
      if (!['cancelado', 'rejeitado'].includes(existing.status)) {
        return jsonError('Você já possui uma afiliação ou solicitação pendente para este produto.', 409);
      }
      const { error } = await supabaseAdmin
        .from('affiliates')
        .update({ status: 'pendente', commission_type: null, commission_rate: null, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .eq('user_id', user.id);
      if (error) throw error;
      affiliateId = existing.id;
    } else {
      const { data: created, error } = await supabaseAdmin
        .from('affiliates')
        .insert({ store_id: storeId, user_id: user.id, product_id: productId, status: 'pendente' })
        .select('id')
        .single();
      if (error) throw error;
      affiliateId = created.id;
    }

    await createNotification({
      storeId,
      creatorId: store.creator_id,
      type: 'AFFILIATE_PENDING',
      title: 'Nova Solicitação de Afiliação',
      body: `Você recebeu uma solicitação de afiliação para o produto ${product.titulo}.`,
      metadata: { affiliateId, productId }
    });

    return NextResponse.json({
      success: true,
      message: existing
        ? 'Solicitação de afiliação reenviada com sucesso! Aguarde a aprovação.'
        : 'Solicitação de afiliação enviada com sucesso! Aguarde a aprovação do dono da loja.'
    });
  } catch (error) {
    console.error('[POST /api/affiliates/applications] Erro:', error);
    return jsonError('Não foi possível enviar a solicitação.', 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Usuário não autenticado.', 401);

    const body = await request.json().catch(() => null);
    const affiliateId = typeof body?.affiliateId === 'string' ? body.affiliateId.trim() : '';
    if (!affiliateId) return jsonError('Afiliação inválida.', 400);

    const { data: affiliation, error: lookupError } = await supabaseAdmin
      .from('affiliates')
      .select('id, status')
      .eq('id', affiliateId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!affiliation) return jsonError('Afiliação não encontrada.', 404);
    if (affiliation.status === 'cancelado') {
      return NextResponse.json({ success: true, message: 'Afiliação já estava cancelada.' });
    }

    const { error } = await supabaseAdmin
      .from('affiliates')
      .update({ status: 'cancelado', updated_at: new Date().toISOString() })
      .eq('id', affiliateId)
      .eq('user_id', user.id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Afiliação cancelada com sucesso.' });
  } catch (error) {
    console.error('[DELETE /api/affiliates/applications] Erro:', error);
    return jsonError('Não foi possível cancelar a afiliação.', 500);
  }
}
