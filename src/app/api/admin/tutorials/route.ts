import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Helper for auth validation
async function validateAdminRequest(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  // Super simple basic auth for the example/prototype
  // Em produção, isso seria verificado por sessão ou JWT do Supabase
  if (authHeader === 'Bearer SUPERADMIN_SECRET_KEY' || process.env.NODE_ENV === 'development') {
    return true;
  }
  return false;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    
    let query = supabaseAdmin
      .from('platform_tutorials')
      .select('*')
      .order('order', { ascending: true })
      .order('created_at', { ascending: false });
      
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query;

    // Se houver erro de tabela inexistente (42P01) ou se a tabela estiver vazia, retorna os mocks
    if (error && error.code !== '42P01') {
      throw error;
    }
    
    if (!data || data.length === 0 || error?.code === '42P01') {
      return NextResponse.json([
        { id: '1', title: 'Como Cadastrar seu Primeiro Produto', description: 'Aprenda o passo a passo...', youtube_id: 'dQw4w9WgXcQ', duration: '05:20', order: 1, is_active: true },
        { id: '2', title: 'Como Criar Kits (Combos) Lucrativos', description: 'Descubra como agrupar seus materiais...', youtube_id: 'dQw4w9WgXcQ', duration: '03:45', order: 2, is_active: true }
      ]);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching tutorials:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await validateAdminRequest(request);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, description, youtube_id, duration, order, is_active } = body;

    const { data, error } = await supabaseAdmin
      .from('platform_tutorials')
      .insert([{
        title,
        description,
        youtube_id,
        duration: duration || '00:00',
        order: order || 0,
        is_active: is_active !== false
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') throw new Error('A tabela platform_tutorials não existe. Execute o script SQL no Supabase.');
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const isAdmin = await validateAdminRequest(request);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, title, description, youtube_id, duration, order, is_active } = body;

    if (!id) return NextResponse.json({ error: 'Tutorial ID is required' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('platform_tutorials')
      .update({
        title,
        description,
        youtube_id,
        duration,
        order,
        is_active
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') throw new Error('A tabela platform_tutorials não existe. Execute o script SQL no Supabase.');
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const isAdmin = await validateAdminRequest(request);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Tutorial ID is required' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('platform_tutorials')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '42P01') throw new Error('A tabela platform_tutorials não existe. Execute o script SQL no Supabase.');
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
