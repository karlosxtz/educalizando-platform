import 'server-only';
import { createCipheriv,createDecipheriv,createHmac,randomBytes } from 'node:crypto';
import { isIP } from 'node:net';
import { getConfiguredCryptoSecret } from './financial-configuration';
import { resolveRemoteAddresses } from './remote-addresses';

const key = () => createHmac('sha256',getConfiguredCryptoSecret()).update('educalizando:store-webhooks:v1').digest();
export function encryptWebhookSecret(value: string, storeId: string) {
  const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key(),iv);
  cipher.setAAD(Buffer.from(storeId));
  const data=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);
  return [iv,cipher.getAuthTag(),data].map(x=>x.toString('base64url')).join('.');
}
export function decryptWebhookSecret(value: string, storeId: string) {
  const [iv,tag,data]=value.split('.').map(x=>Buffer.from(x,'base64url'));
  const cipher=createDecipheriv('aes-256-gcm',key(),iv);cipher.setAAD(Buffer.from(storeId));cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(data),cipher.final()]).toString('utf8');
}
export const newWebhookSecret = () => 'whsec_'+randomBytes(32).toString('base64url');
export function signStoreWebhook(body: string, timestamp: string, secret: string) {
  return 'v1='+createHmac('sha256',secret).update(timestamp+'.'+body).digest('hex');
}
export function isPublicWebhookIp(address: string): boolean {
  const ip=address.toLowerCase().replace(/^\[|\]$/g,'');
  if (isIP(ip)===4) {
    const [a,b]=ip.split('.').map(Number);
    return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&(b===168||b===0)||a===100&&b>=64&&b<=127||a===198&&(b===18||b===19)||a===198&&b===51||a===203&&b===0);
  }
  if (isIP(ip)===6) return /^2[0-9a-f]{3}:/.test(ip)&&!ip.startsWith('2001:db8:')&&!ip.startsWith('2001:0:')&&!ip.startsWith('2002:');
  return false;
}
export async function validateWebhookUrl(value: string) {
  const url=new URL(value);
  if (url.protocol!=='https:'||url.username||url.password||url.hash||url.port&&url.port!=='443'||value.length>2048) throw new Error('Use uma URL HTTPS pública, sem usuário, senha ou fragmento.');
  const host=url.hostname.toLowerCase();
  if (!host.includes('.')||/\.(localhost|local|internal|home|lan|test|invalid)$/.test(host)||isIP(host.replace(/^\[|\]$/g,''))||host==='localhost') throw new Error('Endereços locais ou IPs não são permitidos.');
  const addresses=await resolveRemoteAddresses(host);
  if (!addresses.length||addresses.some(x=>!isPublicWebhookIp(x.address))) throw new Error('O destino não pode apontar para uma rede privada ou reservada.');
  return url.toString();
}
