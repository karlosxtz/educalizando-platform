import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SCHOOL_CALENDAR_TAGS } from '@/lib/school-calendar';
import { supabaseAdmin } from '@/lib/supabase';

const SURFACES = ['homepage_campaign', 'homepage_monthly', 'homepage_upcoming', 'calendar'] as const;
type CampaignSurface = typeof SURFACES[number];

export async function POST(request: Request) {
  try {
    const payload: unknown = await request.json();
    if (!payload || typeof payload !== 'object') return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });

    const { tag, surface } = payload as { tag?: unknown; surface?: unknown };
    if (typeof tag !== 'string' || !SCHOOL_CALENDAR_TAGS.includes(tag as typeof SCHOOL_CALENDAR_TAGS[number])) {
      return NextResponse.json({ error: 'Tema inválido.' }, { status: 400 });
    }
    if (typeof surface !== 'string' || !SURFACES.includes(surface as CampaignSurface)) {
      return NextResponse.json({ error: 'Origem inválida.' }, { status: 400 });
    }

    const cookieStore = await cookies();
    let visitorId = cookieStore.get('educalizando_calendar_visitor')?.value;
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      cookieStore.set({
        name: 'educalizando_calendar_visitor',
        value: visitorId,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60,
      });
    }

    const { data: recentClick, error: recentError } = await supabaseAdmin
      .from('calendar_campaign_clicks')
      .select('id')
      .eq('tag', tag)
      .eq('surface', surface)
      .eq('visitor_id', visitorId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1)
      .maybeSingle();

    if (recentError) throw recentError;
    if (!recentClick) {
      const { error } = await supabaseAdmin.from('calendar_campaign_clicks').insert({ tag, surface, visitor_id: visitorId });
      if (error) throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[calendar-campaigns/track]', error);
    return NextResponse.json({ error: 'Não foi possível registrar a métrica.' }, { status: 500 });
  }
}
