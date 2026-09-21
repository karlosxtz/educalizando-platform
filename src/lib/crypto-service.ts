import crypto from 'crypto';
import { getConfiguredCryptoSecret } from './financial-configuration';

/**
 * Gera um Nonce criptográfico assinado pelo servidor.
 * Este ticket tem vida útil de 60 segundos e serve para evitar Replay Attacks.
 */
export function generateSignedNonce(): { nonce: string; expiresAt: number; signature: string } {
  const serverSecret = getConfiguredCryptoSecret();
  const expiresAt = Date.now() + 60000; // 60 segundos
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = `${nonce}:${expiresAt}`;
  
  const signature = crypto
    .createHmac('sha256', serverSecret)
    .update(payload)
    .digest('hex');

  return { nonce, expiresAt, signature };
}

/**
 * Valida se um Nonce assinado pelo servidor é autêntico e não expirou.
 */
export function verifySignedNonce(nonce: string, expiresAt: number, signature: string): boolean {
  if (Date.now() > expiresAt) {
    return false; // Expirou
  }
  
  const serverSecret = getConfiguredCryptoSecret();
  const payload = `${nonce}:${expiresAt}`;
  const expectedSignature = crypto
    .createHmac('sha256', serverSecret)
    .update(payload)
    .digest('hex');

  // Time-safe compare
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    return signature === expectedSignature;
  }
}

/**
 * Verifica a assinatura digital do Payload do cliente (Anti-Tampering)
 * O cliente assina o payload usando o JWT da sua sessão como chave (pois ele possui o JWT no cookie local).
 * Se o valor for alterado por um proxy/BurpSuite no meio do caminho, a assinatura quebra.
 */
export function verifyClientPayloadSignature(
  amount: number, 
  storeId: string, 
  nonce: string, 
  clientJwtToken: string, 
  clientSignature: string
): boolean {
  const payloadString = `${amount}|${storeId}|${nonce}`;
  
  const expectedSignature = crypto
    .createHmac('sha256', clientJwtToken) // A chave é o próprio JWT do usuário
    .update(payloadString)
    .digest('hex');

  return clientSignature === expectedSignature;
}
