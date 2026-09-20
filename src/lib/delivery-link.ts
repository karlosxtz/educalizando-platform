export function isUploadedMaterial(value: string | null | undefined): boolean {
  if (!value) return false;
  if (value.startsWith('minio://')) return true;
  try {
    const url = new URL(value);
    return url.hostname.endsWith('.supabase.co') && url.pathname.includes('/storage/v1/object/');
  } catch {
    return false;
  }
}

export function normalizeDeliveryLink(value: string): string {
  const url = new URL(value.trim());
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Informe um link válido iniciado por https://.');
  }
  return url.href;
}
