import { getRequestUser } from '@/lib/api-auth';
import { getProductDeletionProtection,productDeletionBlockedMessage } from '@/lib/product-deletion-policy';
import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { isValidUUID } from './helpers';

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID do produto é obrigatório.' }, { status: 400 });

  const { data: product } = await supabaseAdmin
    .from('products')
    .select('*, images:product_images(*), bncc_skills:product_bncc_skills(bncc_skill_id), store:stores!inner(creator_id)')
    .eq('id', id)
    .eq('store.creator_id', user.id)
    .maybeSingle();
  if (!product) return NextResponse.json({ error: 'Produto não encontrado ou sem permissão.' }, { status: 404 });

  const { data: delivery } = await supabaseAdmin
    .from('product_deliveries')
    .select('arquivo_url, arquivo_nome, plr_license_url')
    .eq('product_id', id)
    .maybeSingle();
  const { data: deliveryFiles } = await supabaseAdmin
    .from('product_delivery_files')
    .select('id, delivery_type, file_url, file_name, file_size_bytes, mime_type, order_index')
    .eq('product_id', id)
    .order('order_index', { ascending: true });
  const mapFiles = (type: 'original' | 'plr') => (deliveryFiles || []).filter((file) => file.delivery_type === type).map((file) => ({
    id: file.id,
    url: file.file_url,
    name: file.file_name,
    size: file.file_size_bytes,
    mimeType: file.mime_type,
    orderIndex: file.order_index,
  }));
  const { store: _store, ...safeProduct } = product;
  return NextResponse.json({
    success: true,
    product: { ...safeProduct, arquivo_url: delivery?.arquivo_url || null, arquivo_nome: delivery?.arquivo_nome || null, plr_license_url: delivery?.plr_license_url || null, delivery_files: mapFiles('original'), plr_delivery_files: mapFiles('plr') }
  });
}

export { POST } from './post';
export { PUT } from './put';

