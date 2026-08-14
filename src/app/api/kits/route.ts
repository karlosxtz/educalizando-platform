import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';

const isValidUUID = (str: string | null | undefined): boolean => {
  if (!str) return false;
  const clean = str.replace(/^kit_/i, '');
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
};

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do kit/combo é obrigatório para exclusão.' }, { status: 400 });
    }

    const cleanId = id.replace(/^kit_/i, '');
    const validUUID = isValidUUID(cleanId) ? cleanId : (isValidUUID(id) ? id : null);

    console.log(`[API /api/kits DELETE] Processando exclusão. ID bruto: "${id}", cleanId: "${cleanId}", validUUID: "${validUUID}"`);

    // 1. Se for um UUID real no Supabase, processar deleção relacional no banco
    if (validUUID) {
      try {
        const { data: orderItem } = await supabaseAdmin
          .from('order_items')
          .select('id')
          .eq('kit_id', validUUID)
          .limit(1)
          .maybeSingle();

        if (orderItem?.id) {
          return NextResponse.json({ 
            error: 'Não é possível excluir este combo/kit pois ele possui vendas realizadas. Altere seu status para "Rascunho" para ocultá-lo da loja.',
            hasSales: true
          }, { status: 400 });
        }

        const { data: accessItem } = await supabaseAdmin
          .from('student_product_access')
          .select('id')
          .eq('kit_id', validUUID)
          .limit(1)
          .maybeSingle();

        if (accessItem?.id) {
          return NextResponse.json({ 
            error: 'Não é possível excluir este combo/kit pois alunos já possuem acesso adquirido. Altere para "Rascunho".',
            hasSales: true
          }, { status: 400 });
        }
      } catch (checkErr) {
        console.warn('[API /api/kits DELETE] Aviso ao verificar vendas do kit:', checkErr);
      }

      // 2. Limpar dependências relacionais
      try {
        await supabaseAdmin.from('kit_items').delete().eq('kit_id', validUUID);
      } catch (e) {}
      try {
        await supabaseAdmin.from('kit_products').delete().eq('kit_id', validUUID);
      } catch (e) {}
      try {
        await supabaseAdmin.from('coupon_products').delete().eq('kit_id', validUUID);
      } catch (e) {}

      // 3. Excluir o kit da tabela kits com supabaseAdmin
      const { error } = await supabaseAdmin
        .from('kits')
        .delete()
        .eq('id', validUUID);

      if (error) {
        console.error('[API /api/kits DELETE] Erro Supabase Admin:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log(`[API /api/kits DELETE] Kit ${validUUID} excluído com sucesso do Supabase Postgres.`);
    }

    // Purga imediata do cache do Next.js
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/loja/[slug]', 'page');
      revalidatePath('/dashboard', 'page');
      revalidatePath('/dashboard/kits', 'page');
    } catch (e) {}

    return NextResponse.json({ success: true, id, validUUID });
  } catch (err: any) {
    console.error('[API /api/kits DELETE] Exceção:', err);
    return NextResponse.json({ error: err.message || 'Erro interno ao excluir kit.' }, { status: 500 });
  }
}
