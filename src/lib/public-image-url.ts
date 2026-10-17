/** Existing anonymous image bucket; private materials never use this address. */
export function publicImageObjectUrl(bucket: string, key: string): string | null {
  if (bucket !== 'public-images' || !key.startsWith('uploads/') || key.length > 2048
    || /[\\\u0000-\u001f\u007f]/.test(key)
    || key.split('/').some(part => !part || part === '.' || part === '..')
    || !/\.(png|jpe?g|webp|gif|avif|svg)$/i.test(key)) return null;
  return 'https://arquivos.educalizando.com.br/public-images/' + key.split('/').map(encodeURIComponent).join('/');
}

/** Resolve existing public references only; never sign or expose a private URI. */
export function directPublicImageUrl(value: string): string | null {
  try {
    const url = new URL(value, 'https://www.educalizando.com.br');
    const platform = ['www.educalizando.com.br', 'educalizando.com.br', 'localhost', '127.0.0.1'].includes(url.hostname);
    if (platform && /^\/api\/storage\/public-(image|media)$/.test(url.pathname)) {
      return publicImageObjectUrl(url.searchParams.get('bucket') || '', url.searchParams.get('key') || '');
    }
    if (platform && url.pathname.startsWith('/media/catalogo/')) {
      return publicImageObjectUrl('public-images', decodeURIComponent(url.pathname.slice('/media/catalogo/'.length)));
    }
    return null;
  } catch { return null; }
}

/** Bypass expensive application rendering for legacy, already-public image links. */
export function publicImageRedirect(request: Request): Response | null {
  const url = new URL(request.url);
  if (!['GET', 'HEAD'].includes(request.method) || url.pathname !== '/api/storage/public-image') return null;
  const target = publicImageObjectUrl(url.searchParams.get('bucket') || '', url.searchParams.get('key') || '');
  if (!target) return null;
  return new Response(null, { status: 302, headers: {
    Location: target,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  } });
}
