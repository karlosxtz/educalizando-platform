import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';
import { normalizePublicAssetUrl } from './public-links';
import { imageUploadProfile, type ImageRole } from './image-upload-profile';
import { sendDirectStorageUpload, validateUploadMetadata, type DirectUploadTicket, type UploadBucket } from './direct-storage-upload';
export type { UploadBucket } from './direct-storage-upload';

export async function uploadToObjectStorage(bucket: UploadBucket, source: File, options: { materialName?: string; imageRole?: ImageRole } = {}): Promise<string> {
  let file = source;
  // Also compress campaign photos and admin banners, without server processing.
  if (bucket !== 'product-files' && bucket !== 'plr-files') {
    if (source.size > 15 * 1024 * 1024 || !source.type.startsWith('image/') || source.type === 'image/svg+xml') {
      throw new Error('Envie uma imagem PNG, JPG, WEBP, GIF ou AVIF de até 15 MB.');
    }
    const profile = imageUploadProfile(bucket, options.imageRole)!;
    if (source.type !== 'image/gif') {
      const compressed = await imageCompression(source, { ...profile, initialQuality: 0.78, maxIteration: 15, useWebWorker: true, fileType: 'image/webp' });
      // A conversion must not make an already small supported image larger.
      if (compressed.size < source.size) file = new File([compressed], source.name.replace(/\.[^/.]+$/, '') + '.webp', { type: 'image/webp' });
    }
  }
  const metadata = validateUploadMetadata({ bucket, fileName: file.name, contentType: file.type || 'application/octet-stream', size: file.size, materialName: options.materialName || '' });
  const authorize = async (): Promise<DirectUploadTicket> => {
    for (let attempt = 0; attempt < 2; attempt++) {
      const sessionResult = attempt ? await supabase.auth.refreshSession() : await supabase.auth.getSession();
      const token = sessionResult.data.session?.access_token;
      if (!token || sessionResult.error) throw new Error('Sua sessão expirou. Entre novamente para enviar arquivos.');
      let response: Response;
      try {
        response = await fetch('/api/storage/presign-upload', {
          method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify(metadata), cache: 'no-store', signal: AbortSignal.timeout(25000),
        });
      } catch {
        throw new Error('Não foi possível autorizar o envio. Verifique sua conexão e tente novamente.');
      }
      if (response.status === 401 && !attempt) continue;
      const ticket = await response.json().catch(() => ({})) as Partial<DirectUploadTicket> & { error?: string };
      if (!response.ok || !ticket.uploadUrl || !ticket.value || !ticket.uploadHeaders) {
        throw new Error(ticket.error || 'Não foi possível autorizar o envio. Tente novamente em instantes.');
      }
      return ticket as DirectUploadTicket;
    }
    throw new Error('Sua sessão expirou. Entre novamente para enviar arquivos.');
  };
  const value = await sendDirectStorageUpload(file, authorize);
  return normalizePublicAssetUrl(value) || value;
}
