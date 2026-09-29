export type StoreSocialPlatform = 'instagram' | 'youtube' | 'tiktok' | 'facebook' | 'website';

type StoreSocialFields = Partial<Record<StoreSocialPlatform, string | null | undefined>>;

const SOCIAL_BASE_URLS: Record<Exclude<StoreSocialPlatform, 'website'>, string> = {
  instagram: 'https://www.instagram.com/',
  youtube: 'https://www.youtube.com/@',
  tiktok: 'https://www.tiktok.com/@',
  facebook: 'https://www.facebook.com/',
};

const FORBIDDEN_PROTOCOL = /^(?:javascript|data|vbscript|file):/i;
const HANDLE_PATTERN = /^[a-z0-9._-]+$/i;

function parseHttpUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Converte links informados no painel em URLs externas absolutas.
 * Aceita URL completa, domínio sem protocolo e @usuário nas redes sociais.
 */
export function normalizeExternalUrl(
  rawValue: string | null | undefined,
  platform: StoreSocialPlatform,
): string | null {
  const value = rawValue?.trim();
  if (!value || FORBIDDEN_PROTOCOL.test(value) || /[\u0000-\u001F\u007F]/.test(value)) return null;

  if (value.startsWith('//')) return parseHttpUrl(`https:${value}`);
  if (/^https?:\/\//i.test(value)) return parseHttpUrl(value);

  // Um domínio ou endereço com caminho recebe HTTPS para não virar rota interna.
  if (/^(?:www\.)?[^\s/]+\.[^\s/]+(?:\/[^\s]*)?$/i.test(value)) {
    return parseHttpUrl(`https://${value}`);
  }

  if (platform === 'website') return null;

  const handle = value.replace(/^@/, '').replace(/\/$/, '');
  if (!HANDLE_PATTERN.test(handle)) return null;
  return `${SOCIAL_BASE_URLS[platform]}${encodeURIComponent(handle)}`;
}

/**
 * Normaliza somente os campos sociais presentes no objeto e preserva os demais.
 * Assim registros antigos também funcionam sem exigir migration no banco.
 */
export function normalizeStoreSocialLinks<T extends StoreSocialFields>(source: T): T {
  const normalized = { ...source } as T;
  const platforms: StoreSocialPlatform[] = ['instagram', 'youtube', 'tiktok', 'facebook', 'website'];

  for (const platform of platforms) {
    if (Object.prototype.hasOwnProperty.call(source, platform)) {
      normalized[platform] = normalizeExternalUrl(source[platform], platform) as T[typeof platform];
    }
  }

  return normalized;
}
