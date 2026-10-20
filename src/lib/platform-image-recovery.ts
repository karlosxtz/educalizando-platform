/** Only HTTP failures for a public image; never used for delivery files. */
export class RemoteImageHttpError extends Error {
  constructor(public readonly status: number) {
    super(`Não foi possível baixar a mídia (${status}).`);
    this.name = 'RemoteImageHttpError';
  }
}

/** Recover a public original when an image transformation endpoint rejects it. */
export function originalPublicImage(input: string): string | null {
  const url = new URL(input);
  if (url.pathname.startsWith('/storage/v1/render/image/public/')) {
    url.pathname = url.pathname.replace('/storage/v1/render/image/public/', '/storage/v1/object/public/');
    url.search = '';
    return url.toString();
  }
  if (url.pathname === '/_next/image') {
    const source = url.searchParams.get('url');
    if (!source) return null;
    const original = new URL(source, url);
    if (original.protocol === 'https:' && !original.username && !original.password && original.origin === url.origin && original.pathname !== '/_next/image') return original.toString();
  }
  return null;
}

export function unavailablePublicImage(error: unknown): error is RemoteImageHttpError {
  return error instanceof RemoteImageHttpError && [400, 404, 410].includes(error.status);
}
