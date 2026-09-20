import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/api-auth';
import { deleteObject, getObject, resolveBucket, uploadObject } from '@/lib/object-storage';

export const runtime = 'nodejs';
export const maxDuration = 60;
const chunkSize = 3 * 1024 * 1024;
const maxSize = 15 * 1024 * 1024;
type Manifest = { size: number; contentType: string; key: string; expires: number };

// Temporary parts stay in the private bucket. No client-provided object paths
// are accepted; every upload is scoped to the authenticated user and UUID.
export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Sua sessão expirou. Entre novamente.' }, { status: 401 });
  try {
    const form = await request.formData();
    const action = form.get('action');
    const bucket = resolveBucket('product-files');
    if (action === 'init') {
      const size = Number(form.get('size'));
      const name = String(form.get('name') || '');
      const contentType = String(form.get('contentType') || 'application/octet-stream');
      if (!Number.isSafeInteger(size) || size <= 0 || size > maxSize || !name || contentType.startsWith('video/')) {
        return NextResponse.json({ error: 'Envie um arquivo de até 15 MB, sem vídeo.' }, { status: 400 });
      }
      const id = randomUUID();
      const ext = name.toLowerCase().match(/\.([a-z0-9]{1,10})$/)?.[1] || 'bin';
      const manifest: Manifest = { size, contentType, key: `uploads/${user.id}/${new Date().toISOString().slice(0, 10)}/${id}.${ext}`, expires: Date.now() + 3600000 };
      await uploadObject({ bucket, key: `_pending/${user.id}/${id}/manifest.json`, body: Buffer.from(JSON.stringify(manifest)), contentType: 'application/json' });
      return NextResponse.json({ id, chunkSize });
    }
    const id = String(form.get('id') || '');
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(id)) {
      return NextResponse.json({ error: 'Envio inválido.' }, { status: 400 });
    }
    const prefix = `_pending/${user.id}/${id}/`;
    const stored = await getObject(bucket, `${prefix}manifest.json`);
    const manifest = JSON.parse(await stored.Body!.transformToString()) as Manifest;
    const count = Math.ceil(manifest.size / chunkSize);
    const cleanup = () => Promise.allSettled(Array.from({ length: count + 1 }, (_, i) =>
      deleteObject(bucket, `${prefix}${i === count ? 'manifest.json' : i}`)));
    if (action === 'cancel') {
      await cleanup();
      return NextResponse.json({ ok: true });
    }
    if (manifest.expires < Date.now()) {
      await cleanup();
      return NextResponse.json({ error: 'O envio expirou. Selecione o arquivo novamente.' }, { status: 410 });
    }
    if (action === 'chunk') {
      const index = Number(form.get('index'));
      const part = form.get('file');
      const expected = Math.min(chunkSize, manifest.size - index * chunkSize);
      if (!Number.isInteger(index) || index < 0 || index >= count || !(part instanceof File) || part.size !== expected) {
        return NextResponse.json({ error: 'Parte do arquivo inválida.' }, { status: 400 });
      }
      await uploadObject({ bucket, key: `${prefix}${index}`, body: new Uint8Array(await part.arrayBuffer()), contentType: 'application/octet-stream' });
      return NextResponse.json({ ok: true });
    }
    if (action === 'complete') {
      const parts: Uint8Array[] = [];
      for (let i = 0; i < count; i++) {
        const part = await getObject(bucket, `${prefix}${i}`);
        const bytes = await part.Body!.transformToByteArray();
        if (bytes.length !== Math.min(chunkSize, manifest.size - i * chunkSize)) throw new Error('Invalid part size');
        parts.push(bytes);
      }
      await uploadObject({ bucket, key: manifest.key, body: Buffer.concat(parts), contentType: manifest.contentType });
      await cleanup();
      return NextResponse.json({ value: `minio://${bucket}/${manifest.key}` });
    }
    return NextResponse.json({ error: 'Operação inválida.' }, { status: 400 });
  } catch (error) {
    const name = error instanceof Error ? error.name : 'Unknown';
    console.error('[Storage] Upload de material:', name);
    const denied = ['AccessDenied', 'InvalidAccessKeyId', 'SignatureDoesNotMatch'].includes(name);
    return NextResponse.json({ error: denied
      ? 'O armazenamento recusou a credencial da aplicação. Verifique a chave de acesso do deploy na Vercel.'
      : 'Não foi possível gravar o material. Tente novamente; se persistir, consulte os logs do upload.' }, { status: 502 });
  }
}
