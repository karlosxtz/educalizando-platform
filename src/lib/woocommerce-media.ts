import 'server-only';

import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { platformPublicImageUrl,platformPublicMediaUrl,resolveBucket,uploadObject } from '@/lib/object-storage';

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_DELIVERY_BYTES = 15 * 1024 * 1024;

function privateIp(ip: string) {
  return /^(127\.|10\.|0\.|169\.254\.|192\.168\.|::1$|fc|fd|fe80)/i.test(ip) || /^172\.(1[6-9]|2\d|3[01])\./.test(ip);
}

async function safeRemoteUrl(input: string) {
  const url = new URL(input);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('A mídia remota precisa usar HTTPS.');
  if (isIP(url.hostname) && privateIp(url.hostname)) throw new Error('Endereço de mídia inválido.');
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(address => privateIp(address.address))) throw new Error('A mídia não pode apontar para uma rede privada.');
  return url;
}

async function download(input: string, allowed: RegExp, maxBytes: number) {
  let url = await safeRemoteUrl(input);
  for (let redirect = 0; redirect <= 3; redirect++) {
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(30_000), headers: { Accept: '*/*' } });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) throw new Error('Redirecionamento de mídia inválido.');
      url = await safeRemoteUrl(new URL(location, url).toString());
      continue;
    }
    if (!response.ok || !response.body) throw new Error(`Não foi possível baixar a mídia (${response.status}).`);
    const contentType = (response.headers.get('content-type') || 'application/octet-stream').split(';')[0].trim().toLowerCase();
    if (!allowed.test(contentType)) throw new Error(`Formato de mídia não permitido: ${contentType}.`);
    const declared = Number(response.headers.get('content-length') || 0);
    if (declared > maxBytes) throw new Error('A mídia remota ultrapassa o limite permitido.');
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new Error('A mídia remota ultrapassa o limite permitido.'); }
      chunks.push(value);
    }
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    return { body, contentType, size, finalUrl: url.toString() };
  }
  throw new Error('A mídia remota possui redirecionamentos demais.');
}

function extension(contentType: string, url: string) {
  const byType: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif', 'video/mp4': 'mp4', 'video/webm': 'webm', 'application/pdf': 'pdf', 'application/zip': 'zip' };
  if (byType[contentType]) return byType[contentType];
  return new URL(url).pathname.match(/\.([a-z0-9]{1,8})$/i)?.[1]?.toLowerCase() || 'bin';
}

function stableName(url: string) { return createHash('sha256').update(url).digest('hex').slice(0, 20); }

export async function mirrorWooPublicMedia(input: string, integrationId: string, wooProductId: number, index: number) {
  const media = await download(input, /^(image|video)\//, MAX_VIDEO_BYTES);
  const isImage = media.contentType.startsWith('image/');
  if (isImage && media.size > MAX_IMAGE_BYTES) throw new Error('A imagem remota ultrapassa 15 MB.');
  const bucket = resolveBucket('product-covers');
  const key = `uploads/woocommerce/${integrationId}/${wooProductId}/media/${index}-${stableName(media.finalUrl)}.${extension(media.contentType, media.finalUrl)}`;
  await uploadObject({ bucket, key, body: media.body, contentType: media.contentType });
  return { url: isImage ? platformPublicImageUrl(bucket, key) : platformPublicMediaUrl(bucket, key), contentType: media.contentType, size: media.size };
}

export async function mirrorWooDelivery(input: string, name: string, integrationId: string, wooProductId: number, index: number) {
  const file = await download(input, /^(application\/(pdf|zip|x-zip-compressed|octet-stream)|image\/|text\/plain)/, MAX_DELIVERY_BYTES);
  const bucket = resolveBucket('product-files');
  const key = `woocommerce/${integrationId}/${wooProductId}/deliveries/${index}-${stableName(file.finalUrl)}.${extension(file.contentType, file.finalUrl)}`;
  await uploadObject({ bucket, key, body: file.body, contentType: file.contentType });
  return { url: `minio://${bucket}/${key}`, name: name.trim().slice(0, 240) || `Arquivo ${index + 1}`, size: file.size, mimeType: file.contentType };
}

export async function mirrorWooDescriptionMedia(html: string, integrationId: string, wooProductId: number, startIndex = 100) {
  let output = html.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '').replace(/\s+srcset=(['"])[\s\S]*?\1/gi, '');
  const sources = [...new Set([...output.matchAll(/<(?:img|video|source)\b[^>]*?\ssrc=(['"])(https:\/\/[^'"]+)\1/gi)].map(match => match[2]))].slice(0, 12);
  for (const [index, source] of sources.entries()) {
    const mirrored = await mirrorWooPublicMedia(source, integrationId, wooProductId, startIndex + index);
    output = output.split(source).join(mirrored.url);
  }
  return output;
}
