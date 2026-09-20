import { supabase } from '@/lib/supabase';

export type UploadBucket = 'product-covers' | 'product-files' | 'store-assets' | 'student-avatars' | 'main-banners';

type ImageUploadResult = { value: string };

export async function uploadToObjectStorage(bucket: UploadBucket, file: File): Promise<string> {
  // O app mantém a sessão do Supabase no armazenamento do navegador. A rota de
  // presign precisa receber explicitamente o token para identificar quem está
  // enviando o arquivo; cookies SSR não estão disponíveis neste fluxo legado.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Sua sessão expirou. Entre novamente para enviar arquivos.');
  }

  // Imagens são comprimidas no navegador para até 1,5 MB. Enviá-las pela API
  // da própria plataforma evita bloqueios de CSP/CORS em logos, capas e fotos.
  if (bucket !== 'product-files') {
    const form = new FormData();
    form.append('bucket', bucket);
    form.append('file', file);
    const response = await fetch('/api/storage/upload-image', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: form,
    });
    const payload = await response.json().catch(() => ({})) as Partial<ImageUploadResult> & { error?: string };
    if (!response.ok || !payload.value) {
      throw new Error(payload.error || 'Não foi possível enviar a imagem.');
    }
    return payload.value;
  }

  // Each request stays below Vercel's body limit, including for 15 MB files.
  const send = async (fields: Record<string, string | Blob>) => {
    const form = new FormData();
    Object.entries(fields).forEach(([key, value]) => form.append(key, value));
    let response: Response;
    try {
      response = await fetch('/api/storage/upload-file', {
        method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, body: form,
      });
    } catch {
      throw new Error('A conexão com a plataforma foi interrompida durante o envio. Tente novamente.');
    }
    const result = await response.json().catch(() => ({})) as { id?: string; chunkSize?: number; value?: string; error?: string };
    if (!response.ok) throw new Error(result.error || `Falha no envio do material (HTTP ${response.status}).`);
    return result;
  };
  const ticket = await send({ action: 'init', name: file.name, size: String(file.size), contentType: file.type || 'application/octet-stream' });
  if (!ticket.id || !ticket.chunkSize) throw new Error('Não foi possível iniciar o envio.');
  try {
    for (let offset = 0, index = 0; offset < file.size; offset += ticket.chunkSize, index++) {
      await send({ action: 'chunk', id: ticket.id, index: String(index), file: file.slice(offset, offset + ticket.chunkSize) });
    }
    const result = await send({ action: 'complete', id: ticket.id });
    if (!result.value) throw new Error('O armazenamento não confirmou o arquivo.');
    return result.value;
  } catch (error) {
    await send({ action: 'cancel', id: ticket.id }).catch(() => undefined);
    throw error;
  }
}