export async function DELETE(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado. Token ausente ou inválido.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const requestStoreId = searchParams.get('store_id');

    if (!id) {
      return NextResponse.json({ error: 'ID do produto é obrigatório para exclusão.' }, { status: 400 });
    }
    
    if (!requestStoreId) {
      return NextResponse.json({ error: 'O ID da loja atual (store_id) é obrigatório para exclusão.' }, { status: 400 });
    }

    const cleanId = id.replace(/^prod_/i, '');
    const validUUID = isValidUUID(cleanId) ? cleanId : (isValidUUID(id) ? id : null);
    const cleanRequestStoreId = requestStoreId.replace(/^store_/i, '');

    if (!validUUID) {
      return NextResponse.json({ error: `ID inválido para exclusão: "${id}"` }, { status: 400 });
    }

    // Validar propriedade da loja (se a loja solicitada pertence ao usuário)
    const { data: requestedStore } = await supabaseAdmin.from('stores').select('creator_id').eq('id', cleanRequestStoreId).maybeSingle();
    if (!requestedStore || requestedStore.creator_id !== user.id) {
       return NextResponse.json({ error: 'Você não tem permissão para administrar esta loja.' }, { status: 403 });
    }

    // Validar se o produto pertence de fato à loja sendo administrada
    const { data: product, error: productError } = await supabaseAdmin.from('products').select('store_id').eq('id', validUUID).maybeSingle();
    if (productError) {
      return NextResponse.json({ error: 'Não foi possível validar o produto antes da exclusão.' }, { status: 500 });
    }
    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });
    }
    if (product.store_id !== cleanRequestStoreId) {
      return NextResponse.json({ error: 'Este produto pertence a outra loja e não pode ser excluído por aqui.' }, { status: 403 });
    }

    const deletionProtection = await getProductDeletionProtection(validUUID);
    if (deletionProtection.blocked) {
      return NextResponse.json({
        error: productDeletionBlockedMessage(deletionProtection),
        code: 'PRODUCT_HAS_PURCHASES',
        protection: deletionProtection,
      }, { status: 409 });
    }

    console.log(`[API /api/produtos DELETE] Executando Soft Delete. ID bruto: "${id}", validUUID: "${validUUID}"`);

    // Soft Delete Definitivo via supabaseAdmin (service role key — ignora RLS)
    // Estratégia de fallback escalonado para máxima compatibilidade:
    //   1. excluido_em + status = 'excluido' (ideal, requer migration completa)
    //   2. apenas excluido_em (caso CHECK constraint de status ainda bloqueie)
    //   3. apenas status = 'excluido' (caso coluna excluido_em não exista)

    let softDeleteSuccess = false;

    // Tentativa 1: Soft Delete completo (excluido_em + status)
    const { data: d1, error: err1 } = await supabaseAdmin
      .from('products')
      .update({
        excluido_em: new Date().toISOString(),
        status: 'excluido',
        updated_at: new Date().toISOString()
      })
      .eq('id', validUUID)
      .select('id')
      .maybeSingle();

    if (!err1 && d1) {
      softDeleteSuccess = true;
      console.log(`[API /api/produtos DELETE] Soft delete completo (excluido_em + status) OK para ${validUUID}`);
    } else {
      console.warn('[API /api/produtos DELETE] Tentativa 1 falhou:', err1?.message || 'nenhuma linha afetada');

      // Tentativa 2: Apenas excluido_em (CHECK constraint pode bloquear status='excluido')
      const { data: d2, error: err2 } = await supabaseAdmin
        .from('products')
        .update({
          excluido_em: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', validUUID)
        .select('id')
        .maybeSingle();

      if (!err2 && d2) {
        softDeleteSuccess = true;
        console.log(`[API /api/produtos DELETE] Soft delete parcial (apenas excluido_em) OK para ${validUUID}`);
      } else {
        console.warn('[API /api/produtos DELETE] Tentativa 2 falhou:', err2?.message || 'nenhuma linha afetada');

        // Tentativa 3: Apenas status (coluna excluido_em pode não existir)
        const { data: d3, error: err3 } = await supabaseAdmin
          .from('products')
          .update({
            status: 'excluido',
            updated_at: new Date().toISOString()
          })
          .eq('id', validUUID)
          .select('id')
          .maybeSingle();

        if (!err3 && d3) {
          softDeleteSuccess = true;
          console.log(`[API /api/produtos DELETE] Soft delete (apenas status) OK para ${validUUID}`);
        } else {
          console.error('[API /api/produtos DELETE] TODAS as tentativas de soft delete falharam:', err3?.message || 'nenhuma linha afetada');
        }
      }
    }

    if (!softDeleteSuccess) {
      // Verificar se o produto sequer existe
      const { data: existing } = await supabaseAdmin
        .from('products')
        .select('id, store_id')
        .eq('id', validUUID)
        .is('excluido_em', null)
        .maybeSingle();

      if (!existing) {
        // Produto já foi excluído ou nunca existiu — considerar sucesso
        console.log(`[API /api/produtos DELETE] Produto ${validUUID} não encontrado no banco (já excluído ou inexistente).`);
        softDeleteSuccess = true;
      } else {
        return NextResponse.json({ 
          error: 'Falha ao excluir produto. A migration de soft delete pode não ter sido executada. Execute migrations_soft_delete.sql no Supabase.',
          details: 'CHECK constraint ou coluna ausente impedindo o UPDATE.'
        }, { status: 500 });
      }
    }

    // Purga imediata do cache do Next.js
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/loja/[slug]', 'page');
      revalidatePath('/dashboard', 'page');
      revalidatePath('/dashboard/produtos', 'page');
      revalidatePath('/dashboard/conteudo', 'page');
      revalidatePath('/dashboard/kits', 'page');
      revalidatePath('/dashboard/cupons', 'page');
    } catch (_e) {}

    return NextResponse.json({ success: true, softDeleted: true, id, validUUID });
  } catch (err: any) {
    console.error('[API /api/produtos DELETE] Exceção:', err);
    return NextResponse.json({ error: err.message || 'Erro interno ao excluir produto.' }, { status: 500 });
  }
}
