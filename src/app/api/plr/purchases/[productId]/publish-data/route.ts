import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Retorna somente os metadados pedagógicos de um PLR já pago pelo criador.
 * Arquivos, capa, descrição comercial e URLs de entrega nunca são copiados
 * para a nova publicação: cada revendedor deve personalizar esses elementos.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

    const isCreator = user.user_metadata?.role === 'creator' || user.user_metadata?.is_creator === true;
    if (!isCreator) {
      return NextResponse.json({ error: 'Este recurso é exclusivo para criadores.' }, { status: 403 });
    }

    const { productId } = await params;
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('student_id', user.id)
      .eq('is_plr_purchase', true)
      .eq('status', 'paid');
    if (ordersError) throw ordersError;
    if (!orders?.length) {
      return NextResponse.json({ error: 'Nenhuma licença PLR paga foi encontrada.' }, { status: 403 });
    }

    const { data: purchasedItem, error: itemError } = await supabaseAdmin
      .from('order_items')
      .select('id')
      .in('order_id', orders.map((order) => order.id))
      .eq('product_id', productId)
      .limit(1)
      .maybeSingle();
    if (itemError) throw itemError;
    if (!purchasedItem) {
      return NextResponse.json({ error: 'Você não possui uma licença PLR válida para este material.' }, { status: 403 });
    }

    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('titulo, tipo, category_id, education_level_id, page_count, age_range, format_details')
      .eq('id', productId)
      .eq('is_plr', true)
      .is('excluido_em', null)
      .maybeSingle();
    if (productError) throw productError;
    if (!product) return NextResponse.json({ error: 'Material PLR não encontrado.' }, { status: 404 });

    const { data: productSkills, error: skillsError } = await supabaseAdmin
      .from('product_bncc_skills')
      .select('bncc_skill_id')
      .eq('product_id', productId);
    if (skillsError) throw skillsError;

    return NextResponse.json({
      sourceTitle: product.titulo,
      data: {
        tipo: product.tipo,
        categoryId: product.category_id,
        educationLevelId: product.education_level_id,
        pageCount: product.page_count,
        ageRange: product.age_range,
        formatDetails: product.format_details,
        bnccSkillIds: (productSkills || []).map((skill) => skill.bncc_skill_id).filter(Boolean)
      }
    });
  } catch (error) {
    console.error('[GET /api/plr/purchases/:productId/publish-data] Erro:', error);
    return NextResponse.json({ error: 'Não foi possível preparar os dados da licença PLR.' }, { status: 500 });
  }
}
