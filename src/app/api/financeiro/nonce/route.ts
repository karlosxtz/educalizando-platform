import { NextResponse } from 'next/server';
import { generateSignedNonce } from '@/lib/crypto-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { nonce, expiresAt, signature } = generateSignedNonce();
    return NextResponse.json({ success: true, nonce, expiresAt, signature });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Erro ao gerar ticket criptográfico.' }, { status: 500 });
  }
}
