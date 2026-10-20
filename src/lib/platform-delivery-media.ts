import 'server-only';
import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { resolveRemoteAddresses } from './remote-addresses';
import { resolveBucket, uploadObject, headObject } from './object-storage';
import { MAX_DELIVERY_FILE_BYTES } from './product-delivery-files';
import type { PlatformDelivery } from './platform-delivery-contract';

function publicAddress(ip: string) {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 || a === 192 && (b === 168 || b === 0) || a === 100 && b >= 64 && b <= 127 || a === 198 && [18, 19, 51].includes(b) || a === 203 && b === 0);
  }
  return isIP(ip) === 6 && /^2[0-9a-f]{3}:/i.test(ip) && !/^2001:(db8|0):|^2002:/i.test(ip);
}
export async function validatePlatformDeliveryUrl(value: string) {
  const url = new URL(value), host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.port && url.port !== '443' || isIP(host.replace(/^\[|\]$/g, '')) || !host.includes('.') || /\.(local|internal|localhost|test|invalid|lan|home)$/.test(host)) throw new Error('A entrega precisa usar um endereço HTTPS público válido.');
  const addresses = await resolveRemoteAddresses(host);
  if (!addresses.length || addresses.some(item => !publicAddress(item.address))) throw new Error('A entrega não pode apontar para uma rede privada ou reservada.');
  return url;
}
function shareLink(url: URL) {
  return url.hostname === 'drive.google.com' && /^\/(file\/d\/|drive\/folders\/)/.test(url.pathname)
    || url.hostname === 'docs.google.com' && /^\/(document|presentation|spreadsheets|forms)\/d\//.test(url.pathname)
    || ['canva.com', 'www.canva.com'].includes(url.hostname) && url.pathname.startsWith('/design/')
    || url.hostname === '1drv.ms' || url.hostname === 'onedrive.live.com'
    || ['www.dropbox.com', 'dropbox.com'].includes(url.hostname) && /^\/(s\/|scl\/)/.test(url.pathname);
}
/** Never forwards the export Bearer token. Files go exclusively to private storage. */
export async function mirrorPlatformDelivery(file: PlatformDelivery, storeId: string, productId: string, index: number) {
  let url = await validatePlatformDeliveryUrl(file.url);
  for (let redirects = 0; redirects <= 3; redirects++) {
    if (shareLink(url)) return { url: url.toString(), name: file.name, size: null, mimeType: null, external: true };
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(30000), cache: 'no-store', headers: { Accept: 'application/pdf, application/zip, application/octet-stream' } });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location'); await response.body?.cancel();
      if (!location || redirects === 3) throw new Error('A entrega retornou redirecionamentos inválidos.');
      url = await validatePlatformDeliveryUrl(new URL(location, url).toString());
      continue;
    }
    if (!response.ok || !response.body) { await response.body?.cancel(); throw new Error('A entrega não pôde ser baixada. Confira se o endereço fornecido pela origem continua válido.'); }
    const mime = (response.headers.get('content-type') || 'application/octet-stream').split(';')[0].trim().toLowerCase();
    const fileHint = /\.(pdf|zip|docx?|pptx?|xlsx?|png|jpe?g|webp)(?:$|[?#])/i.test(file.name) || /\.(pdf|zip|docx?|pptx?|xlsx?|png|jpe?g|webp)$/i.test(url.pathname);
    if (mime === 'text/html' && !fileHint) { await response.body.cancel(); return { url: url.toString(), name: file.name, size: null, mimeType: null, external: true }; }
    if (!/^(application\/(pdf|zip|x-zip-compressed|octet-stream|msword|vnd\.[a-z0-9.+-]+)|image\/(jpeg|png|webp)|text\/plain)$/.test(mime)) { await response.body.cancel(); throw new Error('A entrega retornou uma página ou um formato incompatível, em vez do arquivo.'); }
    const declared = Number(response.headers.get('content-length'));
    if (declared > MAX_DELIVERY_FILE_BYTES) { await response.body.cancel(); throw new Error('A entrega ultrapassa o limite de 50 MB por arquivo. Divida o arquivo ou disponibilize o material por link.'); }
    const reader = response.body.getReader(); let size = 0;
    // Keep a single destination buffer instead of retaining every chunk and
    // then duplicating a complete 50 MB file in the Worker's memory.
    let buffer = new Uint8Array(Number.isSafeInteger(declared) && declared > 0 ? declared : MAX_DELIVERY_FILE_BYTES);
    try {
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        if (size + value.byteLength > MAX_DELIVERY_FILE_BYTES) throw new Error('A entrega ultrapassa o limite de 50 MB por arquivo. Divida o arquivo ou disponibilize o material por link.');
        if (size + value.byteLength > buffer.byteLength) { const expanded = new Uint8Array(MAX_DELIVERY_FILE_BYTES); expanded.set(buffer.subarray(0, size)); buffer = expanded; }
        buffer.set(value, size); size += value.byteLength;
      }
    } finally { await reader.cancel().catch(() => {}); }
    if (!size) throw new Error('A entrega retornou um arquivo vazio.');
    const body = buffer.subarray(0, size);
    const head = new TextDecoder().decode(body.subarray(0, 1024));
    if (/^\s*(<!doctype\s+html|<html|<script)/i.test(head)) throw new Error('A entrega retornou uma página de acesso em vez do arquivo.');
    const pdf = /%PDF-/.test(head), zip = body[0] === 80 && body[1] === 75;
    const wantedPdf = mime === 'application/pdf' || /\.pdf(?:$|[?#])/i.test(file.name) || /\.pdf$/i.test(url.pathname);
    if (wantedPdf && !pdf) throw new Error('A entrega informada como PDF não contém um PDF válido.');
    const ext = pdf ? 'pdf' : zip ? (/\.(docx|pptx|xlsx)$/i.exec(file.name)?.[1]?.toLowerCase() || 'zip') : mime === 'image/jpeg' ? 'jpg' : mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : mime === 'text/plain' ? 'txt' : 'bin';
    const contentType = pdf ? 'application/pdf' : mime;
    const bucket = resolveBucket('product-files');
    const digest = createHash('sha256').update(body).digest('hex').slice(0, 24);
    const key = `platform-imports/${storeId}/${productId}/deliveries/${index}-${digest}.${ext}`;
    // A prior attempt may have uploaded successfully before its DB commit.
    // Reuse that same content-addressed object instead of creating a new version.
    let exists = false;
    try {
      const saved = await headObject(bucket, key);
      if (saved.ContentLength !== size) throw new Error('A entrega já armazenada tem tamanho incompatível. Revise o cadastro.');
      exists = true;
    } catch (error) {
      const failure = error as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (failure.$metadata?.httpStatusCode !== 404 && !['NotFound', 'NoSuchKey'].includes(failure.name || '')) throw new Error('A entrega armazenada não pôde ser verificada. Retome para tentar novamente.');
    }
    if (!exists) await uploadObject({ bucket, key, body, contentType });
    return { url: `minio://${bucket}/${key}`, name: file.name, size, mimeType: contentType, external: false };
  }
  throw new Error('A entrega não pôde ser baixada.');
}
