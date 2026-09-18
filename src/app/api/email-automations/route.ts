import { NextRequest, NextResponse } from 'next/server';
import { getMailConfiguration, sendAutomationTestEmail, sendWelcomeAffiliateEmail, sendWelcomeCreatorEmail, sendWelcomeStudentEmail } from '@/lib/mail-service';
import { supabaseAdmin } from '@/lib/supabase';

async function currentUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data } = await supabaseAdmin.auth.getUser(token);
  return data.user ?? null;
}

export async function GET(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  return NextResponse.json(getMailConfiguration());
}

export async function POST(request: NextRequest) {
  const user = await currentUser(request);
  if (!user?.email) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const body = await request.json() as { action?: string; role?: 'student' | 'creator' | 'affiliate' };
  const name = user.user_metadata?.full_name || 'Usuário';
  let result;
  if (body.action === 'test') result = await sendAutomationTestEmail(user.email, name);
  else if (body.action === 'welcome') {
    if (body.role === 'creator') result = await sendWelcomeCreatorEmail({ producerEmail: user.email, producerName: name });
    else if (body.role === 'affiliate') result = await sendWelcomeAffiliateEmail({ affiliateEmail: user.email, affiliateName: name });
    else result = await sendWelcomeStudentEmail({ buyerEmail: user.email, buyerName: name });
  } else return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  return NextResponse.json(result, { status: result.sent ? 200 : 422 });
}
