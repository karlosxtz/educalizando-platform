import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const { email, source = 'site' } = await request.json();
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!EMAIL_PATTERN.test(normalizedEmail) || normalizedEmail.length > 254) {
      return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('marketing_leads')
      .upsert({ email: normalizedEmail, source: typeof source === 'string' ? source.slice(0, 80) : 'site', consented_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'email' });

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ error: 'A captação ainda não está disponível. Execute a migration de leads.' }, { status: 503 });
      throw error;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[leads] Erro ao registrar lead:', error);
    return NextResponse.json({ error: 'Não foi possível registrar seu e-mail agora.' }, { status: 500 });
  }
}
