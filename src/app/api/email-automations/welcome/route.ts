import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { sendWelcomeAffiliateEmail, sendWelcomeCreatorEmail, sendWelcomeStudentEmail } from '@/lib/mail-service';

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user?.email) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const { role } = await request.json() as { role?: 'student' | 'creator' | 'affiliate' };
  const name = user.user_metadata?.full_name || 'Usuário';
  const result = role === 'creator'
    ? await sendWelcomeCreatorEmail({ producerEmail: user.email, producerName: name })
    : role === 'affiliate'
      ? await sendWelcomeAffiliateEmail({ affiliateEmail: user.email, affiliateName: name })
      : await sendWelcomeStudentEmail({ buyerEmail: user.email, buyerName: name });
  return NextResponse.json(result, { status: result.sent ? 200 : 422 });
}
