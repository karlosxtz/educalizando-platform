import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getRequestUser } from '@/lib/api-auth';

export async function GET(request: Request, { params }: { params: Promise<{ contentId: string }> }) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Autenticação obrigatória.' }, { status: 401 });

  const { contentId } = await params;
  const productId = new URL(request.url).searchParams.get('productId');
  if (!productId) return NextResponse.json({ error: 'Produto do conteúdo não informado.' }, { status: 400 });

  const [{ data: access }, { data: content }] = await Promise.all([
    supabaseAdmin.from('student_product_access').select('id').eq('student_id', user.id).eq('product_id', productId).eq('status', 'ACTIVE').maybeSingle(),
    supabaseAdmin.from('digital_contents').select('id, store_id, product_id, titulo, url, active, tipo').eq('id', contentId).eq('product_id', productId).maybeSingle(),
  ]);

  if (!access) return NextResponse.json({ error: 'Você não possui acesso a este conteúdo.' }, { status: 403 });
  if (!content || !content.active || content.tipo !== 'LINK_EXTERNO') return NextResponse.json({ error: 'Link de conteúdo indisponível.' }, { status: 404 });
  if (!/^https:\/\//i.test(content.url)) return NextResponse.json({ error: 'O link cadastrado não é seguro.' }, { status: 400 });

  const { error } = await supabaseAdmin.from('content_access_events').insert({
    store_id: content.store_id,
    customer_id: user.id,
    customer_name: user.user_metadata?.full_name || null,
    customer_email: user.email || null,
    content_id: content.id,
    content_title: content.titulo,
    product_id: content.product_id,
    event_type: 'EXTERNAL_LINK_ACCESS',
  });
  if (error) return NextResponse.json({ error: 'Não foi possível registrar o acesso.' }, { status: 500 });

  return NextResponse.json({ url: content.url });
}
