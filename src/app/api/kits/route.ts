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

    console.log(`[API /api/kits DELETE] Executando Soft Delete. ID bruto: "${id}", cleanId: "${cleanId}", validUUID: "${validUUID}"`);

    // Soft Delete Definitivo no Supabase: preserva integridade relacional
    if (validUUID) {
      const { error } = await supabaseAdmin
        .from('kits')
        .update({
          excluido_em: new Date().toISOString(),
          status: 'excluido',
          updated_at: new Date().toISOString()
        })
        .eq('id', validUUID);

      if (error) {
        console.error('[API /api/kits DELETE] Erro ao aplicar Soft Delete no Supabase:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log(`[API /api/kits DELETE] Soft Delete persistido com sucesso para o kit ${validUUID}`);
    }

    // Purga imediata do cache do Next.js
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/loja/[slug]', 'page');
      revalidatePath('/dashboard', 'page');
      revalidatePath('/dashboard/kits', 'page');
    } catch (e) {}

    return NextResponse.json({ success: true, softDeleted: true, id, validUUID });
  } catch (err: any) {
    console.error('[API /api/kits DELETE] Exceção:', err);
    return NextResponse.json({ error: err.message || 'Erro interno ao excluir kit.' }, { status: 500 });
  }
}
