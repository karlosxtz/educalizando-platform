import { supabase } from '@/lib/supabase';

export type UploadBucket = 'product-covers' | 'product-files' | 'store-assets' | 'student-avatars' | 'main-banners';

type UploadTicket = { uploadUrl: string; value: string };

export async function uploadToObjectStorage(bucket: UploadBucket, file: File): Promise<string> {
  // O app mantém a sessão do Supabase no armazenamento do navegador. A rota de
  // presign precisa receber explicitamente o token para identificar quem está
  // enviando o arquivo; cookies SSR não estão disponíveis neste fluxo legado.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Sua sessão expirou. Entre novamente para enviar arquivos.');
  }

  const response = await fetch('/api/storage/presign-upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      bucket,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      size: file.size,
    }),
  });
  const payload = await response.json().catch(() => ({})) as Partial<UploadTicket> & { error?: string };
  if (!response.ok || !payload.uploadUrl || !payload.value) {
    throw new Error(payload.error || 'Não foi possível preparar o envio do arquivo.');
  }

  const upload = await fetch(payload.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });
  if (!upload.ok) {
    const detail = (await upload.text()).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    throw new Error(detail
      ? `O armazenamento recusou o envio (${upload.status}): ${detail.slice(0, 180)}`
      : `O armazenamento recusou o envio (HTTP ${upload.status}).`);
  }
  return payload.value;
}
