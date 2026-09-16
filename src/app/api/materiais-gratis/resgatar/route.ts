import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { grantStudentProductAccess } from '@/lib/student-service';

/**
 * Libera um brinde somente para uma conta de cliente autenticada. O produto e
 * sua loja são sempre buscados novamente no servidor; nenhum dado de preço ou
 * de loja enviado pelo navegador é usado para conceder o acesso.
 */
export async function POST(request: Request) {
  try {
    const { productId } = await request.json();
    if (!productId || typeof productId !== 'string') {
      return NextResponse.json({ error: 'Material inválido.' }, { status: 400 });
    }

    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Faça login em uma conta de cliente para resgatar este material.' }, { status: 401 });
    }

    const metadata = user.user_metadata || {};
    let isCreator = metadata.role === 'creator' || metadata.is_creator === true;
    if (!isCreator) {
      const { data: creatorStore } = await supabaseAdmin
        .from('stores')
        .select('id')
        .eq('creator_id', user.id)
        .limit(1)
        .maybeSingle();
      isCreator = Boolean(creatorStore);
    }
    if (isCreator) {
      return NextResponse.json({ error: 'Criadores precisam usar uma conta de cliente para resgatar materiais gratuitos.' }, { status: 403 });
    }

    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, store_id, is_free, preco, status, excluido_em')
      .eq('id', productId)
      .maybeSingle();
    if (productError || !product || product.status !== 'publicado' || product.excluido_em || !(product.is_free || Number(product.preco) === 0)) {
      return NextResponse.json({ error: 'Este material gratuito não está disponível.' }, { status: 404 });
    }

    const { data: activeAccess } = await supabaseAdmin
      .from('student_product_access')
      .select('id')
      .eq('student_id', user.id)
      .eq('product_id', product.id)
      .eq('status', 'ACTIVE')
      .limit(1)
      .maybeSingle();

    if (!activeAccess) {
      await grantStudentProductAccess({
        studentId: user.id,
        productId: product.id,
        storeId: product.store_id
      });
    }

    return NextResponse.json({
      success: true,
      redirectTo: `/cliente/brindes/${product.id}`
    });
  } catch (error) {
    console.error('[materiais-gratis/resgatar]', error);
    return NextResponse.json({ error: 'Não foi possível liberar este material agora. Tente novamente.' }, { status: 500 });
  }
}
