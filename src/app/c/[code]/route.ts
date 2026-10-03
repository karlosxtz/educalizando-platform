import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const COOKIE_NAME = 'educalizando_ai_campaign';

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const safeCode = String(code || '').trim().slice(0, 64);
  const origin = new URL(request.url).origin;
  if (!safeCode) return NextResponse.redirect(new URL('/', origin));

  const { data: campaign } = await supabaseAdmin
    .from('ai_marketing_campaigns')
    .select('id,code,variant,product:products(id,slug)')
    .eq('code', safeCode)
    .maybeSingle();

  const relation = Array.isArray(campaign?.product) ? campaign.product[0] : campaign?.product;
  if (!campaign || !relation?.id) return NextResponse.redirect(new URL('/', origin));

  const cookieHeader = request.headers.get('cookie') || '';
  const existingVisitor = cookieHeader.match(/(?:^|;\s*)educalizando_campaign_visitor=([0-9a-f-]{36})/i)?.[1];
  const visitorId = existingVisitor || crypto.randomUUID();
  await supabaseAdmin.from('ai_marketing_campaign_clicks').upsert({ campaign_id: campaign.id, visitor_id: visitorId }, { onConflict: 'campaign_id,visitor_id', ignoreDuplicates: true });

  const destination = new URL(`/produto/${encodeURIComponent(relation.slug || relation.id)}`, origin);
  destination.searchParams.set('utm_source', 'educalizando_ia');
  destination.searchParams.set('utm_medium', 'creator_campaign');
  destination.searchParams.set('utm_campaign', safeCode);
  destination.searchParams.set('utm_content', `variant_${campaign.variant.toLowerCase()}`);

  const response = NextResponse.redirect(destination);
  response.cookies.set(COOKIE_NAME, campaign.id, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30, path: '/' });
  response.cookies.set('educalizando_campaign_visitor', visitorId, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 365, path: '/' });
  return response;
}
