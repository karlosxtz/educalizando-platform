import { NextResponse } from 'next/server';
import { getCreatorReferralPreview } from '@/lib/creator-referral-service';

export async function GET(request: Request) {
  const ref = new URL(request.url).searchParams.get('ref') || '';
  const referral = await getCreatorReferralPreview(ref);
  if (!referral) return NextResponse.json({ valid: false }, { status: 404 });
  return NextResponse.json({ valid: true, referral });
}
