import { generateSignedNonce } from '@/lib/crypto-service';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { nonce, expiresAt, signature } = generateSignedNonce();
    return NextResponse.json({ success: true, nonce, expiresAt, signature });
  } catch (_error: any) {
    return NextResponse.json({ success: false, error: 'Erro ao gerar ticket criptográfico.' }, { status: 500 });
  }
}
