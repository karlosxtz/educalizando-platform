export type UploadBucket = 'product-covers' | 'product-files' | 'plr-files' | 'store-assets' | 'student-avatars' | 'main-banners';
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const buckets = new Set<UploadBucket>(['product-covers', 'product-files', 'plr-files', 'store-assets', 'student-avatars', 'main-banners']);
const imageExtensions: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'], 'image/png': ['png'], 'image/webp': ['webp'], 'image/gif': ['gif'], 'image/avif': ['avif'],
};
const videoExtensions = /\.(mp4|mov|avi|mkv|webm|flv|mpeg|mpg|m4v|3gp|wmv)$/i;
export type UploadMetadata = { bucket: UploadBucket; fileName: string; contentType: string; size: number; materialName?: string };

export function validateUploadMetadata(value: unknown): UploadMetadata {
  if (!value || typeof value !== 'object') throw new Error('Dados do arquivo inválidos.');
  const body = value as Record<string, unknown>;
  if (typeof body.bucket !== 'string' || !buckets.has(body.bucket as UploadBucket)
    || typeof body.fileName !== 'string' || !body.fileName.trim() || body.fileName.length > 255
    || /[\u0000-\u001f\u007f]/.test(body.fileName)
    || typeof body.contentType !== 'string' || body.contentType.length > 128
    || !/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i.test(body.contentType)) throw new Error('Dados do arquivo inválidos.');
  if (!Number.isSafeInteger(body.size) || Number(body.size) <= 0 || Number(body.size) > MAX_UPLOAD_BYTES) {
    throw new Error('O arquivo deve ter no máximo 15 MB e não pode estar vazio.');
  }
  if (body.contentType.startsWith('video/') || videoExtensions.test(body.fileName)) throw new Error('O envio de vídeos não é permitido.');
  if (body.bucket !== 'product-files' && body.bucket !== 'plr-files') {
    const ext = body.fileName.toLowerCase().split('.').pop() || '';
    if (!imageExtensions[body.contentType]?.includes(ext)) throw new Error('Envie uma imagem PNG, JPG, WEBP, GIF ou AVIF.');
  }
  if (body.materialName !== undefined && (typeof body.materialName !== 'string' || body.materialName.length > 300)) throw new Error('Nome do material inválido.');
  return body as UploadMetadata;
}

export type DirectUploadTicket = { uploadUrl: string; value: string; uploadHeaders: Record<string, string>; expiresIn: number };

/** Only metadata uses the app; binary data and a fresh signature go to MinIO. */
export async function sendDirectStorageUpload(file: File, authorize: () => Promise<DirectUploadTicket>, send: typeof fetch = fetch): Promise<string> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const ticket = await authorize();
    const url = new URL(ticket.uploadUrl);
    if (url.origin !== 'https://arquivos.educalizando.com.br' || url.username || url.password
      || !url.searchParams.has('X-Amz-Signature')) throw new Error('Endereço de armazenamento inválido.');
    const headers: Record<string, string> = { 'Content-Type': file.type || 'application/octet-stream' };
    if (ticket.uploadHeaders?.['Content-Type'] !== headers['Content-Type']) throw new Error('A autorização não corresponde ao tipo do arquivo.');
    const cache = ticket.uploadHeaders?.['Cache-Control'];
    if (!['public, max-age=31536000, immutable', 'private, no-store'].includes(cache)) throw new Error('Autorização de armazenamento inválida.');
    headers['Cache-Control'] = cache;
    let response: Response;
    try {
      response = await send(ticket.uploadUrl, { method: 'PUT', body: file, headers, credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(120000) });
    } catch {
      if (!attempt) continue;
      throw new Error('Não foi possível conectar ao armazenamento. Verifique sua conexão e tente novamente.');
    }
    if (response.ok) return ticket.value;
    await response.body?.cancel();
    if (!attempt && [401, 403, 408, 429, 500, 502, 503, 504].includes(response.status)) continue;
    throw new Error('O armazenamento não confirmou o envio. Tente novamente em instantes.');
  }
  throw new Error('Não foi possível concluir o envio.');
}
