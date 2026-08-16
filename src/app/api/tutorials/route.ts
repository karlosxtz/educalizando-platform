import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('platform_tutorials')
      .select('*')
      .eq('is_active', true)
      .order('order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error && error.code !== '42P01') {
      throw error;
    }

    // Fallback em caso de banco de dados não atualizado / rodando local
    if (!data || data.length === 0 || error?.code === '42P01') {
      return NextResponse.json([
        { 
          id: '1', 
          title: 'Como Cadastrar seu Primeiro Produto', 
          description: 'Aprenda o passo a passo para cadastrar um material em PDF ou e-book e deixá-lo pronto para venda imediata.', 
          youtube_id: 'dQw4w9WgXcQ', 
          duration: '05:20',
          order: 1 
        },
        { 
          id: '2', 
          title: 'Como Criar Kits (Combos) Lucrativos', 
          description: 'Descubra como agrupar seus materiais em combos para aumentar o ticket médio da sua loja.', 
          youtube_id: 'dQw4w9WgXcQ', 
          duration: '03:45',
          order: 2 
        },
        { 
          id: '3', 
          title: 'Configurando sua Vitrine e Chave PIX', 
          description: 'Entenda como personalizar o visual da sua loja e garantir que os pagamentos caiam direto na sua conta.', 
          youtube_id: 'dQw4w9WgXcQ', 
          duration: '04:10',
          order: 3 
        }
      ]);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching public tutorials:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
