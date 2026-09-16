import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    if (!(await isSuperAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error fetching tutorials:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await isSuperAdmin(request);
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
      if ((error as any).code === '42P01') throw new Error('A tabela platform_tutorials não existe. Execute o script SQL no Supabase.');
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const isAdmin = await isSuperAdmin(request);
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
      if ((error as any).code === '42P01') throw new Error('A tabela platform_tutorials não existe. Execute o script SQL no Supabase.');
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const isAdmin = await isSuperAdmin(request);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Tutorial ID is required' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('platform_tutorials')
      .delete()
      .eq('id', id);

    if (error) {
      if ((error as any).code === '42P01') throw new Error('A tabela platform_tutorials não existe. Execute o script SQL no Supabase.');
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
