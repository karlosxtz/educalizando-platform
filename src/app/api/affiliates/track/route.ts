import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getStoreBySlug } from '@/lib/store-service';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUserRole } from '@/lib/student-service';

export async function POST(request: Request) {
  try {
    const { ref, pathname, referer } = await request.json();

    if (!ref || !pathname) {
      return NextResponse.json({ error: 'Missing ref or pathname' }, { status: 400 });
    }

    // 1. Extrair o storeSlug do pathname
    // Exemplo: /loja/minha-loja/produto/prod_123 -> segments: ['', 'loja', 'minha-loja', ...]
    const segments = pathname.split('/').filter(Boolean);
    let storeSlug = null;
    
    if (segments[0] === 'loja' && segments.length >= 2) {
      storeSlug = segments[1];
    } else if (segments.length > 0 && !['admin', 'api', 'login', 'afiliado', 'aluno'].includes(segments[0])) {
      // Caso a raiz seja a loja
      storeSlug = segments[0];
    }

    if (!storeSlug) {
      return NextResponse.json({ error: 'Contexto de loja não encontrado' }, { status: 400 });
    }

    // 2. Resolver o storeId
    const store = await getStoreBySlug(storeSlug);
    if (!store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // 3. Validar o Afiliado no Servidor
    const { data: affiliate } = await supabaseAdmin
      .from('affiliates')
      .select('id, user_id, status, stores(affiliate_program_enabled)')
      .eq('id', ref)
      .eq('store_id', store.id)
      .single();

    if (!affiliate || affiliate.status !== 'aprovado') {
      return NextResponse.json({ error: 'Afiliado inválido ou inativo' }, { status: 400 });
    }

    const storeConfig = Array.isArray(affiliate.stores) ? affiliate.stores[0] : affiliate.stores;
    if (!storeConfig || !storeConfig.affiliate_program_enabled) {
      return NextResponse.json({ error: 'Programa de afiliados inativo nesta loja' }, { status: 400 });
    }

    // 4. Bloqueio de Self-Referral (Autoafiliação) no Tracker
    const authSession = await getAuthenticatedUserRole();
    if (authSession?.userId === affiliate.user_id) {
      console.log(`[AffiliateTracker] Self-referral evitado no tracking: Comprador ${authSession.userId} tentou clicar no próprio link.`);
      return NextResponse.json({ error: 'Self-referral não permitido' }, { status: 400 });
    }

    // 5. Configurar o Cookie Seguro
    const cookieStore = await cookies();
    
    // Obter cookie existente para não sobrescrever outras lojas
    const existingCookie = cookieStore.get('educalizando_affiliates');
    let affiliatesData: Record<string, string> = {};
    
    if (existingCookie && existingCookie.value) {
      try {
        affiliatesData = JSON.parse(existingCookie.value);
      } catch (e) {
        affiliatesData = {};
      }
    }

    // Atualizar apenas a loja atual
    affiliatesData[store.id] = ref;

    const isProd = process.env.NODE_ENV === 'production';
    
    cookieStore.set({
      name: 'educalizando_affiliates',
      value: JSON.stringify(affiliatesData),
      path: '/',
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 dias
    });

    // 6. Rastreamento Persistente de Cliques (affiliate_clicks)
    let visitorId = cookieStore.get('educalizando_affiliate_visitor')?.value;
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      cookieStore.set({
        name: 'educalizando_affiliate_visitor',
        value: visitorId,
        path: '/',
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60 // 1 ano
      });
    }

    // Tentar extrair product_id do pathname
    let productId = null;
    if (segments.includes('produto')) {
      const idx = segments.indexOf('produto');
      if (segments.length > idx + 1) {
        const potentialId = segments[idx + 1];
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(potentialId)) {
          productId = potentialId;
        }
      }
    }

    // Deduplicação: Verificar se já existe um clique nas últimas 24h para esse visitante/afiliado/loja
    const { data: recentClick } = await supabaseAdmin
      .from('affiliate_clicks')
      .select('id')
      .eq('visitor_id', visitorId)
      .eq('affiliate_id', ref)
      .eq('store_id', store.id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1)
      .maybeSingle();

    if (!recentClick) {
      // Registrar novo clique
      await supabaseAdmin.from('affiliate_clicks').insert([{
        affiliate_id: ref,
        store_id: store.id,
        product_id: productId,
        visitor_id: visitorId,
        referer: referer || null
      }]);
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('[Affiliate Track API Error]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
