export type UploadBucket = 'product-covers' | 'product-files' | 'store-assets' | 'student-avatars' | 'main-banners';

type UploadTicket = { uploadUrl: string; value: string };

export async function uploadToObjectStorage(bucket: UploadBucket, file: File): Promise<string> {
  const response = await fetch('/api/storage/presign-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  if (!upload.ok) throw new Error('O armazenamento recusou o envio do arquivo. Tente novamente.');
  return payload.value;
}
