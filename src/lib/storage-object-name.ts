export function storageName(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90).replace(/-+$/g, '') || fallback;
}

export function materialObjectKey(input: { userId: string; creator: unknown; material: unknown; fileName: string; id: string; extension: string }) {
  const creator = storageName(input.creator, 'criador');
  const material = storageName(input.material, storageName(input.fileName.replace(/\.[^.]+$/, ''), 'material'));
  const file = storageName(input.fileName.replace(/\.[^.]+$/, ''), 'arquivo');
  const ext = /^[a-z0-9]{1,10}$/.test(input.extension) ? input.extension : 'bin';
  return `uploads/${input.userId}/${creator}/${material}/${material}-${file}-${input.id}.${ext}`;
}
