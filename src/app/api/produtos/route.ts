import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const isValidUUID = (str: string | null | undefined): boolean => {
  if (!str) return false;
  const clean = str.replace(/^store_/i, '');
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
};

const sanitizeUUID = (str: string | null | undefined): string | null => {
  if (!str) return null;
  const clean = str.replace(/^store_/i, '');
  return isValidUUID(clean) ? clean : null;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      store_id, 
      titulo, 
      descricao, 
      tipo = 'pdf', 
      preco = 0, 
      capa_url, 
      arquivo_url, 
      status = 'publicado',
      category_id,
      education_level_id 
    } = body;

    if (!titulo || !titulo.trim()) {
      return NextResponse.json({ error: 'O título do produto é obrigatório.' }, { status: 400 });
    }

    const cleanStoreId = (store_id || '').toString().replace(/^store_/i, '');

    const productPayload: Record<string, any> = {
      titulo: titulo.trim(),
      descricao: descricao || null,
      tipo,
      preco: Number(preco) || 0,
      capa_url: capa_url || null,
      arquivo_url: arquivo_url || null,
      status: status || 'publicado',
      category_id: sanitizeUUID(category_id),
      education_level_id: sanitizeUUID(education_level_id),
      created_at: new Date().toISOString()
    };

    if (isValidUUID(cleanStoreId)) {
      productPayload.store_id = cleanStoreId;
    }

    console.log('[API /api/produtos POST] Criando produto no Supabase:', productPayload);

    const { data, error } = await supabase
      .from('products')
      .insert([productPayload])
      .select()
      .single();

    if (error) {
      console.error('[API /api/produtos POST] Erro Supabase:', error.message);
      // Tentar sem restrição de FKs se houver
      const fallbackPayload = {
        store_id: isValidUUID(cleanStoreId) ? cleanStoreId : null,
        titulo: titulo.trim(),
        descricao: descricao || null,
        tipo,
        preco: Number(preco) || 0,
        capa_url: capa_url || null,
        arquivo_url: arquivo_url || null,
        status: status || 'publicado',
        created_at: new Date().toISOString()
      };

      const { data: retryData, error: retryError } = await supabase
        .from('products')
        .insert([fallbackPayload])
        .select()
        .single();

      if (retryError) {
        console.error('[API /api/produtos POST Retry] Erro no fallback:', retryError.message);
        return NextResponse.json({ error: retryError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, product: retryData });
    }

    return NextResponse.json({ success: true, product: data });
  } catch (err: any) {
    console.error('[API /api/produtos POST] Exceção:', err);
    return NextResponse.json({ error: err.message || 'Erro interno ao criar produto.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do produto é obrigatório para atualização.' }, { status: 400 });
    }

    const cleanedUpdates: Record<string, any> = { ...updates };
    if ('category_id' in cleanedUpdates) {
      cleanedUpdates.category_id = sanitizeUUID(cleanedUpdates.category_id);
    }
    if ('education_level_id' in cleanedUpdates) {
      cleanedUpdates.education_level_id = sanitizeUUID(cleanedUpdates.education_level_id);
    }
    if ('store_id' in cleanedUpdates && cleanedUpdates.store_id) {
      const cleanStoreId = cleanedUpdates.store_id.toString().replace(/^store_/i, '');
      if (isValidUUID(cleanStoreId)) {
        cleanedUpdates.store_id = cleanStoreId;
      } else {
        delete cleanedUpdates.store_id;
      }
    }

    cleanedUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('products')
      .update(cleanedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[API /api/produtos PUT] Erro Supabase:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: data });
  } catch (err: any) {
    console.error('[API /api/produtos PUT] Exceção:', err);
    return NextResponse.json({ error: err.message || 'Erro interno ao atualizar produto.' }, { status: 500 });
  }
}
