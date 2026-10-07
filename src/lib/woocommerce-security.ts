import { createCipheriv,createDecipheriv,createHmac,randomBytes,timingSafeEqual } from 'node:crypto';
import { getConfiguredCryptoSecret } from './financial-configuration';

const key = () => createHmac('sha256', getConfiguredCryptoSecret()).update('educalizando:woocommerce:v1').digest();

export function encryptWooSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptWooSecret(value: string) {
  const [iv,tag,data] = value.split('.').map(part => Buffer.from(part, 'base64url'));
  const decipher = createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export function validWooSignature(raw: string, signature: string, secret: string) {
  const expected = createHmac('sha256', secret).update(raw).digest('base64');
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}
